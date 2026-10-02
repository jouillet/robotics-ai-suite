# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(cslam_tutorial_2d_lidar NONE)

find_package(ament_cmake REQUIRED)

install(FILES scripts/cslam-2d-lidar.sh
  DESTINATION share/collab-slam/tutorial-2d-lidar
  PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_EXECUTE WORLD_READ WORLD_EXECUTE
)
install(DIRECTORY scripts
  DESTINATION share/${PROJECT_NAME}
  USE_SOURCE_PERMISSIONS
)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-cslam-tutorial-2d-lidar"
  DESCRIPTION "Intel Collaborative SLAM tutorial for 2D LIDAR"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-cslam-tutorial-common"
    "ros-${ROS_DISTRO}-bagfile-2d-lidar"
)
