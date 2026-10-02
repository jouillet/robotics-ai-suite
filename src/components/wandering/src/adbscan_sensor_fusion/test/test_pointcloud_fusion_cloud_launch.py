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
from sensor_msgs.msg import PointCloud2
from sensor_msgs_py import point_cloud2
from std_msgs.msg import Header


def generate_test_description():
    return LaunchDescription(
        [
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
                        "cloud_topic": "test_camera_cloud",
                        "output_topic": "test_fused_cloud",
                        "fuse_scan": False,
                        "fuse_cloud": True,
                        "use_voxel_filter": False,
                    }
                ],
            ),
            launch_testing.util.KeepAliveProc(),
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestPointCloudFusionCloudLaunch(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("pointcloud_fusion_cloud_launch_test")
        self.publisher = self.node.create_publisher(
            PointCloud2, "test_camera_cloud", qos_profile_sensor_data
        )
        self.received_cloud = None
        self.subscription = self.node.create_subscription(
            PointCloud2, "test_fused_cloud", self._receive_cloud, qos_profile_sensor_data
        )

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def _receive_cloud(self, cloud):
        self.received_cloud = cloud

    def test_cloud_is_transformed_and_published_in_target_frame(self):
        stamp = Time(sec=42, nanosec=123)
        cloud = point_cloud2.create_cloud_xyz32(
            Header(frame_id="camera_frame", stamp=stamp), [(1.0, 2.0, 3.0)]
        )

        deadline = time.monotonic() + 10.0
        while self.received_cloud is None and time.monotonic() < deadline:
            self.publisher.publish(cloud)
            rclpy.spin_once(self.node, timeout_sec=0.1)

        self.assertIsNotNone(self.received_cloud)
        self.assertEqual(self.received_cloud.header.frame_id, "base_link")
        self.assertEqual(self.received_cloud.header.stamp, stamp)
        self.assertEqual(self.received_cloud.width, 1)
        point = point_cloud2.read_points(self.received_cloud, field_names=("x", "y", "z"))[0]
        self.assertAlmostEqual(point["x"], 2.0)
        self.assertAlmostEqual(point["y"], 0.0)
        self.assertAlmostEqual(point["z"], 3.5)
