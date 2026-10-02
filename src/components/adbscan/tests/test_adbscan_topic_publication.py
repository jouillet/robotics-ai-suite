# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

import time
import unittest
import launch
import launch_ros.actions
import launch_testing
import launch_testing.actions
import pytest
import rclpy


@pytest.mark.launch_test
def generate_test_description():
    adbscan_pub_node = launch_ros.actions.Node(
        package="adbscan_ros2",
        executable="adbscan_pub",
        name="adbscan_pub_test_node",
        output="screen",
    )

    return launch.LaunchDescription(
        [
            adbscan_pub_node,
            launch_testing.actions.ReadyToTest(),
        ]
    )


class TestAdbscanTopicPublication(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        rclpy.init()

    @classmethod
    def tearDownClass(cls):
        rclpy.shutdown()

    def setUp(self):
        self.node = rclpy.create_node("test_adbscan_subscriber")

    def tearDown(self):
        self.node.destroy_node()

    def test_nodes_and_topics(self):
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline:
            topics = dict(self.node.get_topic_names_and_types())
            if "/Obstacle_Array" in topics:
                break
            time.sleep(0.1)

        self.assertIn("/Obstacle_Array", topics)
        self.assertIn("nav2_dynamic_msgs/msg/ObstacleArray", topics["/Obstacle_Array"])
