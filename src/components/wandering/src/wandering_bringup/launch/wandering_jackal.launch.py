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

"""ADBSCAN + Nav2 reference pipeline on the Clearpath Jackal.

Brings up:
  * depthimage_to_laserscan   -> /scan  (2D LiDAR surrogate from RealSense depth),
    * RTAB-Map SLAM,
  * Nav2 stack                with params that include the ADBScanLayer,
  * ADBSCAN perception        (fusion node + ADBSCAN node -> /obstacle_array).
    * Wandering application     (exploration goals -> Nav2 NavigateToPose).

Prerequisites (running on the robot):
    * Jackal base driver with the Clearpath RealSense sensor enabled,
        which publishes the camera topics and calibrated TF tree,
    * export ROBOT_NAMESPACE=/j100_0812  (or your robot's namespace)
"""

# pylint: disable=duplicate-code
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    DeclareLaunchArgument,
    IncludeLaunchDescription,
    SetEnvironmentVariable,
)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import EnvironmentVariable, LaunchConfiguration, PythonExpression
from launch_ros.actions import Node


def generate_launch_description():  # pylint: disable=too-many-locals
    """Bring up the ADBSCAN + Nav2 reference pipeline on the Clearpath Jackal."""
    bringup_dir = get_package_share_directory("wandering_bringup")

    use_rviz = LaunchConfiguration("use_rviz")
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

    default_adbscan_params = os.path.join(bringup_dir, "params", "jackal_nav_adbscan.param.yaml")
    default_standard_params = os.path.join(bringup_dir, "params", "jackal_nav.param.yaml")
    default_params = PythonExpression(
        [
            "'",
            default_adbscan_params,
            "' if '",
            enable_adbscan,
            "'.lower() == 'true' else '",
            default_standard_params,
            "'",
        ]
    )
    default_fusion = os.path.join(bringup_dir, "params", "pointcloud_fusion_jackal.yaml")
    default_adbscan = os.path.join(bringup_dir, "params", "adbscan_fused.yaml")
    global_rviz_config = os.path.join(bringup_dir, "rviz", "adbscan_nav2.rviz")
    local_rviz_config = os.path.join(bringup_dir, "rviz", "adbscan_nav2_local_costmap.rviz")
    rtabmap_params = os.path.join(bringup_dir, "params", "jackal_nav.param.yaml")

    declare_use_rviz = DeclareLaunchArgument(
        "use_rviz", default_value="true", description="Start RViz"
    )
    declare_enable_adbscan = DeclareLaunchArgument(
        "enable_adbscan",
        default_value="true",
        description="Start ADBSCAN perception and use ADBSCAN Nav2 parameters",
    )
    declare_params_file = DeclareLaunchArgument(
        "params_file",
        default_value=default_params,
        description="Nav2 params file (includes ADBScanLayer)",
    )
    declare_fusion_params = DeclareLaunchArgument(
        "fusion_params_file",
        default_value=default_fusion,
        description="Fusion-node params for the Jackal RealSense + scan",
    )
    declare_adbscan_params = DeclareLaunchArgument(
        "adbscan_params_file",
        default_value=default_adbscan,
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
    declare_robot_namespace = DeclareLaunchArgument(
        "robot_namespace",
        default_value=os.environ.get("ROBOT_NAMESPACE", "/j100_0812"),
        description="Clearpath base-service namespace that publishes TF, odometry, and cmd_vel",
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
        description="RealSense PointCloud2 topic fused with /scan",
    )
    declare_scan_frame = DeclareLaunchArgument(
        "scan_frame",
        default_value="camera_0_depth_frame",
        description="TF frame assigned to the generated /scan messages",
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

    # 1) 2D scan from the Clearpath-managed RealSense depth image.
    depthimage_to_laserscan = Node(
        package="depthimage_to_laserscan",
        executable="depthimage_to_laserscan_node",
        name="depthimage_to_laserscan_node",
        parameters=[
            {
                "scan_time": 0.033,
                "range_min": 0.1,
                "range_max": 2.5,
                "output_frame": scan_frame,
            }
        ],
        remappings=[
            ("depth", depth_image_topic),
            ("depth_camera_info", depth_camera_info_topic),
            ("scan", "/scan"),
        ],
        output="screen",
    )
    # 2) RTAB-Map SLAM.
    rtabmap = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(bringup_dir, "launch", "dep_rtabmap_jackal.launch.py")
        ),
        launch_arguments={
            "localization": localization,
            "params_file": rtabmap_params,
            "database_path": rtabmap_database_path,
            "robot_namespace": robot_namespace,
            "camera_namespace": camera_namespace,
            "rgb_image_topic": rgb_image_topic,
            "rgb_camera_info_topic": rgb_camera_info_topic,
            "aligned_depth_topic": aligned_depth_topic,
        }.items(),
    )

    # 3) Nav2 stack with the selected costmap configuration.
    nav2 = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(bringup_dir, "launch", "dep_navigation_jackal.launch.py")
        ),
        launch_arguments={
            "use_sim_time": "false",
            "params_file": params_file,
            "autostart": "true",
            "robot_namespace": robot_namespace,
        }.items(),
    )

    # 4) ADBSCAN perception (fusion + ADBSCAN detection). The Jackal publishes
    #    its TF tree under the robot namespace, so pass it through to the
    #    perception launch which remaps /tf(_static) for the fusion node.
    perception = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(bringup_dir, "launch", "dep_adbscan_perception.launch.py")
        ),
        condition=IfCondition(enable_adbscan),
        launch_arguments={
            "use_sim_time": "false",
            "fusion_params_file": fusion_params_file,
            "adbscan_params_file": adbscan_params_file,
            "namespace": robot_namespace,
            "scan_topic": "/scan",
            "cloud_topic": pointcloud_topic,
        }.items(),
    )

    # 5) Autonomous exploration. Reuse the Nav2 parameters so Wandering uses
    #    the same robot radius as the costmaps, and read the Jackal TF tree.
    wandering = Node(
        package="wandering_app",
        executable="wandering",
        name="wandering_mapper",
        output="screen",
        parameters=[params_file, {"use_sim_time": False}],
        remappings=[
            ("/tf", [robot_namespace, "/tf"]),
            ("/tf_static", [robot_namespace, "/tf_static"]),
        ],
    )

    global_rviz = Node(
        condition=IfCondition(
            PythonExpression(
                [
                    "'",
                    use_rviz,
                    "'.lower() == 'true' and '",
                    EnvironmentVariable("DISPLAY", default_value=""),
                    "' != ''",
                ]
            )
        ),
        package="rviz2",
        executable="rviz2",
        name="rviz2_global",
        arguments=["-d", global_rviz_config],
        remappings=[
            ("/tf", [robot_namespace, "/tf"]),
            ("/tf_static", [robot_namespace, "/tf_static"]),
            ("/robot_description", [robot_namespace, "/robot_description"]),
        ],
        output="screen",
    )

    local_rviz = Node(
        condition=IfCondition(
            PythonExpression(
                [
                    "'",
                    use_rviz,
                    "'.lower() == 'true' and '",
                    EnvironmentVariable("DISPLAY", default_value=""),
                    "' != ''",
                ]
            )
        ),
        package="rviz2",
        executable="rviz2",
        name="rviz2_local",
        arguments=["-d", local_rviz_config],
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
            declare_use_rviz,
            declare_enable_adbscan,
            declare_params_file,
            declare_fusion_params,
            declare_adbscan_params,
            declare_localization,
            declare_rtabmap_database_path,
            declare_robot_namespace,
            declare_depth_image_topic,
            declare_depth_camera_info_topic,
            declare_pointcloud_topic,
            declare_scan_frame,
            declare_camera_namespace,
            declare_rgb_image_topic,
            declare_rgb_camera_info_topic,
            declare_aligned_depth_topic,
            depthimage_to_laserscan,
            rtabmap,
            nav2,
            perception,
            wandering,
            global_rviz,
            local_rviz,
        ]
    )
