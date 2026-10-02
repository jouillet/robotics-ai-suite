# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Static contracts for the reusable Gazebo RGB-D assets."""

from pathlib import Path
import xml.etree.ElementTree as ET

import yaml


PACKAGE_ROOT = Path(__file__).parents[1]


def test_generic_rgbd_model_publishes_optical_frame_data():
    """One aligned sensor provides all RGB-D streams in a ROS optical frame."""
    model = ET.parse(  # nosec B314
        PACKAGE_ROOT / "models" / "generic_rgbd_camera" / "model.sdf"
    )
    sensor = model.find(".//sensor[@type='rgbd_camera']")

    assert sensor is not None
    assert sensor.findtext("topic") == "/rgbd_camera"
    assert sensor.findtext("camera/optical_frame_id") == "camera_rgb_optical_frame"
    assert sensor.findtext("camera/image/width") == "320"
    assert sensor.findtext("camera/image/height") == "240"


def test_bridge_exposes_complete_rgbd_contract():
    """The bridge maps aligned images, calibration, and points to stable ROS topics."""
    bridge_file = PACKAGE_ROOT / "params" / "rgbd_camera_bridge.yaml"
    entries = yaml.safe_load(bridge_file.read_text(encoding="utf-8"))
    topics = {entry["ros_topic_name"]: entry for entry in entries}

    assert set(topics) == {
        "/camera/color/image_raw",
        "/camera/color/camera_info",
        "/camera/aligned_depth_to_color/image_raw",
        "/camera/aligned_depth_to_color/camera_info",
    }


def test_rgbd_bridge_uses_standard_optical_frame_rotation():
    """The ROS optical frame must rotate Gazebo camera axes into REP 103 axes."""
    bridge_launch = (PACKAGE_ROOT / "launch" / "dep_rgbd_camera_bridge.launch.py").read_text(
        encoding="utf-8"
    )

    assert 'DeclareLaunchArgument("camera_roll", default_value="-1.5708")' in bridge_launch
    assert 'DeclareLaunchArgument("camera_yaw", default_value="-1.5708")' in bridge_launch


def test_rviz_layouts_render_the_rgbd_color_images():
    """Every global RGB-D layout exposes the color stream used by RTAB-Map."""
    expected_displays = {
        "adbscan_nav2.rviz": (
            "RealSense Color Image",
            "/j100_0812/sensors/camera_0/color/image",
        ),
        "adbscan_nav2_manual.rviz": (
            "RealSense Color Image",
            "/j100_0812/sensors/camera_0/color/image",
        ),
    }

    for layout_name, (display_name, topic) in expected_displays.items():
        layout = yaml.safe_load((PACKAGE_ROOT / "rviz" / layout_name).read_text(encoding="utf-8"))
        displays = layout["Visualization Manager"]["Displays"]
        image_display = next(display for display in displays if display["Name"] == display_name)

        assert image_display["Class"] == "rviz_default_plugins/Image"
        assert image_display["Enabled"] is True
        assert image_display["Topic"]["Value"] == topic


def test_rgbd_global_rviz_has_manual_wandering_controls():
    """The RGB-D global view lets an operator pause exploration and send Nav2 goals."""
    layout = yaml.safe_load(
        (PACKAGE_ROOT / "rviz" / "adbscan_nav2_sim.rviz").read_text(encoding="utf-8")
    )
    panels = layout["Panels"]
    tools = layout["Visualization Manager"]["Tools"]

    assert {panel["Class"] for panel in panels} >= {
        "nav2_rviz_plugins/Navigation 2",
        "wandering_app/Wandering Control",
    }
    assert "nav2_rviz_plugins/GoalTool" in {tool["Class"] for tool in tools}


def test_rgbd_fusion_uses_continuous_depth_cloud():
    """ADBSCAN should not wait for a scan-to-camera synchronization in simulation."""
    fusion_file = PACKAGE_ROOT / "params" / "pointcloud_fusion_rgbd_sim.yaml"
    parameters = yaml.safe_load(fusion_file.read_text(encoding="utf-8"))[
        "adbscan_pointcloud_fusion"
    ]["ros__parameters"]

    assert parameters["fuse_scan"] is False
    assert parameters["fuse_cloud"] is True
    assert parameters["min_z"] == -0.35
    assert parameters["max_z"] == 1.50
    assert parameters["remove_ground"] is True
    assert parameters["ground_distance_threshold"] == 0.06
    assert parameters["voxel_leaf_size"] == 0.05


def test_rgbd_nav2_profile_uses_depth_for_collision_monitoring():
    """The RGB-D simulator uses its continuous depth cloud for collision monitoring."""
    profile = yaml.safe_load(
        (PACKAGE_ROOT / "params" / "nav2_adbscan_sim.param.yaml").read_text(encoding="utf-8")
    )["collision_monitor"]["ros__parameters"]

    assert profile["base_frame_id"] == "base_link"
    assert profile["observation_sources"] == ["depth_cloud"]
    assert profile["depth_cloud"]["type"] == "pointcloud"
    assert profile["depth_cloud"]["topic"] == "/camera/depth/color/points"


def test_rgbd_nav2_profile_rejects_merged_obstacle_clusters():
    """Merged depth clusters must not close robot-width passages in either costmap."""
    profile = yaml.safe_load(
        (PACKAGE_ROOT / "params" / "nav2_adbscan_sim.param.yaml").read_text(encoding="utf-8")
    )

    for costmap_name in ("local_costmap", "global_costmap"):
        adbscan_layer = profile[costmap_name][costmap_name]["ros__parameters"]["adbscan_layer"]
        assert adbscan_layer["max_obstacle_extent"] == 0.75


def test_fused_adbscan_reports_cluster_results():
    """The simulator profile exposes bounded 3D clustering diagnostics."""
    profile = yaml.safe_load(
        (PACKAGE_ROOT / "params" / "adbscan_fused.yaml").read_text(encoding="utf-8")
    )["adbscan_sub_node"]["ros__parameters"]

    assert profile["enable_console_output"] is True
    assert profile["scale_factor"] == 0.20
    assert profile["min_3d_epsilon"] == 0.15


def test_waffle_adapter_composes_the_generic_payload():
    """Robot adapters merge the payload instead of copying its sensor definition."""
    adapter = ET.parse(  # nosec B314
        PACKAGE_ROOT / "models" / "turtlebot3_waffle_rgbd" / "model.sdf"
    )
    includes = {element.findtext("uri") for element in adapter.findall(".//include")}

    assert includes == {"model://turtlebot3_waffle", "model://generic_rgbd_camera"}
    assert adapter.findtext(".//joint/parent") == "base_link"
    assert adapter.findtext(".//joint/child") == "rgbd_camera_link"
