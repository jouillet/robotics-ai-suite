# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(cslam_tutorial_fastmapping NONE)

find_package(ament_cmake REQUIRED)

install(FILES scripts/cslam-fastmapping.sh
  DESTINATION share/collab-slam/tutorial-fastmapping
  PERMISSIONS OWNER_READ OWNER_WRITE OWNER_EXECUTE GROUP_READ GROUP_EXECUTE WORLD_READ WORLD_EXECUTE
)
install(FILES config/collab_slam_fm.rviz
  DESTINATION share/collab-slam/tutorial-fastmapping
)
install(DIRECTORY scripts config
  DESTINATION share/${PROJECT_NAME}
  USE_SOURCE_PERMISSIONS
)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-cslam-tutorial-fastmapping"
  DESCRIPTION "Intel Collaborative SLAM tutorial for Fastmapping"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-cslam-tutorial-common"
    "ros-${ROS_DISTRO}-bagfile-robot1"
)
