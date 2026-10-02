# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Contract tests for the custom RGB-D simulation launch."""

import importlib.util
from pathlib import Path
from types import SimpleNamespace

from launch.actions import DeclareLaunchArgument, ExecuteProcess, LogInfo, RegisterEventHandler
from launch_ros.actions import Node


def get_launch_actions(description):
    """Collect direct actions and actions scheduled by event handlers."""
    actions = list(description.entities)
    for action in description.entities:
        if isinstance(action, RegisterEventHandler):
            event_actions = action.event_handler._OnActionEventBase__on_event
            if not callable(event_actions):
                actions.extend(event_actions)
            else:
                actions.extend(event_actions.keywords["actions"])
    return actions


def test_rgbd_launch_exposes_slam_and_sensor_interfaces():
    """The custom robot can select one SLAM owner and remap every sensor input."""
    launch_file = Path(__file__).parents[1] / "launch" / "wandering_sim.launch.py"
    spec = importlib.util.spec_from_file_location("wandering_sim", launch_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.get_package_share_directory = lambda package: f"/share/{package}"

    description = module.generate_launch_description()
    launch_actions = get_launch_actions(description)
    arguments = {
        action.name for action in launch_actions if isinstance(action, DeclareLaunchArgument)
    }

    assert {
        "adbscan_params_file",
        "aligned_depth_topic",
        "cloud_topic",
        "fusion_params_file",
        "gui",
        "rgb_camera_info_topic",
        "rgb_topic",
        "scan_topic",
        "start_rgbd_bridge",
        "slam_backend",
        "subscribe_scan",
    } <= arguments

    slam_backend = next(
        action
        for action in launch_actions
        if isinstance(action, DeclareLaunchArgument) and action.name == "slam_backend"
    )
    assert slam_backend.choices == ["slam_toolbox", "rtabmap"]

    gui = next(
        action
        for action in launch_actions
        if isinstance(action, DeclareLaunchArgument) and action.name == "gui"
    )
    assert gui.default_value[0].text == "false"

    launch_source = launch_file.read_text()
    assert 'DeclareLaunchArgument("camera_roll", default_value="-1.5708")' in launch_source
    assert 'DeclareLaunchArgument("camera_yaw", default_value="-1.5708")' in launch_source
    assert '"max_obstacle_extent": "1.5"' in launch_source

    readiness_checks = [action for action in launch_actions if type(action) is ExecuteProcess]
    assert len(readiness_checks) == 2
    assert sum(isinstance(action, RegisterEventHandler) for action in launch_actions) == 2

    event_actions = [
        action.event_handler._OnActionEventBase__on_event.keywords["actions"]
        for action in description.entities
        if isinstance(action, RegisterEventHandler)
    ]
    cloud_ready_actions, map_ready_actions = event_actions
    cloud_ready_executables = {
        action.node_executable for action in cloud_ready_actions if isinstance(action, Node)
    }
    assert cloud_ready_executables >= {
        "rviz2",
        "rqt_image_view",
    }
    assert not any(
        isinstance(action, Node) and action.node_executable in {"rviz2", "rqt_image_view"}
        for action in map_ready_actions
    )
    assert module.actions_on_successful_exit(
        SimpleNamespace(returncode=0), None, cloud_ready_actions
    ) == cloud_ready_actions
    assert module.actions_on_successful_exit(
        SimpleNamespace(returncode=-2), None, cloud_ready_actions
    ) == []

    status_messages = [action for action in launch_actions if isinstance(action, LogInfo)]
    assert len(status_messages) == 3

    conditioned_nodes = [
        action
        for action in launch_actions
        if isinstance(action, Node) and action.condition is not None
    ]
    node_executables = {action.node_executable for action in conditioned_nodes}
    assert {"rgbd_sync", "rtabmap", "rqt_image_view"} <= node_executables

    rgb_image_view = next(
        action for action in conditioned_nodes if action.node_executable == "rqt_image_view"
    )
    assert rgb_image_view.node_package == "rqt_image_view"

    rtabmap = next(action for action in conditioned_nodes if action.node_executable == "rtabmap")
    assert rtabmap
    assert '"Grid/Sensor": "1"' in launch_source

    point_cloud_nodes = [
        action
        for action in launch_actions
        if isinstance(action, Node) and action.node_executable == "point_cloud_xyz_node"
    ]
    assert len(point_cloud_nodes) == 1
