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

"""
ADBSCAN + Nav2 reference pipeline for simulated robots.

Brings up:
    * a configurable simulator launch file (TurtleBot3 Gazebo by default),
  * Nav2 stack with SLAM, using params that include the ADBScanLayer,
  * the ADBSCAN perception pipeline (fusion node + ADBSCAN node),
    * autonomous Wandering exploration,
  * RViz.
"""

# pylint: disable=duplicate-code
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription, SetEnvironmentVariable
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():  # pylint: disable=too-many-locals
    """Bring up the ADBSCAN + Nav2 reference pipeline in simulation."""
    bringup_dir = get_package_share_directory("wandering_bringup")
    nav2_bringup_dir = get_package_share_directory("nav2_bringup")

    use_sim_time = LaunchConfiguration("use_sim_time")
    params_file = LaunchConfiguration("params_file")
    fusion_params_file = LaunchConfiguration("fusion_params_file")
    adbscan_params_file = LaunchConfiguration("adbscan_params_file")
    namespace = LaunchConfiguration("namespace")
    scan_topic = LaunchConfiguration("scan_topic")
    cloud_topic = LaunchConfiguration("cloud_topic")
    autostart = LaunchConfiguration("autostart")
    start_simulator = LaunchConfiguration("start_simulator")
    simulator_launch_file = LaunchConfiguration("simulator_launch_file")
    robot_model = LaunchConfiguration("robot_model")
    start_wandering = LaunchConfiguration("start_wandering")
    use_rviz = LaunchConfiguration("use_rviz")

    default_params = os.path.join(bringup_dir, "params", "nav2_adbscan_sim.param.yaml")
    default_fusion = os.path.join(bringup_dir, "params", "pointcloud_fusion_sim.yaml")
    default_adbscan = os.path.join(bringup_dir, "params", "adbscan_fused.yaml")
    default_simulator_launch = PathJoinSubstitution(
        [
            FindPackageShare("turtlebot3_gazebo"),
            "launch",
            "turtlebot3_world.launch.py",
        ]
    )
    global_rviz_config = os.path.join(bringup_dir, "rviz", "adbscan_nav2_sim.rviz")
    local_rviz_config = os.path.join(bringup_dir, "rviz", "adbscan_nav2_sim_local_costmap.rviz")

    declare_use_sim_time = DeclareLaunchArgument(
        "use_sim_time", default_value="true", description="Use Gazebo clock"
    )
    declare_params_file = DeclareLaunchArgument(
        "params_file",
        default_value=default_params,
        description="Nav2 params file (includes ADBScanLayer)",
    )
    declare_fusion_params = DeclareLaunchArgument(
        "fusion_params_file",
        default_value=default_fusion,
        description="Fusion-node params for the simulated sensors",
    )
    declare_adbscan_params = DeclareLaunchArgument(
        "adbscan_params_file",
        default_value=default_adbscan,
        description="Parameters for the ADBSCAN detection node",
    )
    declare_namespace = DeclareLaunchArgument(
        "namespace",
        default_value="",
        description="Robot namespace that publishes TF, or empty for /tf",
    )
    declare_scan_topic = DeclareLaunchArgument(
        "scan_topic", default_value="/scan", description="Simulated robot LaserScan topic"
    )
    declare_cloud_topic = DeclareLaunchArgument(
        "cloud_topic",
        default_value="/camera/depth/color/points",
        description="Simulated robot depth PointCloud2 topic",
    )
    declare_autostart = DeclareLaunchArgument(
        "autostart", default_value="true", description="Autostart the Nav2 lifecycle"
    )
    declare_start_simulator = DeclareLaunchArgument(
        "start_simulator",
        default_value="true",
        description="Start simulator_launch_file; false when a simulator is already running",
    )
    declare_simulator_launch_file = DeclareLaunchArgument(
        "simulator_launch_file",
        default_value=default_simulator_launch,
        description="Absolute path to the robot simulator launch file",
    )
    declare_robot_model = DeclareLaunchArgument(
        "robot_model",
        default_value="waffle",
        description="TurtleBot3 model used by the default simulator",
    )
    declare_start_wandering = DeclareLaunchArgument(
        "start_wandering",
        default_value="true",
        description="Start autonomous Wandering exploration",
    )
    declare_use_rviz = DeclareLaunchArgument(
        "use_rviz", default_value="true", description="Start RViz"
    )

    # 1) Simulated robot + world. Set start_simulator:=false when an external
    #    simulator already publishes clock, sensors, odometry, and TF.
    sim = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(simulator_launch_file),
        condition=IfCondition(start_simulator),
        launch_arguments={"use_sim_time": use_sim_time}.items(),
    )

    # 2) Nav2 stack with SLAM (map built online), using our ADBSCAN params.
    nav2 = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(nav2_bringup_dir, "launch", "bringup_launch.py")
        ),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "params_file": params_file,
            "autostart": autostart,
            "slam": "True",
            "map": "",
        }.items(),
    )

    # 3) ADBSCAN perception (fusion + ADBSCAN detection).
    perception = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(bringup_dir, "launch", "dep_adbscan_perception.launch.py")
        ),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "fusion_params_file": fusion_params_file,
            "adbscan_params_file": adbscan_params_file,
            "namespace": namespace,
            "scan_topic": scan_topic,
            "cloud_topic": cloud_topic,
        }.items(),
    )

    # 4) Autonomous exploration, matching the physical-robot workflow.
    wandering = Node(
        condition=IfCondition(start_wandering),
        package="wandering_app",
        executable="wandering",
        name="wandering_mapper",
        output="screen",
        parameters=[params_file, {"use_sim_time": use_sim_time}],
        remappings=[
            ("/tf", [namespace, "/tf"]),
            ("/tf_static", [namespace, "/tf_static"]),
        ],
    )

    # 5) Side-by-side RViz views for global and local costmaps.
    global_rviz = Node(
        condition=IfCondition(use_rviz),
        package="rviz2",
        executable="rviz2",
        name="rviz2_global",
        arguments=["-d", global_rviz_config],
        parameters=[{"use_sim_time": use_sim_time}],
        output="screen",
    )

    local_rviz = Node(
        condition=IfCondition(use_rviz),
        package="rviz2",
        executable="rviz2",
        name="rviz2_local",
        arguments=["-d", local_rviz_config],
        parameters=[{"use_sim_time": use_sim_time}],
        output="screen",
    )

    return LaunchDescription(
        [
            SetEnvironmentVariable("RMW_IMPLEMENTATION", "rmw_cyclonedds_cpp"),
            declare_use_sim_time,
            declare_params_file,
            declare_fusion_params,
            declare_adbscan_params,
            declare_namespace,
            declare_scan_topic,
            declare_cloud_topic,
            declare_autostart,
            declare_start_simulator,
            declare_simulator_launch_file,
            declare_robot_model,
            declare_start_wandering,
            declare_use_rviz,
            SetEnvironmentVariable("TURTLEBOT3_MODEL", robot_model),
            sim,
            nav2,
            perception,
            wandering,
            global_rviz,
            local_rviz,
        ]
    )
