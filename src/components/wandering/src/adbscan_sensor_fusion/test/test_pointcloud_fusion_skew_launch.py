#!/usr/bin/env python3
# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

import time
import unittest

from builtin_interfaces.msg import Time
from launch import LaunchDescription
from launch_ros.actions import Node
import launch_testing
import launch_testing.actions
import rclpy
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import LaserScan, PointCloud2
from sensor_msgs_py import point_cloud2
from std_msgs.msg import Header


def generate_test_description():
    return LaunchDescription(
        [
            Node(
                package="tf2_ros",
                executable="static_transform_publisher",
                arguments=["0", "0", "0.5", "0", "0", "0", "base_link", "laser_frame"],
            ),
            Node(
                package="tf2_ros",
                executable="static_transform_publisher",
                arguments=["1", "-2", "0.5", "0", "0", "0", "base_link", "camera_frame"],
            ),
            Node(
                package="adbscan_sensor_fusion",
                executable="pointcloud_fusion_node",
                parameters=[
                    {
                        "target_frame": "base_link",
                        "scan_topic": "test_skewed_scan",
                        "cloud_topic": "test_skewed_cloud",
                        "output_topic": "test_skewed_fused_cloud",
                        "sync_max_interval": 0.1,
                        "use_voxel_filter": False,
                    }
                ],
            ),
            launch_testing.util.KeepAliveProc(),
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestPointCloudFusionSkewLaunch(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("pointcloud_fusion_skew_launch_test")
        self.scan_publisher = self.node.create_publisher(
            LaserScan, "test_skewed_scan", qos_profile_sensor_data
        )
        self.cloud_publisher = self.node.create_publisher(
            PointCloud2, "test_skewed_cloud", qos_profile_sensor_data
        )
        self.received_cloud = None
        self.subscription = self.node.create_subscription(
            PointCloud2,
            "test_skewed_fused_cloud",
            self._receive_cloud,
            qos_profile_sensor_data,
        )

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def _receive_cloud(self, cloud):
        self.received_cloud = cloud

    def test_inputs_outside_sync_interval_are_not_fused(self):
        now = self.node.get_clock().now()
        scan = self._scan(now.to_msg())
        cloud_stamp = Time(
            sec=(now.nanoseconds + 500_000_000) // 1_000_000_000,
            nanosec=(now.nanoseconds + 500_000_000) % 1_000_000_000,
        )
        cloud = point_cloud2.create_cloud_xyz32(
            Header(frame_id="camera_frame", stamp=cloud_stamp), [(1.0, 2.0, 3.0)]
        )

        deadline = time.monotonic() + 2.0
        while time.monotonic() < deadline:
            self.scan_publisher.publish(scan)
            self.cloud_publisher.publish(cloud)
            rclpy.spin_once(self.node, timeout_sec=0.05)

        self.assertIsNone(self.received_cloud)

    @staticmethod
    def _scan(stamp):
        scan = LaserScan()
        scan.header.frame_id = "laser_frame"
        scan.header.stamp = stamp
        scan.angle_min = 0.0
        scan.angle_max = 0.2
        scan.angle_increment = 0.1
        scan.time_increment = 0.1
        scan.scan_time = 0.3
        scan.range_min = 0.1
        scan.range_max = 10.0
        scan.ranges = [1.0, 1.0, 1.0]
        return scan
