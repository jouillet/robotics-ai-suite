#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

"""ADBSCAN + Nav2 Jackal bringup with RViz manual exploration controls."""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, SetEnvironmentVariable
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import EnvironmentVariable, LaunchConfiguration, PythonExpression
from launch_ros.actions import Node


def generate_launch_description():
    """Launch autonomous mapping with an RViz panel for manual override."""
    bringup_dir = get_package_share_directory("wandering_bringup")
    manual_rviz = LaunchConfiguration("manual_rviz")
    enable_adbscan = LaunchConfiguration("enable_adbscan")
    params_file = LaunchConfiguration("params_file")
    fusion_params_file = LaunchConfiguration("fusion_params_file")
    adbscan_params_file = LaunchConfiguration("adbscan_params_file")
    localization = LaunchConfiguration("localization")
    rtabmap_database_path = LaunchConfiguration("rtabmap_database_path")
    depth_image_topic = LaunchConfiguration("depth_image_topic")
    depth_camera_info_topic = LaunchConfiguration("depth_camera_info_topic")
    pointcloud_topic = LaunchConfiguration("pointcloud_topic")
    scan_frame = LaunchConfiguration("scan_frame")
    camera_namespace = LaunchConfiguration("camera_namespace")
    rgb_image_topic = LaunchConfiguration("rgb_image_topic")
    rgb_camera_info_topic = LaunchConfiguration("rgb_camera_info_topic")
    aligned_depth_topic = LaunchConfiguration("aligned_depth_topic")
    robot_namespace = LaunchConfiguration("robot_namespace")
    manual_rviz_config = os.path.join(bringup_dir, "rviz", "adbscan_nav2_manual.rviz")

    declare_manual_rviz = DeclareLaunchArgument(
        "manual_rviz", default_value="true", description="Start manual-control RViz"
    )
    declare_enable_adbscan = DeclareLaunchArgument(
        "enable_adbscan",
        default_value="true",
        description="Start ADBSCAN perception and use ADBSCAN Nav2 parameters",
    )
    declare_robot_namespace = DeclareLaunchArgument(
        "robot_namespace",
        default_value=os.environ.get("ROBOT_NAMESPACE", "/j100_0812"),
        description="Clearpath base-service namespace that publishes TF, odometry, and cmd_vel",
    )
    declare_params_file = DeclareLaunchArgument(
        "params_file",
        default_value=os.path.join(bringup_dir, "params", "jackal_nav_adbscan.param.yaml"),
        description="Nav2 params file (includes ADBScanLayer)",
    )
    declare_fusion_params = DeclareLaunchArgument(
        "fusion_params_file",
        default_value=os.path.join(bringup_dir, "params", "pointcloud_fusion_jackal.yaml"),
        description="Fusion-node params for the Jackal RealSense + scan",
    )
    declare_adbscan_params = DeclareLaunchArgument(
        "adbscan_params_file",
        default_value=os.path.join(bringup_dir, "params", "adbscan_fused.yaml"),
        description="Parameters for the ADBSCAN detection node",
    )
    declare_localization = DeclareLaunchArgument(
        "localization",
        default_value="false",
        description="Run RTAB-Map in localization mode instead of SLAM",
    )
    declare_rtabmap_database_path = DeclareLaunchArgument(
        "rtabmap_database_path",
        default_value="~/.ros/rtabmap.db",
        description="RTAB-Map database saved during SLAM or loaded for localization",
    )
    declare_depth_image_topic = DeclareLaunchArgument(
        "depth_image_topic",
        default_value=[robot_namespace, "/sensors/camera_0/depth/image"],
        description="Clearpath RealSense depth image topic used to generate /scan",
    )
    declare_depth_camera_info_topic = DeclareLaunchArgument(
        "depth_camera_info_topic",
        default_value=[robot_namespace, "/sensors/camera_0/depth/camera_info"],
        description="CameraInfo topic paired with depth_image_topic",
    )
    declare_pointcloud_topic = DeclareLaunchArgument(
        "pointcloud_topic",
        default_value=[robot_namespace, "/sensors/camera_0/points"],
        description="RealSense or Velodyne PointCloud2 topic fused with /scan",
    )
    declare_scan_frame = DeclareLaunchArgument(
        "scan_frame",
        default_value="camera_0_depth_frame",
        description="TF frame assigned to generated /scan messages",
    )
    declare_camera_namespace = DeclareLaunchArgument(
        "camera_namespace",
        default_value=[robot_namespace, "/sensors/camera_0"],
        description="RealSense namespace used by RTAB-Map RGB-D synchronization",
    )
    declare_rgb_image_topic = DeclareLaunchArgument(
        "rgb_image_topic",
        default_value=[robot_namespace, "/sensors/camera_0/color/image"],
        description="RealSense color image topic used by RTAB-Map",
    )
    declare_rgb_camera_info_topic = DeclareLaunchArgument(
        "rgb_camera_info_topic",
        default_value=[robot_namespace, "/sensors/camera_0/color/camera_info"],
        description="CameraInfo topic paired with rgb_image_topic",
    )
    declare_aligned_depth_topic = DeclareLaunchArgument(
        "aligned_depth_topic",
        default_value=[robot_namespace, "/sensors/camera_0/aligned_depth_to_color/image"],
        description="Depth image aligned to rgb_image_topic for RTAB-Map",
    )

    bringup = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(bringup_dir, "launch", "wandering_jackal.launch.py")
        ),
        launch_arguments={
            "use_rviz": "false",
            "enable_adbscan": enable_adbscan,
            "params_file": params_file,
            "fusion_params_file": fusion_params_file,
            "adbscan_params_file": adbscan_params_file,
            "localization": localization,
            "rtabmap_database_path": rtabmap_database_path,
            "robot_namespace": robot_namespace,
            "depth_image_topic": depth_image_topic,
            "depth_camera_info_topic": depth_camera_info_topic,
            "pointcloud_topic": pointcloud_topic,
            "scan_frame": scan_frame,
            "camera_namespace": camera_namespace,
            "rgb_image_topic": rgb_image_topic,
            "rgb_camera_info_topic": rgb_camera_info_topic,
            "aligned_depth_topic": aligned_depth_topic,
        }.items(),
    )

    rviz = Node(
        condition=IfCondition(
            PythonExpression(
                [
                    "'",
                    manual_rviz,
                    "'.lower() == 'true' and '",
                    EnvironmentVariable("DISPLAY", default_value=""),
                    "' != ''",
                ]
            )
        ),
        package="rviz2",
        executable="rviz2",
        name="rviz2_manual",
        arguments=["-d", manual_rviz_config],
        remappings=[
            ("/tf", [robot_namespace, "/tf"]),
            ("/tf_static", [robot_namespace, "/tf_static"]),
            ("/robot_description", [robot_namespace, "/robot_description"]),
        ],
        output="screen",
    )

    return LaunchDescription(
        [
            SetEnvironmentVariable("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp"),
            declare_manual_rviz,
            declare_enable_adbscan,
            declare_robot_namespace,
            declare_params_file,
            declare_fusion_params,
            declare_adbscan_params,
            declare_localization,
            declare_rtabmap_database_path,
            declare_depth_image_topic,
            declare_depth_camera_info_topic,
            declare_pointcloud_topic,
            declare_scan_frame,
            declare_camera_namespace,
            declare_rgb_image_topic,
            declare_rgb_camera_info_topic,
            declare_aligned_depth_topic,
            bringup,
            rviz,
        ]
    )
