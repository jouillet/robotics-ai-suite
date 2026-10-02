#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

"""Start Gazebo Sim with the TurtleBot3 Waffle RGB-D composition example."""

import os

from ament_index_python.packages import get_package_prefix, get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    AppendEnvironmentVariable,
    DeclareLaunchArgument,
    ExecuteProcess,
    IncludeLaunchDescription,
    SetEnvironmentVariable,
    Shutdown,
)
from launch.conditions import IfCondition, UnlessCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():  # pylint: disable=too-many-locals
    """Start the TurtleBot world, robot base interfaces, and RGB-D model."""
    bringup_dir = get_package_share_directory("wandering_bringup")
    turtlebot3_dir = get_package_share_directory("turtlebot3_gazebo")
    gz_executable = os.path.join(
        get_package_prefix("gz_tools_vendor"), "opt", "gz_tools_vendor", "bin", "gz"
    )

    use_sim_time = LaunchConfiguration("use_sim_time")
    gui = LaunchConfiguration("gui")
    world = LaunchConfiguration("world")
    x_pose = LaunchConfiguration("x_pose")
    y_pose = LaunchConfiguration("y_pose")
    yaw = LaunchConfiguration("yaw")

    default_world = os.path.join(turtlebot3_dir, "worlds", "turtlebot3_world.world")
    base_bridge_config = os.path.join(turtlebot3_dir, "params", "turtlebot3_waffle_bridge.yaml")

    gazebo_gui = ExecuteProcess(
        cmd=["ruby", gz_executable, "sim", "-r", "-v2", world, "--force-version", "8"],
        name="gazebo",
        condition=IfCondition(gui),
        output="screen",
        on_exit=Shutdown(),
    )

    gazebo_headless = ExecuteProcess(
        cmd=["ruby", gz_executable, "sim", "-r", "-v2", "-s", world, "--force-version", "8"],
        name="gazebo",
        condition=UnlessCondition(gui),
        output="screen",
        on_exit=Shutdown(),
    )

    robot_state_publisher = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(turtlebot3_dir, "launch", "robot_state_publisher.launch.py")
        ),
        launch_arguments={"use_sim_time": use_sim_time}.items(),
    )

    spawn = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(bringup_dir, "launch", "dep_spawn_rgbd_robot.launch.py")
        ),
        launch_arguments={
            "entity_name": "waffle_rgbd",
            "x_pose": x_pose,
            "y_pose": y_pose,
            "yaw": yaw,
        }.items(),
    )

    base_bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="turtlebot3_base_bridge",
        output="screen",
        parameters=[{"config_file": base_bridge_config, "use_sim_time": use_sim_time}],
    )

    return LaunchDescription(
        [
            SetEnvironmentVariable("TURTLEBOT3_MODEL", "waffle"),
            AppendEnvironmentVariable(
                "GZ_SIM_RESOURCE_PATH", os.path.join(bringup_dir, "models")
            ),
            AppendEnvironmentVariable(
                "GZ_SIM_RESOURCE_PATH", os.path.join(turtlebot3_dir, "models")
            ),
            DeclareLaunchArgument("use_sim_time", default_value="true"),
            DeclareLaunchArgument(
                "gui",
                default_value="false",
                description="Start the Gazebo graphical client",
            ),
            DeclareLaunchArgument("world", default_value=default_world),
            DeclareLaunchArgument("x_pose", default_value="-2.0"),
            DeclareLaunchArgument("y_pose", default_value="-0.5"),
            DeclareLaunchArgument("yaw", default_value="0.0"),
            gazebo_gui,
            gazebo_headless,
            robot_state_publisher,
            spawn,
            base_bridge,
        ]
    )
