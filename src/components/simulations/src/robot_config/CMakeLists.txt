# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2025 Intel Corporation
cmake_minimum_required(VERSION 3.5)
project(robot_config)

# Find dependencies
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclpy REQUIRED)

# Message dependencies
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(builtin_interfaces REQUIRED)

# URDF processing
find_package(xacro REQUIRED)

include_directories(include)

# Install Python package
ament_python_install_package(${PROJECT_NAME} PACKAGE_DIR scripts)

# Install Python scripts
file(GLOB SCRIPT_FILES "${CMAKE_CURRENT_SOURCE_DIR}/scripts/*.py")
install(PROGRAMS ${SCRIPT_FILES} DESTINATION lib/${PROJECT_NAME})

# Install directories
install(DIRECTORY 
  launch 
  config 
  urdf 
  worlds 
  models 
  rviz 
  params 
  maps 
  DESTINATION share/${PROJECT_NAME}
)

# Environment hooks - distribution specific
if($ENV{ROS_DISTRO} STREQUAL "humble")
  ament_environment_hooks("${CMAKE_CURRENT_SOURCE_DIR}/humble/robot_config.dsv.in")
elseif($ENV{ROS_DISTRO} STREQUAL "jazzy")
  ament_environment_hooks("${CMAKE_CURRENT_SOURCE_DIR}/jazzy/robot_config.dsv.in")
else()
  # Default fallback - use GZ_SIM_RESOURCE_PATH for newer distributions
  ament_environment_hooks("${CMAKE_CURRENT_SOURCE_DIR}/env-hooks/robot_config.dsv.in")
endif()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-robot-config"
  DESCRIPTION "This package demonstrates spawning multiple robotic arms in Gazebo simulation environment separated by their own namespace"
  CONTACT "ECI Maintainer <eci.maintainer@intel.com>"
  BUILD_DEPENDS
    "debhelper (>= 9.0.0)"
    "ros-${ROS_DISTRO}-ament-lint-auto <!nocheck>"
    "ros-${ROS_DISTRO}-ament-lint-common <!nocheck>"
    "ros-${ROS_DISTRO}-builtin-interfaces"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-moveit-core"
    "ros-${ROS_DISTRO}-std-msgs"
    "ros-${ROS_DISTRO}-xacro"
    "ros-${ROS_DISTRO}-ros-gz"
  DEPENDS
    "python3-setuptools"
    "ros-${ROS_DISTRO}-action-msgs"
    "ros-${ROS_DISTRO}-control-msgs"
    "ros-${ROS_DISTRO}-controller-interface"
    "ros-${ROS_DISTRO}-controller-manager"
    "ros-${ROS_DISTRO}-controller-manager-msgs"
    "ros-${ROS_DISTRO}-ros-gz"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-hardware-interface"
    "ros-${ROS_DISTRO}-joint-state-broadcaster"
    "ros-${ROS_DISTRO}-joint-trajectory-controller"
    "ros-${ROS_DISTRO}-launch-ros"
    "ros-${ROS_DISTRO}-moveit-core"
    "ros-${ROS_DISTRO}-moveit-msgs"
    "ros-${ROS_DISTRO}-moveit-planners-ompl"
    "ros-${ROS_DISTRO}-moveit-ros-move-group"
    "ros-${ROS_DISTRO}-moveit-simple-controller-manager"
    "ros-${ROS_DISTRO}-nav2-common"
    "ros-${ROS_DISTRO}-nav2-controller"
    "ros-${ROS_DISTRO}-navigation2"
    "ros-${ROS_DISTRO}-rclpy"
    "ros-${ROS_DISTRO}-robot-state-publisher"
    "ros-${ROS_DISTRO}-ros2controlcli"
    "ros-${ROS_DISTRO}-rosidl-default-runtime"
    "ros-${ROS_DISTRO}-slam-toolbox"
    "ros-${ROS_DISTRO}-std-srvs"
    "ros-${ROS_DISTRO}-trajectory-msgs"
    "ros-${ROS_DISTRO}-xacro"
)

ament_package()
