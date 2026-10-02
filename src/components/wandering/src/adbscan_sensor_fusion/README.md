<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# `adbscan_sensor_fusion`

`adbscan_sensor_fusion` provides a point-cloud fusion node and filtering library
that combine a 2D planar LiDAR (`sensor_msgs/msg/LaserScan`) and a 3D depth-camera
or LiDAR point cloud (`sensor_msgs/msg/PointCloud2`) into a unified 3D point cloud
expressed in a common robot target frame (typically `base_link`).

The resulting point cloud maintains full $360^\circ$ planar coverage while gaining
height-aware 3D detection for small obstacles, overhanging structures, and negative
obstacles. Downstream, `adbscan_ros2` consumes this cloud to perform 3D spatial
clustering.

## Package contents and structure

```
adbscan_sensor_fusion/
├── CMakeLists.txt
├── package.xml
├── config/
│   └── pointcloud_fusion.yaml          # Default fusion node parameter configuration
├── include/
│   └── adbscan_sensor_fusion/
│       └── pointcloud_filter.hpp       # PCL-based filtering and ground removal library
├── src/
│   ├── pointcloud_filter.cpp           # ROI cropping, plane fitting, and voxel downsampling
│   └── pointcloud_fusion_node.cpp      # ROS 2 sensor synchronization and TF projection node
└── test/
    ├── test_pointcloud_filter.cpp      # GTest unit tests for filtering functions
    ├── test_pointcloud_fusion_launch.py
    ├── test_pointcloud_fusion_cloud_launch.py
    ├── test_pointcloud_fusion_dual_launch.py
    ├── test_pointcloud_fusion_missing_stream_launch.py
    ├── test_pointcloud_fusion_missing_tf_launch.py
    └── test_pointcloud_fusion_skew_launch.py
```

## Architecture and components

### Fusion node (`pointcloud_fusion_node`)

The `pointcloud_fusion_node` supports multiple ingestion modes configured via
`fuse_scan` and `fuse_cloud`:

1. **Dual sensor fusion (`fuse_scan: true`, `fuse_cloud: true`):** Uses an
   `message_filters::sync_policies::ApproximateTime` synchronizer to pair incoming
   `LaserScan` and `PointCloud2` messages within a configurable skew threshold
   (`sync_max_interval`).
2. **Scan-only mode (`fuse_scan: true`, `fuse_cloud: false`):** Projects 2D
   `LaserScan` range measurements into 3D space using `laser_geometry` and the
   sensor mount's TF frame.
3. **Cloud-only mode (`fuse_scan: false`, `fuse_cloud: true`):** Transforms and
   filters depth camera or 3D LiDAR point clouds without waiting for scan
   synchronization.
4. **TF transformation:** Projects all point measurements into the configured
   `target_frame` (e.g., `base_link`).
5. **Point-cloud filtering (`pointcloud_filter`):** Applies optional 3D box
   cropping, radial range bounds, ground plane segmentation/removal, and voxel
   grid downsampling before publishing.

### Filtering library (`pointcloud_filter`)

A reusable C++ library (`libpointcloud_filter.so`) built on PCL:

* **Axis-aligned ROI cropping:** Bounds point coordinates within $[min_x, max_x]$,
  $[min_y, max_y]$, and $[min_z, max_z]$.
* **Radial range filtering:** Retains points within $[min\_range, max\_range]$ from
  the target frame origin.
* **RANSAC ground plane removal:** Fits a planar model to near-horizontal returns
  within a tilt angle tolerance (`ground_max_tilt_degrees`) and removes floor
  reflections within `ground_distance_threshold`.
* **Voxel grid downsampling:** Downsamples point density using a configurable leaf
  size (`voxel_leaf_size`) to keep clustering latencies bounded.

## Interfaces

### Subscribed topics

| Topic | Type | Description |
| :--- | :--- | :--- |
| `scan` | `sensor_msgs/msg/LaserScan` | 2D LiDAR scan input (or derived depth scan). |
| `/camera/depth/color/points` | `sensor_msgs/msg/PointCloud2` | 3D depth camera or LiDAR point cloud input. |
| `/tf`, `/tf_static` | `tf2_msgs/msg/TFMessage` | Transformations to project sensor frames into `target_frame`. |

### Published topics

| Topic | Type | Description |
| :--- | :--- | :--- |
| `adbscan/points` | `sensor_msgs/msg/PointCloud2` | Fused and filtered 3D point cloud expressed in `target_frame`. |

## Key parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `target_frame` | `string` | `base_link` | Coordinate frame into which all sensor data is transformed. |
| `scan_topic` | `string` | `scan` | Input topic name for `sensor_msgs/msg/LaserScan`. |
| `cloud_topic` | `string` | `/camera/depth/color/points` | Input topic name for `sensor_msgs/msg/PointCloud2`. |
| `output_topic` | `string` | `adbscan/points` | Output topic name for the fused point cloud. |
| `fuse_scan` | `bool` | `true` | Enable fusing 2D LiDAR scan returns. |
| `fuse_cloud` | `bool` | `true` | Enable fusing 3D depth point clouds. |
| `scan_range_cutoff` | `double` | `-1.0` | Maximum scan range cutoff in metres (-1.0 preserves sensor max). |
| `min_x` / `max_x` | `double` | `-.inf` / `.inf` | Spatial cropping boundaries along the X axis in metres. |
| `min_y` / `max_y` | `double` | `-.inf` / `.inf` | Spatial cropping boundaries along the Y axis in metres. |
| `min_z` / `max_z` | `double` | `-.inf` / `.inf` | Height cropping boundaries along the Z axis in metres. |
| `min_range` / `max_range` | `double` | `0.0` / `.inf` | Radial distance filter bounds in metres. |
| `remove_ground` | `bool` | `false` | Enable RANSAC ground plane segmentation and removal. |
| `ground_distance_threshold` | `double` | `0.08` | Distance threshold in metres for ground plane inliers. |
| `ground_max_tilt_degrees` | `double` | `12.0` | Maximum tilt in degrees allowed for the ground normal. |
| `use_voxel_filter` | `bool` | `true` | Enable voxel grid downsampling. |
| `voxel_leaf_size` | `double` | `0.03` | Voxel cube edge length in metres for downsampling. |
| `sync_queue_size` | `int` | `10` | Message queue size for approximate-time synchronizer. |
| `sync_max_interval` | `double` | `0.1` | Maximum timestamp skew in seconds for pairing scan and cloud. |
| `transform_timeout` | `double` | `0.1` | Maximum TF lookup wait timeout in seconds. |

## Testing and verification

Run the GTest unit suite and launch testing harnesses:

```bash
colcon test --packages-select adbscan_sensor_fusion --event-handlers console_direct+
colcon test-result --verbose
```
