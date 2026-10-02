<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# Follow-Me TurtleBot3 Gazebo Simulation (`followme_turtlebot3_gazebo`)

This package provides the Gazebo simulation environments, robot models, and launch configurations for testing the ADBSCAN-based person-following application on a TurtleBot3 Waffle robot in simulation.

## Overview

The simulation environment spawns two robots:

1. **Guide Robot (`guide_robot`)**: An airport-style lead vehicle featuring a black-and-yellow checkerboard visual pattern. It follows an automated trajectory to simulate a moving target.
2. **Follower Robot (`turtlebot3_waffle_depth`)**: A simulated TurtleBot3 Waffle equipped with a 2D LiDAR and an Intel® RealSense™ depth camera sensor plugin. It runs the `adbscan_ros2_follow_me` node to detect the guide robot and autonomously follow it.

## Supported Distributions and Simulators

- **ROS 2 Jazzy**: Uses **Gazebo Harmonic** (`ros_gz_sim`).
- **ROS 2 Humble**: Uses **Gazebo Fortress** / Gazebo Classic.

## Simulation Models

The simulation assets are located in `src/followme_turtlebot3_gazebo/models/`:

- `models/guide_robot`: SDF model and textures for the lead guide vehicle.
- `models/turtlebot3_waffle_depth`: SDF and URDF descriptions for the follower robot with simulated depth sensor plugins.

## Launch Sequence and Scripts

Simulation scenarios are launched in two coordinated phases:

### Phase 1: World and Robot Spawning (`*_shared.launch.py`)

- Launches the Gazebo world (`turtlebot3_world`, `turtlebot3_house`, or empty world).
- Starts robot state publishers for both the guide and follower robots.
- Establishes ROS-Gazebo bridges for sensor streams (`/scan`, `/camera/depth/color/points`) and motor commands (`/cmd_vel`).
- Spawns both robots into the simulation.

### Phase 2: Perception and Application Stack

- Launches the ADBSCAN clustering node and follow-me control state machine.
- Optionally starts the gesture recognition node (MediaPipe) and speech recognition node (OpenVINO).
- Starts the trajectory publisher controlling the guide robot.

### Convenience Runner Scripts

Pre-configured bash scripts in `src/followme_turtlebot3_gazebo/scripts/` manage the full startup sequence, process cleanup, and RViz visualization:

- `demo_lidar.sh`: 2D LiDAR tracking with hand gesture control.
- `demo_lidar_audio.sh`: 2D LiDAR tracking with hand gesture and OpenVINO voice control.
- `demo_RS.sh`: Intel RealSense depth camera tracking with hand gesture control.
- `demo_RS_audio.sh`: Intel RealSense depth camera tracking with gesture and voice control.

For complete execution instructions and dependencies, see the [Follow-Me Application Guide](follow_me_readme.md).
