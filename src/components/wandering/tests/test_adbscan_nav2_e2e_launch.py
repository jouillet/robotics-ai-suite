#!/usr/bin/env python3
# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Installed-package E2E coverage for the ADBScan Nav2 obstacle path."""

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
from nav2_dynamic_msgs.msg import Obstacle, ObstacleArray
from nav_msgs.msg import OccupancyGrid, Odometry
from rclpy.qos import DurabilityPolicy, QoSProfile, ReliabilityPolicy, qos_profile_sensor_data


STARTUP_TIMEOUT_SECONDS = 90.0
OBSERVATION_TIMEOUT_SECONDS = 10.0
OBSTACLE_DISTANCE_METERS = 0.8
LETHAL_COST = 100


def generate_test_description():
    """Launch the production ADBScan Nav2 pipeline with installed package assets."""
    share_directory = get_package_share_directory("wandering_bringup")
    launch_file = os.path.join(
        share_directory, "launch", "test_wandering_adbscan_scanonly_sim.launch.py"
    )
    simulator_file = os.path.join(share_directory, "launch", "test_turtlebot3_headless.launch.py")
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


def _cost_at(costmap, x_position, y_position):
    origin = costmap.info.origin.position
    column = int((x_position - origin.x) / costmap.info.resolution)
    row = int((y_position - origin.y) / costmap.info.resolution)
    if column < 0 or row < 0 or column >= costmap.info.width or row >= costmap.info.height:
        return None
    return costmap.data[row * costmap.info.width + column]


class TestAdbscanNav2E2E(unittest.TestCase):
    def setUp(self):
        rclpy.init()
        self.node = rclpy.create_node("adbscan_nav2_e2e_test")
        self.latest_costmap = None
        self.latest_odometry = None
        costmap_qos = QoSProfile(
            depth=1,
            durability=DurabilityPolicy.TRANSIENT_LOCAL,
            reliability=ReliabilityPolicy.RELIABLE,
        )
        self.node.create_subscription(
            OccupancyGrid, "/local_costmap/costmap", self.receive_costmap, costmap_qos
        )
        self.node.create_subscription(
            Odometry, "/odom", self.receive_odometry, qos_profile_sensor_data
        )
        self.publisher = self.node.create_publisher(
            ObstacleArray, "/obstacle_array", qos_profile_sensor_data
        )

    def tearDown(self):
        self.node.destroy_node()
        rclpy.shutdown()

    def receive_costmap(self, message):
        self.latest_costmap = message

    def receive_odometry(self, message):
        self.latest_odometry = message

    def test_detection_marks_local_costmap(self):
        """A synthetic ADBScan detection must produce a lethal local costmap cell."""
        deadline = time.monotonic() + STARTUP_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            rclpy.spin_once(self.node, timeout_sec=0.2)
            if self.latest_costmap is not None and self.latest_odometry is not None:
                break
        self.assertIsNotNone(self.latest_costmap, "local costmap was not published")
        self.assertIsNotNone(self.latest_odometry, "robot odometry was not published")

        robot_position = self.latest_odometry.pose.pose.position
        obstacle_x = robot_position.x + OBSTACLE_DISTANCE_METERS
        obstacle_y = robot_position.y
        baseline_cost = _cost_at(self.latest_costmap, obstacle_x, obstacle_y)
        self.assertIsNotNone(baseline_cost, "obstacle position is outside the local costmap")
        self.assertNotEqual(baseline_cost, LETHAL_COST, "obstacle position is already lethal")

        obstacle = Obstacle()
        obstacle.position.x = obstacle_x
        obstacle.position.y = obstacle_y
        obstacle.size.x = 0.2
        obstacle.size.y = 0.2
        message = ObstacleArray()
        message.header.frame_id = "odom"
        message.obstacles = [obstacle]

        deadline = time.monotonic() + OBSERVATION_TIMEOUT_SECONDS
        while time.monotonic() < deadline:
            self.publisher.publish(message)
            rclpy.spin_once(self.node, timeout_sec=0.2)
            if self.latest_costmap is not None:
                cost = _cost_at(self.latest_costmap, obstacle_x, obstacle_y)
                if cost == LETHAL_COST:
                    return
        self.fail("ADBScan detection did not mark a lethal local costmap cell")
