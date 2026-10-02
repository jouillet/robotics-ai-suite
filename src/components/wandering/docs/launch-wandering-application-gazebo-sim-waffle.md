<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# `wandering` application in Gazebo simulation

This tutorial walks through running the `wandering` mobile robot application
inside Gazebo simulation using the composed TurtleBot3 Waffle RGB-D model.
The simulation demonstrates complete autonomous frontier exploration integrated
with Nav2 navigation, SLAM (RTAB-Map or SLAM Toolbox), and ADBSCAN 3D
obstacle perception.

For background information on the TurtleBot3 platform, see the
[ROBOTIS TurtleBot3 e-Manual](https://emanual.robotis.com/docs/en/platform/turtlebot3/simulation/#gazebo-simulation).

## Prerequisites

* [Prepare the target system](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/)
* [Set up the Robotics AI Dev Kit APT repositories](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#3-set-up-robotics-ai-suite-oneapi-and-graphics-apt-repositories)
* [Install OpenVINO™ packages](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#4-install-openvino-packages)
* [Install Robotics AI Dev Kit Debian packages](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#6-install-robotics-ai-suite-deb-packages)
* [Install the Intel® NPU driver on Intel® Core™ Ultra processors (if applicable)](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#7-install-the-intel-npu-driver-on-intel-core-ultra-processors)

## Installation

Install the `wandering` metapackage for your installed ROS 2 distribution:

```bash
# For Jazzy (Ubuntu 24.04):
sudo apt update
sudo apt install ros-jazzy-wandering

# For Humble (Ubuntu 22.04):
sudo apt update
sudo apt install ros-humble-wandering
```

Or build the workspace from source and source the installation:

```bash
source /opt/ros/${ROS_DISTRO}/setup.bash
colcon build --symlink-install
source install/setup.bash
```

## Running the simulation

### Primary RGB-D simulation

Launch the complete autonomous simulation pipeline:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py gui:=true
```

**What this starts:**

1. **Gazebo Sim with composed RGB-D Waffle:** Starts the Gazebo simulation
   world with an integrated RGB-D camera payload (`gui:=true` opens the
   graphical Gazebo window).
2. **RGB-D sensor bridge:** Bridges camera color, depth, camera info, and
   depth point-cloud streams to ROS 2 topics.
3. **SLAM & Nav2:** Starts RTAB-Map SLAM (or SLAM Toolbox) alongside the Nav2
   navigation stack with the `ADBScanLayer` plugin enabled in both local and
   global costmaps.
4. **ADBSCAN perception:** Clusters 3D obstacle points from the depth camera
   and publishes detections to `/obstacle_array`.
5. **Autonomous exploration (`wandering_app`):** Evaluates costmap frontiers
   and sends `NavigateToPose` goals to Nav2.
6. **Visualization:**
   * Global map RViz window with the **Wandering Control** panel.
   * Local costmap RViz window displaying real-time obstacle layers.
   * `rqt_image_view` window displaying the camera color feed.

### Selecting a SLAM backend

By default, the simulation uses RTAB-Map for visual RGB-D SLAM. To use
`slam_toolbox` (2D LiDAR SLAM) instead:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py \
  slam_backend:=slam_toolbox gui:=true
```

### Headless execution

To run the simulation in headless mode (e.g., on remote servers or automated
benchmarks without opening the Gazebo GUI client):

```bash
ros2 launch wandering_bringup wandering_sim.launch.py gui:=false
```

### Stopping the simulation

To stop all nodes and the simulator, press `Ctrl-C` in the launch terminal.

## Advanced simulation options

For details on custom robot models, scan-only fallback testing, and deep-dive
parameter tuning, see the [Bringup Guide](../src/wandering_bringup/README.md).
