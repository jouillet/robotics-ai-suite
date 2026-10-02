# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation
cmake_minimum_required(VERSION 3.5)
project(rvc)

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclpy REQUIRED)
find_package(rclcpp REQUIRED)
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(builtin_interfaces REQUIRED)
find_package(rosidl_default_generators REQUIRED)

if(BUILD_TESTING)
  find_package(ament_cmake_pytest REQUIRED)
  ament_add_pytest_test(test_launch_structure test/test_launch_structure.py)
  ament_add_pytest_test(test_ur5_config test/test_ur5_config.py)
endif()

include_directories(include)


rosidl_generate_interfaces(${PROJECT_NAME}
  "interface/msg/BoxState.msg"
  DEPENDENCIES
  builtin_interfaces
  std_msgs
  geometry_msgs
)

ament_export_dependencies(
  rosidl_default_runtime
  rclpy
  std_msgs
  geometry_msgs
  builtin_interfaces
)

file(GLOB SCRIPT_FILES "${CMAKE_CURRENT_SOURCE_DIR}/scripts/*.py")
install(PROGRAMS ${SCRIPT_FILES} DESTINATION lib/${PROJECT_NAME})

file(GLOB SCRIPT_FILES "${CMAKE_CURRENT_SOURCE_DIR}/scripts/robots/*.py")
install(PROGRAMS ${SCRIPT_FILES} DESTINATION lib/${PROJECT_NAME}/robots)


install(DIRECTORY launch params urdf worlds rviz DESTINATION share/${PROJECT_NAME})
install(FILES cyclonedds.xml DESTINATION share/${PROJECT_NAME})

ament_environment_hooks("${CMAKE_CURRENT_SOURCE_DIR}/env-hooks/rvc.dsv.in")

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-rvc"
  DESCRIPTION "Single-arm two-conveyor pick-and-place demo built on the shared robot_config simulation framework."
  CONTACT "ECI Maintainer <eci.maintainer@intel.com>"
  BUILD_DEPENDS
    "debhelper (>= 9.0.0)"
    "ros-${ROS_DISTRO}-builtin-interfaces"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-std-msgs"
    "ros-${ROS_DISTRO}-rosidl-default-generators"
  DEPENDS
    "python3-setuptools"
    "ros-${ROS_DISTRO}-ros-gz"
    "ros-${ROS_DISTRO}-ros2-control"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-launch-ros"
    "ros-${ROS_DISTRO}-moveit-msgs"
    "ros-${ROS_DISTRO}-moveit-ros-visualization"
    "ros-${ROS_DISTRO}-rclpy"
    "ros-${ROS_DISTRO}-rmw-cyclonedds-cpp"
    "ros-${ROS_DISTRO}-rosidl-default-runtime"
    "ros-${ROS_DISTRO}-std-srvs"
    "ros-${ROS_DISTRO}-smach"
    "ros-${ROS_DISTRO}-robot-config"
    "ros-${ROS_DISTRO}-robot-config-plugins"
)

ament_package()
