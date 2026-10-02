# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(cslam_tutorial_common NONE)

find_package(ament_cmake REQUIRED)

install(FILES scripts/pre.sh
  DESTINATION share/collab-slam
  PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_EXECUTE WORLD_READ WORLD_EXECUTE
)
install(DIRECTORY scripts
  DESTINATION share/${PROJECT_NAME}
  USE_SOURCE_PERMISSIONS
)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-cslam-tutorial-common"
  DESCRIPTION "Intel Collaborative SLAM tutorial common files"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-collab-slam"
    "ros-${ROS_DISTRO}-rviz2"
)
