# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(collab_slam NONE)

find_package(ament_cmake REQUIRED)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-collab-slam"
  DESCRIPTION "Top-level metapackage for Intel Collaborative SLAM"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-univloc-msgs"
    "ros-${ROS_DISTRO}-univloc-slam"
    "ros-${ROS_DISTRO}-univloc-tracker"
    "ros-${ROS_DISTRO}-univloc-server"
)
