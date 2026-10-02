#!/usr/bin/env python3
# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

import time
import unittest

from launch import LaunchDescription
from launch_ros.actions import Node
import launch_testing
import launch_testing.actions
import rclpy
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import LaserScan, PointCloud2


def generate_test_description():
    return LaunchDescription(
        [
            Node(
                package="adbscan_sensor_fusion",
                executable="pointcloud_fusion_node",
                parameters=[
                    {
                        "target_frame": "base_link",
                        "scan_topic": "test_scan_only_input",
                        "cloud_topic": "test_missing_cloud_input",
                        "output_topic": "test_missing_stream_output",
                        "fuse_scan": True,
                        "fuse_cloud": True,
                    }
                ],
            ),
            launch_testing.util.KeepAliveProc(),
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestPointCloudFusionMissingStreamLaunch(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("pointcloud_fusion_missing_stream_launch_test")
        self.publisher = self.node.create_publisher(
            LaserScan, "test_scan_only_input", qos_profile_sensor_data
        )
        self.received_cloud = None
        self.subscription = self.node.create_subscription(
            PointCloud2,
            "test_missing_stream_output",
            self._receive_cloud,
            qos_profile_sensor_data,
        )

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def _receive_cloud(self, cloud):
        self.received_cloud = cloud

    def test_single_stream_does_not_publish_in_dual_sensor_mode(self):
        scan = LaserScan()
        scan.header.frame_id = "laser_frame"
        scan.angle_min = 0.0
        scan.angle_max = 0.2
        scan.angle_increment = 0.1
        scan.range_min = 0.1
        scan.range_max = 10.0
        scan.ranges = [1.0, 1.0, 1.0]

        deadline = time.monotonic() + 2.0
        while time.monotonic() < deadline:
            scan.header.stamp = self.node.get_clock().now().to_msg()
            self.publisher.publish(scan)
            rclpy.spin_once(self.node, timeout_sec=0.05)

        self.assertIsNone(self.received_cloud)
