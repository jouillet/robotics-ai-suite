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

"""Perception half of the ADBSCAN + Nav2 pipeline: sensor fusion + ADBSCAN.

Starts the point-cloud fusion node (2D LiDAR + depth camera -> fused cloud) and
the ADBSCAN node (fused cloud -> nav2_dynamic_msgs/ObstacleArray on
/obstacle_array). This is included by both the simulation and Jackal top-level
launch files, and can also be launched standalone against any robot that
publishes a LaserScan and a depth PointCloud2.
"""

# pylint: disable=duplicate-code
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, SetEnvironmentVariable
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    """Start the ADBSCAN perception pipeline (sensor fusion + ADBSCAN node)."""
    bringup_dir = get_package_share_directory("wandering_bringup")
    fusion_dir = get_package_share_directory("adbscan_sensor_fusion")

    default_fusion_params = os.path.join(fusion_dir, "config", "pointcloud_fusion.yaml")
    default_adbscan_params = os.path.join(bringup_dir, "params", "adbscan_fused.yaml")

    use_sim_time = LaunchConfiguration("use_sim_time")
    fusion_params_file = LaunchConfiguration("fusion_params_file")
    adbscan_params_file = LaunchConfiguration("adbscan_params_file")
    namespace = LaunchConfiguration("namespace")
    scan_topic = LaunchConfiguration("scan_topic")
    cloud_topic = LaunchConfiguration("cloud_topic")
    max_obstacle_extent = LaunchConfiguration("max_obstacle_extent")

    declare_use_sim_time = DeclareLaunchArgument(
        "use_sim_time", default_value="false", description="Use simulation (Gazebo) clock if true"
    )

    declare_fusion_params = DeclareLaunchArgument(
        "fusion_params_file",
        default_value=default_fusion_params,
        description="Parameters for the point-cloud fusion node",
    )

    declare_adbscan_params = DeclareLaunchArgument(
        "adbscan_params_file",
        default_value=default_adbscan_params,
        description="Parameters for the ADBSCAN node (fused-cloud tuning)",
    )

    declare_namespace = DeclareLaunchArgument(
        "namespace",
        default_value="",
        description=(
            "Robot namespace whose TF is published under <namespace>/tf. When "
            "non-empty (e.g. the Jackal /j100_0812), /tf and /tf_static are "
            "remapped so the fusion node reads the robot TF tree. Leave empty "
            "for a robot that publishes TF on the default /tf (e.g. sim)."
        ),
    )
    declare_scan_topic = DeclareLaunchArgument(
        "scan_topic", default_value="scan", description="LaserScan topic to fuse"
    )
    declare_cloud_topic = DeclareLaunchArgument(
        "cloud_topic",
        default_value="/camera/depth/color/points",
        description="PointCloud2 topic to fuse",
    )
    declare_max_obstacle_extent = DeclareLaunchArgument(
        "max_obstacle_extent",
        default_value="2.5",
        description="Largest ADBScan obstacle extent rendered in RViz, in metres",
    )

    # When a robot namespace is given, its TF is published on <ns>/tf(_static).
    # The fusion node uses TF to project the scan and transform the depth cloud
    # into base_link, so it must subscribe to the namespaced TF topics. This
    # mirrors the remapping done by the Jackal navigation launch.
    tf_remaps = [
        ("/tf", [namespace, "/tf"]),
        ("/tf_static", [namespace, "/tf_static"]),
    ]

    fusion_node = Node(
        package="adbscan_sensor_fusion",
        executable="pointcloud_fusion_node",
        name="adbscan_pointcloud_fusion",
        output="screen",
        parameters=[
            fusion_params_file,
            {
                "use_sim_time": use_sim_time,
                "scan_topic": scan_topic,
                "cloud_topic": cloud_topic,
            },
        ],
        remappings=tf_remaps,
    )

    adbscan_node = Node(
        package="adbscan_ros2",
        executable="adbscan_sub",
        name="adbscan_sub_node",
        output="screen",
        parameters=[adbscan_params_file, {"use_sim_time": use_sim_time}],
    )

    obstacle_markers = Node(
        package="nav2_adbscan_layer",
        executable="adbscan_obstacle_markers",
        name="adbscan_obstacle_markers",
        output="screen",
        parameters=[
            {
                "use_sim_time": use_sim_time,
                "max_obstacle_extent": max_obstacle_extent,
            }
        ],
    )

    return LaunchDescription(
        [
            SetEnvironmentVariable("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp"),
            declare_use_sim_time,
            declare_fusion_params,
            declare_adbscan_params,
            declare_namespace,
            declare_scan_topic,
            declare_cloud_topic,
            declare_max_obstacle_extent,
            fusion_node,
            adbscan_node,
            obstacle_markers,
        ]
    )
