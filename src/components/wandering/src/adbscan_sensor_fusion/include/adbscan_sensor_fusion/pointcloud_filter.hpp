// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#ifndef ADBSCAN_SENSOR_FUSION__POINTCLOUD_FILTER_HPP_
#define ADBSCAN_SENSOR_FUSION__POINTCLOUD_FILTER_HPP_

#include <cstddef>
#include <limits>
#include <utility>

#include "pcl/point_cloud.h"
#include "pcl/point_types.h"

namespace adbscan_sensor_fusion
{

struct PointCloudFilterOptions
{
  double min_x{-std::numeric_limits<double>::infinity()};
  double max_x{std::numeric_limits<double>::infinity()};
  double min_y{-std::numeric_limits<double>::infinity()};
  double max_y{std::numeric_limits<double>::infinity()};
  double min_z{-std::numeric_limits<double>::infinity()};
  double max_z{std::numeric_limits<double>::infinity()};
  // Horizontal radial-distance bounds in the x-y ground plane.
  double min_range{0.0};
  double max_range{std::numeric_limits<double>::infinity()};
  bool remove_ground{false};
  double ground_distance_threshold{0.08};
  double ground_max_tilt_degrees{12.0};
  bool use_voxel_filter{true};
  double voxel_leaf_size{0.03};
};

struct PointCloudFilterResult
{
  pcl::PointCloud<pcl::PointXYZ> cloud;
  std::size_t input_count{0};
  std::size_t cropped_count{0};
  std::size_t ground_filtered_count{0};
};

PointCloudFilterResult filterPointCloud(
  pcl::PointCloud<pcl::PointXYZ> cloud, const PointCloudFilterOptions & options);

}  // namespace adbscan_sensor_fusion

#endif  // ADBSCAN_SENSOR_FUSION__POINTCLOUD_FILTER_HPP_
