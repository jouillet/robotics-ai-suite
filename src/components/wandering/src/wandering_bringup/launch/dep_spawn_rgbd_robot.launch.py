#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

"""Spawn a robot model composed with the reusable RGB-D sensor payload."""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import AppendEnvironmentVariable, DeclareLaunchArgument, TimerAction
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    """Spawn a composed SDF model into an already-running Gazebo world."""
    bringup_dir = get_package_share_directory("wandering_bringup")
    models_dir = os.path.join(bringup_dir, "models")
    turtlebot3_models_dir = os.path.join(
        get_package_share_directory("turtlebot3_gazebo"), "models"
    )
    default_model_file = os.path.join(models_dir, "turtlebot3_waffle_rgbd", "model.sdf")

    model_file = LaunchConfiguration("model_file")
    entity_name = LaunchConfiguration("entity_name")
    x_pose = LaunchConfiguration("x_pose")
    y_pose = LaunchConfiguration("y_pose")
    z_pose = LaunchConfiguration("z_pose")
    yaw = LaunchConfiguration("yaw")

    spawn = Node(
        package="ros_gz_sim",
        executable="create",
        name="spawn_rgbd_robot",
        output="screen",
        arguments=[
            "-world",
            "default",
            "-name",
            entity_name,
            "-file",
            model_file,
            "-x",
            x_pose,
            "-y",
            y_pose,
            "-z",
            z_pose,
            "-Y",
            yaw,
        ],
    )

    return LaunchDescription(
        [
            AppendEnvironmentVariable("GZ_SIM_RESOURCE_PATH", models_dir),
            AppendEnvironmentVariable("GZ_SIM_RESOURCE_PATH", turtlebot3_models_dir),
            DeclareLaunchArgument("model_file", default_value=default_model_file),
            DeclareLaunchArgument("entity_name", default_value="rgbd_robot"),
            DeclareLaunchArgument("x_pose", default_value="0.0"),
            DeclareLaunchArgument("y_pose", default_value="0.0"),
            DeclareLaunchArgument("z_pose", default_value="0.01"),
            DeclareLaunchArgument("yaw", default_value="0.0"),
            TimerAction(period=3.0, actions=[spawn]),
        ]
    )
