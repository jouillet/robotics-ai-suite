# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(nav2_adbscan_layer)

if(NOT CMAKE_C_STANDARD)
  set(CMAKE_C_STANDARD 99)
endif()
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  add_compile_options(-Wall -Wextra -Wpedantic)
endif()

find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_lifecycle REQUIRED)
find_package(nav2_costmap_2d REQUIRED)
find_package(pluginlib REQUIRED)
find_package(nav2_dynamic_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(visualization_msgs REQUIRED)
find_package(tf2 REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(tf2_geometry_msgs REQUIRED)

set(dependencies
  rclcpp
  rclcpp_lifecycle
  nav2_costmap_2d
  pluginlib
  nav2_dynamic_msgs
  geometry_msgs
  visualization_msgs
  tf2
  tf2_ros
  tf2_geometry_msgs
)

add_library(${PROJECT_NAME} SHARED
  src/adbscan_layer.cpp
)

target_include_directories(${PROJECT_NAME} PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>
)

ament_target_dependencies(${PROJECT_NAME} ${dependencies})

add_executable(adbscan_obstacle_markers src/adbscan_obstacle_markers.cpp)
ament_target_dependencies(adbscan_obstacle_markers ${dependencies})

pluginlib_export_plugin_description_file(nav2_costmap_2d nav2_adbscan_layer.xml)

install(TARGETS ${PROJECT_NAME}
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)

install(TARGETS adbscan_obstacle_markers
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY include/
  DESTINATION include/
)

install(FILES nav2_adbscan_layer.xml
  DESTINATION share/${PROJECT_NAME}
)

if(BUILD_TESTING)
  find_package(ament_cmake_gtest REQUIRED)
  ament_add_gtest(test_adbscan_layer test/test_adbscan_layer.cpp)
  target_link_libraries(test_adbscan_layer ${PROJECT_NAME})
  ament_target_dependencies(test_adbscan_layer ${dependencies})
endif()

ament_export_include_directories(include)
ament_export_libraries(${PROJECT_NAME})
ament_export_dependencies(${dependencies})

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-nav2-adbscan-layer"
  DESCRIPTION "ADBSCAN obstacle layer for Nav2 costmaps"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
    "ros-${ROS_DISTRO}-rclcpp"
    "ros-${ROS_DISTRO}-rclcpp-lifecycle"
    "ros-${ROS_DISTRO}-nav2-costmap-2d"
    "ros-${ROS_DISTRO}-pluginlib"
    "ros-${ROS_DISTRO}-nav2-dynamic-msgs"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-visualization-msgs"
    "ros-${ROS_DISTRO}-tf2"
    "ros-${ROS_DISTRO}-tf2-ros"
    "ros-${ROS_DISTRO}-tf2-geometry-msgs"
  DEPENDS
    "ros-${ROS_DISTRO}-rclcpp"
    "ros-${ROS_DISTRO}-rclcpp-lifecycle"
    "ros-${ROS_DISTRO}-nav2-costmap-2d"
    "ros-${ROS_DISTRO}-pluginlib"
    "ros-${ROS_DISTRO}-nav2-dynamic-msgs"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-visualization-msgs"
    "ros-${ROS_DISTRO}-tf2"
    "ros-${ROS_DISTRO}-tf2-ros"
    "ros-${ROS_DISTRO}-tf2-geometry-msgs"
)
