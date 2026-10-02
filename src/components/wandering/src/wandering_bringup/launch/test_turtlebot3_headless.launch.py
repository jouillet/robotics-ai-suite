#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

"""Start TurtleBot3 Waffle in Gazebo without the GUI client."""

import os

from ament_index_python.packages import get_package_prefix, get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    AppendEnvironmentVariable,
    DeclareLaunchArgument,
    ExecuteProcess,
    IncludeLaunchDescription,
    Shutdown,
)
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration


def generate_launch_description():
    """Start the Gazebo server, robot state publisher, and TurtleBot3 spawn action."""
    turtlebot_dir = get_package_share_directory("turtlebot3_gazebo")
    launch_dir = os.path.join(turtlebot_dir, "launch")
    world = os.path.join(turtlebot_dir, "worlds", "turtlebot3_world.world")
    gz_executable = os.path.join(
        get_package_prefix("gz_tools_vendor"), "opt", "gz_tools_vendor", "bin", "gz"
    )
    use_sim_time = LaunchConfiguration("use_sim_time")

    gazebo_server = ExecuteProcess(
        cmd=["ruby", gz_executable, "sim", "-r", "-s", "-v2", world, "--force-version", "8"],
        name="gazebo",
        output="screen",
        on_exit=Shutdown(),
    )
    robot_state_publisher = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(launch_dir, "robot_state_publisher.launch.py")),
        launch_arguments={"use_sim_time": use_sim_time}.items(),
    )
    spawn_robot = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(os.path.join(launch_dir, "spawn_turtlebot3.launch.py")),
        launch_arguments={"x_pose": "-2.0", "y_pose": "-0.5"}.items(),
    )

    return LaunchDescription(
        [
            AppendEnvironmentVariable(
                "GZ_SIM_RESOURCE_PATH", os.path.join(turtlebot_dir, "models")
            ),
            DeclareLaunchArgument("use_sim_time", default_value="true"),
            gazebo_server,
            robot_state_publisher,
            spawn_robot,
        ]
    )
