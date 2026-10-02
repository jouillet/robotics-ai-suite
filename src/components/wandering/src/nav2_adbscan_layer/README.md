<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# `nav2_adbscan_layer`

`nav2_adbscan_layer` provides a `nav2_costmap_2d` plugin layer that consumes
clustered 3D obstacle detections published by `adbscan_ros2`
(`nav2_dynamic_msgs/ObstacleArray`) and marks them into Nav2 local and global
costmaps.

The package also provides a helper node, `adbscan_obstacle_markers`, which
converts incoming obstacle arrays into RViz `visualization_msgs/MarkerArray`
bounding boxes and velocity vectors for operator visualization.

## Package contents and structure

```
nav2_adbscan_layer/
├── CMakeLists.txt
├── package.xml
├── nav2_adbscan_layer.xml              # Pluginlib export for Nav2 Costmap2D layer
├── include/
│   └── nav2_adbscan_layer/
│       └── adbscan_layer.hpp           # ADBScanLayer costmap plugin definition
├── src/
│   ├── adbscan_layer.cpp               # Costmap layer marking and lifecycle implementation
│   └── adbscan_obstacle_markers.cpp    # RViz visualization marker publisher node
└── test/
    └── test_adbscan_layer.cpp          # Unit tests for transformation and marking logic
```

## Architecture and components

### Costmap plugin (`nav2_adbscan_layer::ADBScanLayer`)

`ADBScanLayer` is a `nav2_costmap_2d::Layer` plugin that integrates into Nav2's
layered costmap pipeline:

1. **Detection ingestion:** Subscribes to `/obstacle_array`
   (`nav2_dynamic_msgs/msg/ObstacleArray`).
2. **Frame transformation:** Transforms each obstacle centroid to the costmap's
   global frame using TF2.
3. **Footprint stamping:** Calculates an obstacle marking radius based on the
   cluster's horizontal extent ($x, y$), configured footprint padding, and a
   minimum marking radius. It marks a filled lethal circle into the costmap.
4. **Persistence and expiration:** Detections are maintained in an internal
   cache for a configurable time-to-live (`time_to_live`). Expired obstacles are
   automatically purged to prevent ghost obstacles.
5. **Dynamic reconfigurability:** Layer parameters can be updated dynamically at
   runtime through standard ROS 2 parameter interfaces.

### Obstacle marker publisher (`adbscan_obstacle_markers`)

A lightweight standalone ROS 2 node that consumes `/obstacle_array` and
publishes:

* **Bounding boxes:** Semi-transparent 3D cubes scaled to each obstacle's
  measured bounding box ($x, y, z$), color-coded by detection confidence score.
* **Velocity arrows:** Directional arrows indicating obstacle velocity vectors
  when velocity tracking is active.

## Interfaces

### Subscribed topics

| Topic | Type | Description |
| :--- | :--- | :--- |
| `/obstacle_array` | `nav2_dynamic_msgs/msg/ObstacleArray` | Clustered 3D obstacles produced by ADBSCAN perception. |
| `/tf`, `/tf_static` | `tf2_msgs/msg/TFMessage` | Coordinate frame transforms to project detections into the costmap global frame. |

### Published topics (`adbscan_obstacle_markers`)

| Topic | Type | Description |
| :--- | :--- | :--- |
| `/adbscan/obstacle_markers` | `visualization_msgs/msg/MarkerArray` | RViz markers showing obstacle bounding boxes and velocity vectors. |

## Plugin configuration

To enable `nav2_adbscan_layer::ADBScanLayer` in a Nav2 costmap configuration
(e.g., in `nav2_params.yaml`), declare it under the costmap's `plugins` list:

```yaml
local_costmap:
  local_costmap:
    ros__parameters:
      plugins: ["voxel_layer", "adbscan_layer", "inflation_layer"]
      adbscan_layer:
        plugin: "nav2_adbscan_layer::ADBScanLayer"
        enabled: true
        obstacle_topic: "/obstacle_array"
        time_to_live: 0.5
        footprint_padding: 0.05
        min_mark_radius: 0.04
        max_obstacle_extent: 2.5
        max_detection_distance: 6.0
        combination_method: 1
```

### Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `enabled` | `bool` | `true` | Whether the costmap layer is active. |
| `obstacle_topic` | `string` | `""` | Obstacle topic name (defaults to `/obstacle_array` or costmap-scoped default). |
| `default_obstacle_frame` | `string` | `""` | Fallback frame ID when message header frame is empty. |
| `time_to_live` | `double` | `0.5` | Duration in seconds to retain an obstacle detection before expiring. |
| `footprint_padding` | `double` | `0.05` | Extra radius padding in metres added around detected obstacles. |
| `min_mark_radius` | `double` | `0.04` | Minimum lethal marking circle radius in metres. |
| `max_obstacle_extent` | `double` | `2.5` | Maximum obstacle size in metres; larger clusters (walls/floors) are ignored. |
| `max_detection_distance`| `double` | `6.0` | Maximum distance from robot to mark obstacles into the costmap. |
| `transform_tolerance` | `double` | `0.2` | Allowed TF lookup tolerance in seconds. |
| `combination_method` | `int` | `1` | Method for updating costmap cell values (0 = Overwrite, 1 = Maximum). |
| `track_velocity` | `bool` | `false` | Enable velocity-based obstacle position projection. |

## Testing and verification

Run the GTest unit suite:

```bash
colcon test --packages-select nav2_adbscan_layer --event-handlers console_direct+
colcon test-result --verbose
```
