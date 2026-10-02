// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include <benchmark/benchmark.h>

#include <cstdint>

#include "adbscan_sensor_fusion/pointcloud_filter.hpp"
#include "fixtures.hpp"

namespace
{

void benchmarkFilter(benchmark::State & state, bool use_voxel_filter)
{
  const auto point_count = static_cast<std::size_t>(state.range(0));
  const auto cloud = wandering_benchmarks::pointcloud_filter::makeRepresentativeCloud(point_count);
  adbscan_sensor_fusion::PointCloudFilterOptions options;
  options.min_x = -3.0;
  options.max_x = 3.0;
  options.min_y = -3.0;
  options.max_y = 3.0;
  options.min_z = -0.1;
  options.max_z = 1.0;
  options.min_range = 0.2;
  options.max_range = 4.0;
  options.use_voxel_filter = use_voxel_filter;
  options.voxel_leaf_size = 0.03;

  for (auto _ : state) {
    const auto result = adbscan_sensor_fusion::filterPointCloud(cloud, options);
    auto output_size = result.cloud.size();
    benchmark::DoNotOptimize(output_size);
  }
  state.SetItemsProcessed(static_cast<int64_t>(state.iterations()) * state.range(0));
}

void BM_PointCloudFilterWithVoxel(benchmark::State & state) { benchmarkFilter(state, true); }

void BM_PointCloudFilterWithoutVoxel(benchmark::State & state) { benchmarkFilter(state, false); }

BENCHMARK(BM_PointCloudFilterWithVoxel)->RangeMultiplier(10)->Range(1'000, 100'000);
BENCHMARK(BM_PointCloudFilterWithoutVoxel)->RangeMultiplier(10)->Range(1'000, 100'000);

}  // namespace