<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# Follow-Me Prerequisites and Dependencies

This document details the system and Python requirements for running the Follow-Me Gazebo simulation with gesture and audio control.

```bash
sudo apt install python3-colcon-common-extensions python3-pip
```

## ROS 2 Jazzy (Ubuntu 24.04)

### System Packages

No additional simulation packages required — Gazebo Harmonic ships with `ros-jazzy-ros-gz*`.

### Python Packages (Gesture only)

```bash
pip3 install -r src/followme_turtlebot3_gazebo/scripts/requirements_jazzy.txt
```

### Python Packages (Gesture + Audio)

```bash
pip3 install -r src/followme_turtlebot3_gazebo/scripts/requirements_jazzy.txt
pip3 install -r src/followme_turtlebot3_gazebo/scripts/requirements_audio_jazzy.txt
```

## ROS 2 Humble (Ubuntu 22.04)

### System Packages (Humble)

```bash
sudo apt install libprotobuf-lite23 ros-humble-gazebo-* \
    ros-humble-dynamixel-sdk ros-humble-turtlebot3-msgs \
    ros-humble-turtlebot3 ros-humble-xacro
```

### Python Packages (Gesture only, Humble)

```bash
pip3 install -r src/followme_turtlebot3_gazebo/scripts/requirements_humble.txt
```

### Python Packages (Gesture + Audio, Humble)

```bash
pip3 install -r src/followme_turtlebot3_gazebo/scripts/requirements_humble.txt
pip3 install -r src/followme_turtlebot3_gazebo/scripts/requirements_audio_humble.txt
```
