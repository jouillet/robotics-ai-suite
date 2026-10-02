<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# ADBSCAN Documentation

---

ADBSCAN (Adaptive DBSCAN) is an Intel® patented algorithm. It is a
highly adaptive and scalable object detection and localization
(clustering) algorithm, tested successfully to detect objects at all
ranges for 2D Lidar, 3D Lidar, and Intel® RealSense™ depth camera. This
method automatically computes clustering parameters (radius and minimum
number of points that define a cluster) based on the distance from the
sensor and the data density in its field of view, thus alleviating the
guesswork from parameter selection and enabling efficient hierarchical
clustering. ADBSCAN increases detection range by 30%-40% and detects
20%-30% more objects, compared to the state-of-the-art methods. It has
been gainfully used in multiple applications such as 2D/3D Lidar or
Intel® RealSense™ based object tracking, multi-modal object
classification (Camera + Lidar), surface segmentation, Lidar-based
object classification, occupancy grid generation etc.

## Documentation Index

### Core Package & Algorithm Documentation

- [ADBSCAN ROS 2 Node Guide](../src/adbscan_ros2/Readme.md) - Configuration parameters, topic schemas, and RViz visualization.
- [Intel Architecture Optimized ADBSCAN](IA-optimized-adbscan-algorithm.md) - oneAPI GPU/CPU acceleration, parallel search benchmarks, and parameters.

### Follow-Me Application & Simulation

- [Follow-Me Application Guide](follow_me_readme.md) - Comprehensive application guide covering all 4 demo modes (LiDAR, RealSense, Gesture, Audio).
- [Follow-Me Requirements](follow_me_requirements.md) - System packages and Python dependencies for Humble and Jazzy.
- [Follow-Me TurtleBot3 Gazebo Simulation](followme_turtlebot3_gazebo_readme.md) - Simulation world configurations, guide robot model, and launch sequences.

### Sensor & Platform Tutorials

- [ADBSCAN AAEON Robot Tutorial](adbscan_aaeon_robot.md) - Running ADBSCAN on a physical AAEON AMR platform.
- [ADBSCAN RealSense Demo](adbscan-realsense.md) - Running ADBSCAN from Intel® RealSense™ depth camera bag data.
- [ADBSCAN RPLidar Demo](adbscan-rplidar.md) - Running ADBSCAN from 2D RPLidar bag data.

## Troubleshooting

- Failed to install Deb package: Please make sure to run `sudo apt update` before installing Debian packages.
- You can stop running nodes or simulations anytime by pressing `Ctrl-C`.
