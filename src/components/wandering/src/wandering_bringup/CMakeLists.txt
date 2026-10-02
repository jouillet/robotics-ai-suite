# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(wandering_bringup)

find_package(ament_cmake REQUIRED)

option(WANDERING_ENABLE_E2E_TESTS "Enable Gazebo-based bringup E2E tests" OFF)

install(DIRECTORY
  config
  launch
  models
  params
  rviz
  DESTINATION share/${PROJECT_NAME}
)

install(FILES README.md
  DESTINATION share/${PROJECT_NAME}
)

if(BUILD_TESTING)
  find_package(ament_cmake_pytest REQUIRED)
  ament_add_pytest_test(test_wandering_adbscan_scanonly_sim_launch
    test/test_wandering_adbscan_scanonly_sim_launch.py
  )
  ament_add_pytest_test(test_wandering_sim_launch
    test/test_wandering_sim_launch.py
  )
  ament_add_pytest_test(test_navigation_jackal_launch
    test/test_navigation_jackal_launch.py
  )
  ament_add_pytest_test(test_rtabmap_jackal_launch
    test/test_rtabmap_jackal_launch.py
  )
  ament_add_pytest_test(test_wandering_jackal_launches
    test/test_wandering_jackal_launches.py
  )
  ament_add_pytest_test(test_rgbd_sim_assets
    test/test_rgbd_sim_assets.py
  )
  if(WANDERING_ENABLE_E2E_TESTS)
    find_package(launch_testing_ament_cmake REQUIRED)
    add_launch_test(test/test_wandering_adbscan_scanonly_sim_smoke_launch.py TIMEOUT 120)
    set_tests_properties(test_test_wandering_adbscan_scanonly_sim_smoke_launch.py
      PROPERTIES LABELS "e2e"
    )
  endif()
endif()

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-wandering-bringup"
  DESCRIPTION "Wandering platform bringup and simulation"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
  DEPENDS
    "ros-${ROS_DISTRO}-adbscan-sensor-fusion"
    "ros-${ROS_DISTRO}-nav2-adbscan-layer"
    "ros-${ROS_DISTRO}-adbscan-ros2"
    "ros-${ROS_DISTRO}-nav2-bringup"
    "ros-${ROS_DISTRO}-nav2-rviz-plugins"
    "ros-${ROS_DISTRO}-nav2-dynamic-msgs"
    "ros-${ROS_DISTRO}-rqt-image-view"
    "ros-${ROS_DISTRO}-depth-image-proc"
    "ros-${ROS_DISTRO}-depthimage-to-laserscan"
    "ros-${ROS_DISTRO}-launch"
    "ros-${ROS_DISTRO}-launch-ros"
    "ros-${ROS_DISTRO}-rmw-cyclonedds-cpp"
    "ros-${ROS_DISTRO}-ros-gz-bridge"
    "ros-${ROS_DISTRO}-ros-gz-sim"
    "ros-${ROS_DISTRO}-rtabmap-ros"
    "ros-${ROS_DISTRO}-tf2-ros"
    "ros-${ROS_DISTRO}-turtlebot3-gazebo"
    "ros-${ROS_DISTRO}-wandering-app"
  RECOMMENDS
    "ros-${ROS_DISTRO}-clearpath-platform"
    "ros-${ROS_DISTRO}-clearpath-robot"
    "ros-${ROS_DISTRO}-clearpath-sensors"
)
