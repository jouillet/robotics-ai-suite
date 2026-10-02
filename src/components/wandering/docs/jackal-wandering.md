<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# `wandering` application on Clearpath Jackal

This tutorial details the steps to install and run the `wandering` mobile
robot application on a Clearpath Robotics Jackal robot. The pipeline integrates
Intel RealSense depth-camera sensing, RTAB-Map visual SLAM, Nav2 navigation,
and ADBSCAN 3D obstacle perception to explore and map the environment
autonomously.

## Prerequisites

* [Prepare the target system](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/)
* [Set up the Robotics AI Dev Kit APT repositories](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#3-set-up-robotics-ai-suite-oneapi-and-graphics-apt-repositories)
* [Install OpenVINO™ packages](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#4-install-openvino-packages)
* [Install Robotics AI Dev Kit Debian packages](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#6-install-robotics-ai-suite-deb-packages)
* [Install the Intel® NPU driver on Intel® Core™ Ultra processors (if applicable)](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/step_by_step/#7-install-the-intel-npu-driver-on-intel-core-ultra-processors)

## Installation

Ensure that your Clearpath Jackal robot is powered, configured, and operational
according to the [official documentation](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/).
Verify that the Clearpath base services, including the configured RealSense sensor,
are running and publishing topics and the namespaced TF tree.

To install the `wandering` metapackage on the robot:

```bash
sudo apt update
sudo apt install ros-${ROS_DISTRO}-wandering
```

Or build and source the workspace directly:

```bash
source /opt/ros/${ROS_DISTRO}/setup.bash
colcon build --symlink-install
source install/setup.bash
```

## Running the application

### Autonomous exploration mode

Launch the complete autonomous pipeline:

```bash
export ROBOT_NAMESPACE=/j100_0812
ros2 launch wandering_bringup wandering_jackal.launch.py
```

**What this starts:**

1. `depthimage_to_laserscan`: Derives a 2D `/scan` topic from the RealSense
   depth image.
2. `dep_rtabmap_jackal`: Runs RTAB-Map SLAM and RGB-D synchronization.
3. `dep_navigation_jackal`: Starts the Jackal Nav2 navigation stack configured
   with `ADBScanLayer` in both local and global costmaps.
4. `dep_adbscan_perception`: Fuses the scan and RealSense point cloud,
   performs 3D ADBSCAN obstacle clustering, and publishes `/obstacle_array`.
5. `wandering_app`: Frontier-exploration node (`wandering_mapper`) that evaluates
   unexplored free space on the costmap and sends `NavigateToPose` goals to Nav2.
6. RViz visualization windows (when a display is available).

### Interactive manual override mode

To retain autonomous SLAM and ADBSCAN costmap protection while allowing an operator
to pause exploration and send manual navigation goals via RViz:

```bash
export ROBOT_NAMESPACE=/j100_0812
ros2 launch wandering_bringup wandering_jackal_manual_nav.launch.py
```

* Click **Manual mode** in the **Wandering Control** panel to cancel the active
  exploration goal.
* Use Nav2's **Goal** tool in the RViz toolbar to click-drag custom waypoints on
  the map.
* Click **Autonomous mode** to resume autonomous frontier wandering.

### Standard 2D LiDAR Nav2 (without ADBSCAN)

To run the standard 2D Nav2 pipeline without the ADBSCAN fusion and clustering
nodes:

```bash
ros2 launch wandering_bringup wandering_jackal.launch.py enable_adbscan:=false
```

## Advanced configuration

* **Robot namespace:** Set `ROBOT_NAMESPACE` (e.g. `export ROBOT_NAMESPACE=/j100_0123`)
  to match your physical robot's Clearpath base service namespace.
* **Velodyne Puck 3D LiDAR profile:** To fuse a Velodyne Puck 3D cloud instead of
  the RealSense depth cloud, pass `fusion_params_file` and `adbscan_params_file`
  tuned for the Puck.
* **Camera topic overrides:** Override `camera_namespace`, `depth_image_topic`,
  `depth_camera_info_topic`, `rgb_image_topic`, `rgb_camera_info_topic`, or
  `aligned_depth_topic` if your robot uses non-default topic names.

For complete parameter references and launch options, see the
[Bringup Guide](../src/wandering_bringup/README.md).
