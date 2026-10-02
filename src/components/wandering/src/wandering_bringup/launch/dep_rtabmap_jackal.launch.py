#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions
# and limitations under the License.

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition, UnlessCondition
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    localization = LaunchConfiguration("localization")
    params_file = LaunchConfiguration("params_file")
    database_path = LaunchConfiguration("database_path")
    robot_namespace = LaunchConfiguration("robot_namespace")
    camera_namespace = LaunchConfiguration("camera_namespace")
    rgb_image_topic = LaunchConfiguration("rgb_image_topic")
    rgb_camera_info_topic = LaunchConfiguration("rgb_camera_info_topic")
    aligned_depth_topic = LaunchConfiguration("aligned_depth_topic")

    remappings = [
        ("rgbd_image", [camera_namespace, "/camera/rgbd_image"]),
        ("/tf", [robot_namespace, "/tf"]),
        ("/tf_static", [robot_namespace, "/tf_static"]),
    ]

    remapping_rs = [
        ("rgbd_image", [camera_namespace, "/camera/rgbd_image"]),
        ("rgb/image", rgb_image_topic),
        ("rgb/camera_info", rgb_camera_info_topic),
        ("depth/image", aligned_depth_topic),
    ]

    return LaunchDescription(
        [
            DeclareLaunchArgument(
                "qos", default_value="2", description="QoS used for input sensor topics"
            ),
            DeclareLaunchArgument(
                "localization", default_value="false", description="Launch in localization mode."
            ),
            DeclareLaunchArgument(
                "params_file",
                default_value=os.path.join(
                    get_package_share_directory("wandering_bringup"),
                    "params",
                    "jackal_nav.param.yaml",
                ),
                description="Full path to the ROS2 parameters file to use for all launched nodes",
            ),
            DeclareLaunchArgument(
                "database_path",
                default_value="~/.ros/rtabmap.db",
                description="RTAB-Map database saved during SLAM or loaded for localization",
            ),
            DeclareLaunchArgument(
                "robot_namespace",
                default_value=os.environ.get("ROBOT_NAMESPACE", "/j100_0123"),
                description="Clearpath base-service namespace that publishes TF",
            ),
            DeclareLaunchArgument(
                "camera_namespace",
                default_value=[robot_namespace, "/sensors/camera_0"],
                description="Clearpath RealSense camera namespace",
            ),
            DeclareLaunchArgument(
                "rgb_image_topic",
                default_value=[camera_namespace, "/color/image"],
                description="RGB image topic used by RTAB-Map",
            ),
            DeclareLaunchArgument(
                "rgb_camera_info_topic",
                default_value=[camera_namespace, "/color/camera_info"],
                description="CameraInfo topic paired with rgb_image_topic",
            ),
            DeclareLaunchArgument(
                "aligned_depth_topic",
                default_value=[camera_namespace, "/aligned_depth_to_color/image"],
                description="Depth image aligned to rgb_image_topic",
            ),
            # SLAM node:
            Node(
                package="rtabmap_sync",
                executable="rgbd_sync",
                remappings=remapping_rs,
                parameters=[{"approx_sync": True}],
            ),
            Node(
                condition=UnlessCondition(localization),
                package="rtabmap_slam",
                executable="rtabmap",
                output="screen",
                parameters=[params_file, {"database_path": database_path}],
                remappings=remappings,
                arguments=["-d"],
            ),  # This will delete the previous database (~/.ros/rtabmap.db)
            # Localization node:
            Node(
                condition=IfCondition(localization),
                package="rtabmap_slam",
                executable="rtabmap",
                output="screen",
                parameters=[
                    params_file,
                    {"database_path": database_path},
                    {"Mem/IncrementalMemory": "False", "Mem/InitWMWithAllNodes": "True"},
                ],
                remappings=remappings,
            ),
        ]
    )
