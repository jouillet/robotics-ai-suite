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
from sensor_msgs_py import point_cloud2


def generate_test_description():
    return LaunchDescription(
        [
            Node(
                package="tf2_ros",
                executable="static_transform_publisher",
                arguments=["0", "0", "0.5", "0", "0", "0", "base_link", "laser_frame"],
            ),
            Node(
                package="adbscan_sensor_fusion",
                executable="pointcloud_fusion_node",
                parameters=[
                    {
                        "target_frame": "base_link",
                        "scan_topic": "test_scan",
                        "output_topic": "test_fused_cloud",
                        "fuse_scan": True,
                        "fuse_cloud": False,
                        "use_voxel_filter": False,
                    }
                ],
            ),
            launch_testing.util.KeepAliveProc(),
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestPointCloudFusionLaunch(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("pointcloud_fusion_launch_test")
        self.publisher = self.node.create_publisher(LaserScan, "test_scan", 10)
        self.received_cloud = None
        self.subscription = self.node.create_subscription(
            PointCloud2, "test_fused_cloud", self._receive_cloud, qos_profile_sensor_data
        )

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def _receive_cloud(self, cloud):
        self.received_cloud = cloud

    def test_scan_is_projected_and_published_in_target_frame(self):
        scan = LaserScan()
        scan.header.frame_id = "laser_frame"
        scan.header.stamp = self.node.get_clock().now().to_msg()
        scan.angle_min = 0.0
        scan.angle_max = 0.2
        scan.angle_increment = 0.1
        scan.time_increment = 0.1
        scan.scan_time = 0.3
        scan.range_min = 0.1
        scan.range_max = 10.0
        scan.ranges = [1.0, 1.0, 1.0]

        deadline = time.monotonic() + 10.0
        while self.received_cloud is None and time.monotonic() < deadline:
            self.publisher.publish(scan)
            rclpy.spin_once(self.node, timeout_sec=0.1)

        self.assertIsNotNone(self.received_cloud)
        self.assertEqual(self.received_cloud.header.frame_id, "base_link")
        self.assertEqual(self.received_cloud.header.stamp, scan.header.stamp)
        self.assertEqual(self.received_cloud.width, 3)
        self.assertEqual(self.received_cloud.height, 1)
        point = point_cloud2.read_points(self.received_cloud, field_names=("x", "y", "z"))[0]
        self.assertAlmostEqual(point["x"], 1.0)
        self.assertAlmostEqual(point["y"], 0.0)
        self.assertAlmostEqual(point["z"], 0.5)
