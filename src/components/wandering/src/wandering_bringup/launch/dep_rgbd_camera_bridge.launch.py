#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

"""Bridge the generic Gazebo RGB-D sensor and publish its mounting transform."""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    """Bridge RGB-D outputs and connect the optical frame to the robot TF tree."""
    bringup_dir = get_package_share_directory("wandering_bringup")
    default_bridge_config = os.path.join(bringup_dir, "params", "rgbd_camera_bridge.yaml")

    bridge_config = LaunchConfiguration("bridge_config")
    parent_frame = LaunchConfiguration("parent_frame")
    optical_frame = LaunchConfiguration("optical_frame")
    camera_x = LaunchConfiguration("camera_x")
    camera_y = LaunchConfiguration("camera_y")
    camera_z = LaunchConfiguration("camera_z")
    camera_roll = LaunchConfiguration("camera_roll")
    camera_pitch = LaunchConfiguration("camera_pitch")
    camera_yaw = LaunchConfiguration("camera_yaw")
    use_sim_time = LaunchConfiguration("use_sim_time")

    bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="rgbd_camera_bridge",
        output="screen",
        parameters=[{"config_file": bridge_config, "use_sim_time": use_sim_time}],
    )

    optical_tf = Node(
        package="tf2_ros",
        executable="static_transform_publisher",
        name="rgbd_camera_static_tf",
        output="screen",
        arguments=[
            "--x",
            camera_x,
            "--y",
            camera_y,
            "--z",
            camera_z,
            "--roll",
            camera_roll,
            "--pitch",
            camera_pitch,
            "--yaw",
            camera_yaw,
            "--frame-id",
            parent_frame,
            "--child-frame-id",
            optical_frame,
        ],
        parameters=[{"use_sim_time": use_sim_time}],
    )

    return LaunchDescription(
        [
            DeclareLaunchArgument("use_sim_time", default_value="true"),
            DeclareLaunchArgument("bridge_config", default_value=default_bridge_config),
            DeclareLaunchArgument("parent_frame", default_value="base_link"),
            DeclareLaunchArgument("optical_frame", default_value="camera_rgb_optical_frame"),
            DeclareLaunchArgument("camera_x", default_value="0.10"),
            DeclareLaunchArgument("camera_y", default_value="0.0"),
            DeclareLaunchArgument("camera_z", default_value="0.20"),
            DeclareLaunchArgument("camera_roll", default_value="-1.5708"),
            DeclareLaunchArgument("camera_pitch", default_value="0.0"),
            DeclareLaunchArgument("camera_yaw", default_value="-1.5708"),
            bridge,
            optical_tf,
        ]
    )
