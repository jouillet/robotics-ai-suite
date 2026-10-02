#!/usr/bin/env python3
# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Headless runtime smoke test for the scan-only ADBScan Nav2 launch."""

import os
import time
import unittest

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
import launch_testing
import launch_testing.actions
import rclpy
from rclpy.parameter_client import AsyncParameterClient


def generate_test_description():
    bringup_dir = get_package_share_directory("wandering_bringup")
    launch_file = os.path.join(
        bringup_dir, "launch", "test_wandering_adbscan_scanonly_sim.launch.py"
    )
    simulator_file = os.path.join(bringup_dir, "launch", "test_turtlebot3_headless.launch.py")
    return LaunchDescription(
        [
            IncludeLaunchDescription(
                PythonLaunchDescriptionSource(launch_file),
                launch_arguments={
                    "start_wandering": "false",
                    "use_rviz": "false",
                    "simulator_launch_file": simulator_file,
                }.items(),
            ),
            launch_testing.util.KeepAliveProc(),
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestWanderingAdbscanSimSmokeLaunch(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("wandering_adbscan_scanonly_sim_smoke_test")

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def test_headless_bringup_exposes_runtime_interfaces(self):
        deadline = time.monotonic() + 90.0
        required_topics = {"/tf", "/scan", "/local_costmap/costmap"}
        required_nodes = {
            "adbscan_pointcloud_fusion",
            "adbscan_sub_node",
            "controller_server",
            "planner_server",
        }
        while time.monotonic() < deadline:
            topics = {name for name, _ in self.node.get_topic_names_and_types()}
            nodes = {name for name, _ in self.node.get_node_names_and_namespaces()}
            if required_topics <= topics and required_nodes <= nodes:
                break
            rclpy.spin_once(self.node, timeout_sec=0.2)

        self.assertTrue(required_topics <= topics)
        self.assertTrue(required_nodes <= nodes)

        client = AsyncParameterClient(self.node, "/local_costmap/local_costmap")
        self.assertTrue(client.wait_for_services(timeout_sec=10.0))
        future = client.get_parameters(["plugins"])
        rclpy.spin_until_future_complete(self.node, future, timeout_sec=10.0)
        self.assertTrue(future.done())
        plugins = future.result().values[0].string_array_value
        self.assertIn("adbscan_layer", plugins)
