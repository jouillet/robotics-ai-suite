# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.8)
project(adbscan_sensor_fusion)

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
find_package(sensor_msgs REQUIRED)
find_package(laser_geometry REQUIRED)
find_package(message_filters REQUIRED)
find_package(tf2 REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(tf2_sensor_msgs REQUIRED)
find_package(pcl_conversions REQUIRED)
find_package(PCL REQUIRED COMPONENTS common filters segmentation)

set(dependencies
  rclcpp
  sensor_msgs
  laser_geometry
  message_filters
  tf2
  tf2_ros
  tf2_sensor_msgs
  pcl_conversions
)

add_library(pointcloud_filter src/pointcloud_filter.cpp)
target_include_directories(pointcloud_filter PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>
  ${PCL_INCLUDE_DIRS}
)
target_link_libraries(pointcloud_filter PUBLIC ${PCL_LIBRARIES})

add_executable(pointcloud_fusion_node src/pointcloud_fusion_node.cpp)
target_include_directories(pointcloud_fusion_node PRIVATE ${PCL_INCLUDE_DIRS})
target_link_libraries(pointcloud_fusion_node pointcloud_filter ${PCL_LIBRARIES})
ament_target_dependencies(pointcloud_fusion_node ${dependencies})

install(TARGETS pointcloud_filter
  EXPORT export_${PROJECT_NAME}
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)

install(TARGETS pointcloud_fusion_node
  DESTINATION lib/${PROJECT_NAME}
)

install(DIRECTORY include/
  DESTINATION include
)

install(DIRECTORY launch config
  DESTINATION share/${PROJECT_NAME}
  OPTIONAL
)

if(BUILD_TESTING)
  find_package(ament_cmake_gtest REQUIRED)
  find_package(launch_testing_ament_cmake REQUIRED)
  ament_add_gtest(test_pointcloud_filter test/test_pointcloud_filter.cpp)
  target_link_libraries(test_pointcloud_filter pointcloud_filter)
  add_launch_test(test/test_pointcloud_fusion_launch.py TIMEOUT 60)
  add_launch_test(test/test_pointcloud_fusion_cloud_launch.py TIMEOUT 60)
  add_launch_test(test/test_pointcloud_fusion_dual_launch.py TIMEOUT 60)
  add_launch_test(test/test_pointcloud_fusion_missing_tf_launch.py TIMEOUT 60)
  add_launch_test(test/test_pointcloud_fusion_skew_launch.py TIMEOUT 60)
  add_launch_test(test/test_pointcloud_fusion_missing_stream_launch.py TIMEOUT 60)
endif()

ament_export_include_directories(include)
ament_export_targets(export_${PROJECT_NAME} HAS_LIBRARY_TARGET)
ament_export_dependencies(PCL)

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-adbscan-sensor-fusion"
  DESCRIPTION "ADBSCAN LiDAR and depth camera point cloud fusion"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
    "ros-${ROS_DISTRO}-rclcpp"
    "ros-${ROS_DISTRO}-sensor-msgs"
    "ros-${ROS_DISTRO}-laser-geometry"
    "ros-${ROS_DISTRO}-message-filters"
    "ros-${ROS_DISTRO}-tf2"
    "ros-${ROS_DISTRO}-tf2-ros"
    "ros-${ROS_DISTRO}-tf2-sensor-msgs"
    "ros-${ROS_DISTRO}-pcl-conversions"
    "libpcl-dev"
  DEPENDS
    "ros-${ROS_DISTRO}-rclcpp"
    "ros-${ROS_DISTRO}-sensor-msgs"
    "ros-${ROS_DISTRO}-laser-geometry"
    "ros-${ROS_DISTRO}-message-filters"
    "ros-${ROS_DISTRO}-tf2"
    "ros-${ROS_DISTRO}-tf2-ros"
    "ros-${ROS_DISTRO}-tf2-sensor-msgs"
    "ros-${ROS_DISTRO}-pcl-conversions"
)
