# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.16)
project(wandering_benchmarks LANGUAGES C CXX)

find_package(benchmark CONFIG REQUIRED)
find_package(MPI REQUIRED COMPONENTS C)
find_package(adbscan_sensor_fusion REQUIRED)

add_subdirectory(pointcloud_filter)