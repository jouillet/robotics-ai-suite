// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#ifndef WANDERING_BENCHMARKS__POINTCLOUD_FILTER__FIXTURES_HPP_
#define WANDERING_BENCHMARKS__POINTCLOUD_FILTER__FIXTURES_HPP_

#include <cstddef>

#include "pcl/point_cloud.h"
#include "pcl/point_types.h"

namespace wandering_benchmarks::pointcloud_filter
{

inline pcl::PointCloud<pcl::PointXYZ> makeRepresentativeCloud(std::size_t point_count)
{
  pcl::PointCloud<pcl::PointXYZ> cloud;
  cloud.reserve(point_count);
  for (std::size_t index = 0; index < point_count; ++index) {
    const float x = static_cast<float>(index % 400U) * 0.02F - 4.0F;
    const float y = static_cast<float>((index / 400U) % 400U) * 0.02F - 4.0F;
    const float z = index % 5U == 0U ? 0.0F : 0.1F + static_cast<float>(index % 20U) * 0.01F;
    cloud.emplace_back(x, y, z);
  }
  cloud.width = static_cast<uint32_t>(cloud.size());
  cloud.height = 1;
  cloud.is_dense = true;
  return cloud;
}

}  // namespace wandering_benchmarks::pointcloud_filter

#endif  // WANDERING_BENCHMARKS__POINTCLOUD_FILTER__FIXTURES_HPP_