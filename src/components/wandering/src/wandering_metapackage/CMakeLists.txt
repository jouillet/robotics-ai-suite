# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(wandering NONE)

find_package(ament_cmake REQUIRED)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-wandering"
  DESCRIPTION "Top-level metapackage for the Wandering application stack"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-wandering-app"
    "ros-${ROS_DISTRO}-adbscan-sensor-fusion"
    "ros-${ROS_DISTRO}-nav2-adbscan-layer"
    "ros-${ROS_DISTRO}-wandering-bringup"
)