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
from sensor_msgs.msg import PointCloud2
from sensor_msgs_py import point_cloud2
from std_msgs.msg import Header


def generate_test_description():
    return LaunchDescription(
        [
            Node(
                package="adbscan_sensor_fusion",
                executable="pointcloud_fusion_node",
                parameters=[
                    {
                        "target_frame": "base_link",
                        "cloud_topic": "test_untransformable_cloud",
                        "output_topic": "test_missing_tf_output",
                        "fuse_scan": False,
                        "fuse_cloud": True,
                        "transform_timeout": 0.01,
                    }
                ],
            ),
            launch_testing.util.KeepAliveProc(),
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestPointCloudFusionMissingTfLaunch(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("pointcloud_fusion_missing_tf_launch_test")
        self.publisher = self.node.create_publisher(
            PointCloud2, "test_untransformable_cloud", qos_profile_sensor_data
        )
        self.received_cloud = None
        self.subscription = self.node.create_subscription(
            PointCloud2,
            "test_missing_tf_output",
            self._receive_cloud,
            qos_profile_sensor_data,
        )

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def _receive_cloud(self, cloud):
        self.received_cloud = cloud

    def test_untransformable_cloud_is_not_published(self):
        cloud = point_cloud2.create_cloud_xyz32(self._header(), [(1.0, 2.0, 3.0)])

        deadline = time.monotonic() + 2.0
        while time.monotonic() < deadline:
            self.publisher.publish(cloud)
            rclpy.spin_once(self.node, timeout_sec=0.05)

        self.assertIsNone(self.received_cloud)

    def _header(self):
        return Header(frame_id="orphan_frame", stamp=self.node.get_clock().now().to_msg())
