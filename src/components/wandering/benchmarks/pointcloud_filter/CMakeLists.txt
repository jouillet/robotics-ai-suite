# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

add_executable(benchmark_pointcloud_filter benchmark_pointcloud_filter.cpp)
target_link_libraries(benchmark_pointcloud_filter PRIVATE
  adbscan_sensor_fusion::pointcloud_filter
  benchmark::benchmark_main
)