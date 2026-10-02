# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(cslam_tutorial_all NONE)

find_package(ament_cmake REQUIRED)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-cslam-tutorial-all"
  DESCRIPTION "Intel Collaborative SLAM all tutorials metapackage"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-cslam-tutorial-2d-lidar"
    "ros-${ROS_DISTRO}-cslam-tutorial-fastmapping"
    "ros-${ROS_DISTRO}-cslam-tutorial-multi-camera"
    "ros-${ROS_DISTRO}-cslam-tutorial-region-remap"
    "ros-${ROS_DISTRO}-cslam-tutorial-two-robot"
)
