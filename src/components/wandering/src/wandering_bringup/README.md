<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# `wandering_bringup`

`wandering_bringup` provides `wandering` platform bringup for Gazebo simulation
and Clearpath Jackal hardware. It supports standard Nav2 navigation as well as
object-sized obstacle detections produced by ADBSCAN from a fused point cloud.

The package contains launch files, parameter files, and RViz configurations;
the nodes that fuse sensor data and mark ADBSCAN obstacles are supplied by
`adbscan_sensor_fusion` and `nav2_adbscan_layer` respectively.

## Architecture

```mermaid
flowchart LR
  Scan["2D LiDAR or derived /scan"] --> Fusion
  Depth["Depth-camera PointCloud2"] --> Fusion["Point-cloud fusion\nbase_link + voxel filter"]
  Fusion --> Points["/adbscan/points"]
  Points --> ADBSCAN["ADBSCAN 3D clustering"]
  ADBSCAN --> Obstacles["/obstacle_array"]
  Obstacles --> Local["Local costmap\nADBScanLayer"]
  Obstacles --> Global["Global costmap\nADBScanLayer"]
  Scan --> Local
  Scan --> Global
  Map["SLAM / map"] --> Nav2["Nav2 planner and controller"]
  Local --> Nav2
  Global --> Nav2
  Wandering["`wandering` exploration goals"] -->|NavigateToPose| Nav2
  Nav2 --> Base["Robot base command"]
```

### Perception path

The `adbscan_pointcloud_fusion` node approximately time-synchronizes a
`LaserScan` and a `PointCloud2` when both are enabled. It uses TF to project
the scan into the configured target frame, transforms the depth cloud into the
same frame, combines the points, optionally voxel-downsamples them, and
publishes `/adbscan/points`.

`adbscan_ros2` consumes that fused cloud in 3D mode and publishes
`nav2_dynamic_msgs/ObstacleArray` on `/obstacle_array`. Its tuning is in
`params/adbscan_fused.yaml`.

`nav2_adbscan_layer::ADBScanLayer` is configured in both the local and global
costmaps. For each received detection it transforms the obstacle position into
the costmap frame and marks a lethal circular region. The radius is derived
from the horizontal obstacle extent, with configured padding and a minimum
radius. Detections expire after a short time-to-live so stale detections are
removed.

This is additive: Nav2 continues to receive and clear raw scan observations in
its standard obstacle or voxel layers. ADBSCAN adds clustered, object-sized
obstacles that the planner and controller also avoid. The layer does not add
object semantics or motion prediction.

### `wandering` application

The Jackal launch also starts `wandering_app`. It reads
`/global_costmap/costmap`, chooses free unvisited exploration goals, and sends
them to Nav2 through `NavigateToPose`. It does not subscribe directly to
ADBSCAN output; it benefits because Nav2's costmaps and resulting paths include
the ADBSCAN layer.

### Architecture comparison

| Concern | Jackal route | Stock Waffle route | Depth-enabled simulation |
| --- | --- | --- | --- |
| ADBSCAN input | RealSense-derived scan plus depth cloud, or Velodyne cloud | 2D LiDAR projected to a planar `PointCloud2` | Simulated depth `PointCloud2` |
| Sensor synchronization | Approximate-time scan/cloud synchronization | None; only `/scan` is subscribed | None; depth cloud routed directly to ADBSCAN |
| Obstacle coverage | Height-aware with depth or 3D LiDAR | Planar; no depth or small-object advantage | Height-aware when the simulated sensor model provides it |
| Time source | Wall/robot time | Gazebo `/clock` through `use_sim_time` | Simulator `/clock` through `use_sim_time` |
| TF integration | Namespaced Jackal TF topics | Standard `/tf` and `/tf_static` | Standard or `namespace`-prefixed TF topics |
| Robot and sensors | Base services run separately | Default launch owns TurtleBot3 Gazebo | External or included custom simulator |

After `/adbscan/points`, all three routes are architecturally identical:
`adbscan_ros2` publishes `/obstacle_array`, both Nav2 costmaps apply
`ADBScanLayer`, and `wandering_app` sends exploration goals through
`NavigateToPose`. A successful stock simulation therefore validates the ROS 2
interfaces and Nav2 integration, while a depth-enabled model is required to
validate the production sensor-fusion behavior.

## Launch files

| Launch File | Type | Purpose | Consumed By / Notes |
| :--- | :--- | :--- | :--- |
| `wandering_jackal.launch.py` | Top-level entry point | Complete autonomous pipeline on Clearpath Jackal hardware (RealSense $\rightarrow$ `/scan`, RTAB-Map SLAM, Nav2, ADBSCAN perception, `wandering`, RViz). | Primary hardware launch |
| `wandering_jackal_manual_nav.launch.py` | Top-level entry point | Interactive manual navigation on Jackal with RViz Wandering Control panel for operator goals. | Includes `wandering_jackal.launch.py` |
| `wandering_sim.launch.py` | Top-level entry point | Primary simulation route: starts composed RGB-D TurtleBot3 Waffle (or custom robot), selectable SLAM (`rtabmap` or `slam_toolbox`), Nav2, ADBSCAN, and `wandering_app`. | Primary simulation launch |
| `test_wandering_adbscan_scanonly_sim.launch.py` | Test entry point | Minimal scan-only compatibility simulation fixture for stock TurtleBot3 Waffle without depth cameras. | Test fixture |
| `test_turtlebot3_headless.launch.py` | Test entry point | Headless Gazebo harness for automated CI smoke tests (`make test-bringup-e2e`). | CI / Test fixture |
| `dep_adbscan_perception.launch.py` | Internal building block | Point-cloud fusion node, ADBSCAN 3D clustering node, and costmap obstacle marker publisher. | Consumed by `wandering_jackal.launch.py`, `wandering_sim.launch.py`, and `test_wandering_adbscan_scanonly_sim.launch.py` |
| `dep_navigation_jackal.launch.py` | Internal building block | Nav2 navigation stack configured for Clearpath Jackal. | Consumed by `wandering_jackal.launch.py` |
| `dep_rtabmap_jackal.launch.py` | Internal building block | RTAB-Map SLAM and RGB-D synchronization for Clearpath Jackal RealSense sensor. | Consumed by `wandering_jackal.launch.py` |
| `dep_rgbd_camera_bridge.launch.py` | Internal building block | Bridges Gazebo generic RGB-D camera topics to ROS 2 topics and publishes the optical frame static transform. | Consumed by `wandering_sim.launch.py` |
| `dep_wandering_rgbd_simulator.launch.py` | Internal building block | Starts Gazebo Sim world, TurtleBot3 robot state publisher, ROS-Gazebo parameter bridge, and spawns the RGB-D model. | Consumed by `wandering_sim.launch.py` |
| `dep_spawn_rgbd_robot.launch.py` | Internal building block | Spawns the composed TurtleBot3 Waffle RGB-D robot model into Gazebo. | Consumed by `dep_wandering_rgbd_simulator.launch.py` |

### Clearpath Jackal

#### Autonomous bringup

Run the complete autonomous pipeline:

```bash
export ROBOT_NAMESPACE=/j100_0812
ros2 launch wandering_bringup wandering_jackal.launch.py
```

The launch starts, in order:

1. `depthimage_to_laserscan`, which derives `/scan` from the RealSense depth
   image.
2. RTAB-Map SLAM.
3. The Jackal Nav2 stack.
4. The fusion and ADBSCAN perception nodes.
5. `wandering_app` and, when a display is available, RViz.

Set `enable_adbscan:=false` to start the standard 2D LiDAR Nav2 configuration
without the fusion and ADBSCAN perception nodes:

```bash
ros2 launch wandering_bringup wandering_jackal.launch.py enable_adbscan:=false
```

Jackal base services publish TF under `<robot_namespace>/tf` and
`<robot_namespace>/tf_static`; the launch remaps fusion and `wandering` to those
topics. The launch expects the Clearpath base services, including the configured
RealSense sensor, to already be running. `robot_namespace` defaults to
`$ROBOT_NAMESPACE`, or `/j100_0812` if the environment variable is unset. To
use a different robot, set `ROBOT_NAMESPACE` before launching, for example:

```bash
export ROBOT_NAMESPACE=/j100_0123
```

The `pointcloud_topic` launch argument overrides the `cloud_topic` value from
the fusion YAML. Set it to the RealSense point-cloud topic actually published
by the robot. Other sensor and RTAB-Map topic arguments are exposed in the
launch file for platforms with different RealSense namespaces.

#### Manual override in RViz

Run the manual-control variant to retain autonomous mapping while allowing an
operator to take control without restarting the stack:

```bash
export ROBOT_NAMESPACE=/j100_0812
ros2 launch wandering_bringup wandering_jackal_manual_nav.launch.py
```

Select **Manual mode** in the **Wandering Control** panel to pause autonomous
exploration and cancel its active goal. Select Nav2's **Goal** tool in the RViz
toolbar and click-drag a pose on the map to send a `NavigateToPose` goal. Select
**Autonomous mode** to resume frontier exploration. Nav2 continues to use the
ADBSCAN costmap layer while an operator goal is active.

Manual bringup accepts the same sensor and parameter arguments as the complete
Jackal launch. For example, use its `fusion_params_file`, `adbscan_params_file`,
and `pointcloud_topic` arguments to operate with the Velodyne Puck profile.
Set `manual_rviz:=false` when a graphical RViz window is not wanted.

To retain an RTAB-Map database while mapping an area, choose an explicit path:

```bash
ros2 launch wandering_bringup wandering_jackal_manual_nav.launch.py \
  rtabmap_database_path:=/data/maps/site_a.db
```

#### Velodyne Puck input

The production Jackal launch can use the Puck cloud as its ADBSCAN input while
retaining the RealSense-derived `/scan` for Nav2 and fusion. First identify the
robot-service `PointCloud2` topic and frame:

```bash
ros2 topic list -t | grep sensor_msgs/msg/PointCloud2
export VELODYNE_CLOUD_TOPIC=/velodyne_points
ros2 topic echo --once "$VELODYNE_CLOUD_TOPIC" header
```

The cloud frame must resolve to `base_link` through the robot's namespaced TF
tree. Then launch the normal pipeline with the Puck tuning preset and topic:

```bash
export ROBOT_NAMESPACE=/j100_0812
ros2 launch wandering_bringup wandering_jackal.launch.py \
  fusion_params_file:=$(ros2 pkg prefix wandering_bringup)/share/wandering_bringup/params/pointcloud_fusion_jackal_velodyne.yaml \
  adbscan_params_file:=$(ros2 pkg prefix wandering_bringup)/share/wandering_bringup/params/adbscan_velodyne.yaml \
  pointcloud_topic:=$VELODYNE_CLOUD_TOPIC
```

`adbscan_pointcloud_fusion` transforms the Puck cloud to `base_link`, crops it
to the robot's near-field driveable area, removes floor-height returns, and
voxel-downsamples the result. The Puck preset does not append `/scan` to this
cloud, because planar scan returns can bridge separate 3D objects into one
oversized cluster. `/scan` remains available to SLAM, Nav2, and collision
monitoring.

`adbscan_ros2` consumes `/adbscan/points` in 3D mode, so no Nav2 or ADBSCAN
topic changes are required.

### Gazebo simulation

The simulation launch runs the same Nav2, ADBSCAN costmap, and `wandering`
workflow as the physical robot. Its default simulator is TurtleBot3 Waffle in
Gazebo.

#### Primary RGB-D simulation

Install the bringup package and TurtleBot3 simulator, or build and source this
workspace. Then start the complete RGB-D route:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py
```

This starts the composed TurtleBot3 Waffle RGB-D simulator, SLAM-enabled Nav2,
ADBSCAN perception, `wandering_app`, and RViz views for the global and local
costmaps. Set `gui:=true` to start the Gazebo client.

#### Scan-only test simulation

`test_wandering_adbscan_scanonly_sim.launch.py` is a test-only compatibility
route for the stock TurtleBot3 Waffle. It converts `/scan` to a planar cloud
for ADBSCAN and does not validate depth-camera behavior. The promotion-gate
tests use it with `test_turtlebot3_headless.launch.py` because it is a minimal,
deterministic Gazebo fixture.

For a stationary test startup check, disable autonomous goals and RViz:

```bash
ros2 launch wandering_bringup test_wandering_adbscan_scanonly_sim.launch.py \
  start_wandering:=false use_rviz:=false
```

In another sourced terminal, verify the data path:

```bash
ros2 topic hz /scan
ros2 topic hz /adbscan/points
ros2 topic echo /obstacle_array --once
```

The repository also provides a headless scan-only compatibility smoke test. It
starts the Gazebo server, Nav2, and ADBSCAN perception, then verifies runtime
TF, scan, local-costmap, node, and ADBScan-layer readiness without starting
RViz or autonomous `wandering`:

```bash
ROS_DISTRO=jazzy make test-bringup-e2e
```

`/obstacle_array` is detection-driven, so the last command waits until ADBSCAN
finds a cluster. Once the pipeline is healthy, omit `start_wandering:=false`
to let the robot explore autonomously.

#### Custom RGB-D simulated robot

For a custom depth-enabled model, use a model that publishes `PointCloud2` and
provide a robot-specific fusion file with `fuse_cloud: true` and the correct
`cloud_topic`. `wandering_sim.launch.py` can switch the owner of the
`map` to `odom` transform without changing Nav2 or ADBSCAN. SLAM Toolbox uses
`/scan`; the RGB topic remains available for visual inspection but is not a
SLAM Toolbox input:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py \
  slam_backend:=slam_toolbox
```

The RTAB-Map route synchronizes RGB, aligned depth, and camera info. By default
it maps from this RGB-D stream alone, which allows the simulator to start
mapping without waiting for scan-to-camera synchronization:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py \
  slam_backend:=rtabmap
```

With RViz enabled, this launch opens global-map and local-costmap windows plus
an `rqt_image_view` RGB-D Color Image window. The color stream uses Qt rather
than RViz to avoid an Ogre/GLX conflict between image and indexed costmap
rendering.

The RGB-D launch runs Gazebo server-only by default. Start the interactive
Gazebo client when inspecting the simulated scene:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py \
  slam_backend:=rtabmap gui:=true
```

The launch starts the included TurtleBot3 Waffle RGB-D adapter by default. Its
robot model is an SDF composition: the stock Waffle is merged with the
standalone `generic_rgbd_camera` payload. The payload publishes one intrinsically
aligned Gazebo RGB-D stream, and the internal `dep_rgbd_camera_bridge.launch.py`
exposes it as:

- `/camera/color/image_raw`
- `/camera/color/camera_info`
- `/camera/aligned_depth_to_color/image_raw`
- `/camera/depth/color/points`

The payload uses Gazebo's optical-frame support so all four messages identify
`camera_rgb_optical_frame`. The bridge launch publishes the configurable static
transform from `camera_parent_frame` to that optical frame.

To adapt another simulated robot, create a small SDF model like
`models/turtlebot3_waffle_rgbd/model.sdf`: merge the robot model, merge
`model://generic_rgbd_camera`, place it relative to the robot base, and add a
fixed joint to `rgbd_camera_link`. A simulator adapter must start its world,
publish the robot's odometry and TF, bridge `/scan` and base commands, and spawn
the composed model. Pass that launch file through `simulator_launch_file`; the
SLAM, RGB-D bridge, Nav2, and ADBSCAN portions remain unchanged.

Before comparing SLAM backends, verify the reusable sensor contract:

```bash
ros2 topic hz /camera/color/image_raw
ros2 topic hz /camera/aligned_depth_to_color/image_raw
ros2 topic echo /camera/color/camera_info --once
ros2 topic hz /camera/depth/color/points
ros2 run tf2_ros tf2_echo base_link camera_rgb_optical_frame
```

Set `subscribe_scan:=true` when the simulator's scan and RGB-D timestamps are
synchronized and scan constraints should also be passed to RTAB-Map. Nav2 always
uses `/scan`; the RGB-D profile sends the continuous depth cloud directly to
ADBSCAN so it does not wait for scan-to-camera synchronization. Detections are
published on `/obstacle_array`. Override `rgb_topic`, `rgb_camera_info_topic`,
`aligned_depth_topic`, `cloud_topic`, and `scan_topic` when the custom model
uses different names. To include the model's simulator from the same command,
also set `start_simulator:=true` and `simulator_launch_file` to its launch file.

```bash
ros2 launch my_robot_sim simulation.launch.py
ros2 launch wandering_bringup wandering_sim.launch.py \
  start_simulator:=false \
  params_file:=/path/to/my_robot_nav2_adbscan.yaml \
  fusion_params_file:=/path/to/my_robot_fusion.yaml \
  scan_topic:=/my_robot/scan \
  cloud_topic:=/my_robot/depth/points \
  namespace:=/my_robot
```

The robot-specific Nav2 file must configure its footprint or radius, motion
limits, frames, and `nav2_adbscan_layer::ADBScanLayer` plugins. The fusion file
must configure the target frame, depth-cloud topic, crop, and synchronization.
Both sensor frames must resolve to the target frame. Leave `namespace` empty
when the simulator publishes the standard `/tf` and `/tf_static` topics.

Alternatively, have this entry point include a custom simulator launch file:

```bash
ros2 launch wandering_bringup wandering_sim.launch.py \
  simulator_launch_file:=/path/to/my_robot_sim.launch.py \
  params_file:=/path/to/my_robot_nav2_adbscan.yaml \
  fusion_params_file:=/path/to/my_robot_fusion.yaml \
  scan_topic:=/my_robot/scan \
  cloud_topic:=/my_robot/depth/points
```

The included simulator receives `use_sim_time`. It must publish `/clock`, TF,
odometry, a `LaserScan`, and a depth `PointCloud2`. Override
`adbscan_params_file` when the simulated sensor needs different clustering
tuning.

## Key configuration

- `params/jackal_nav_adbscan.param.yaml`: Jackal Nav2 configuration, including
  the ADBSCAN layer in both costmaps.
- `params/nav2_adbscan_sim.param.yaml`: Simulation equivalent.
- `params/pointcloud_fusion_jackal.yaml`: Jackal fusion frame, sensor topics,
  synchronization, and voxel filtering.
- `params/pointcloud_fusion_jackal_velodyne.yaml`: Jackal fusion parameters
  tuned for a Velodyne Puck cloud.
- `params/pointcloud_fusion_rgbd_sim.yaml`: Fusion parameters for the primary
  RGB-D simulation target (`fuse_cloud: true`, `fuse_scan: false`, ground plane
  removal).
- `params/pointcloud_fusion_sim.yaml`: Scan-only fusion parameters for the
  stock TurtleBot3 Waffle test fallback route; enable and configure
  `fuse_cloud` for a depth-enabled model.
- `params/adbscan_velodyne.yaml`: Puck-specific clustering limits for the
  immediate navigation area.
- `params/adbscan_fused.yaml`: 3D ADBSCAN ROI, ground-removal, and clustering
  settings for the fused cloud.

For a functional fusion path, both sensor frames must be transformable to the
configured `target_frame` (normally `base_link`). When both inputs are enabled,
their timestamps must be close enough for the configured approximate-time
synchronizer to pair them.
