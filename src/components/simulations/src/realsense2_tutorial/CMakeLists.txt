# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

cmake_minimum_required(VERSION 3.16)
project(realsense2_tutorial)

find_package(ament_cmake REQUIRED)

install(FILES package.xml DESTINATION share/${PROJECT_NAME})
install(FILES resource/${PROJECT_NAME} DESTINATION share/ament_index/resource_index/packages)
install(PROGRAMS scripts/find_cameras.sh DESTINATION lib/${PROJECT_NAME})
install(DIRECTORY realsense2_tutorial/launch DESTINATION share/${PROJECT_NAME})
install(DIRECTORY realsense2_tutorial/config DESTINATION share/${PROJECT_NAME})

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
	PACKAGE_NAME "ros-${ROS_DISTRO}-realsense2-tutorial-demo"
	DESCRIPTION "Intel RealSense tutorial with sample application"
	CONTACT "ECI Maintainer <eci.maintainer@intel.com>"
	BUILD_DEPENDS
		"debhelper (>= 9.0.0)"
		"python3-pytest <!nocheck>"
		"ros-${ROS_DISTRO}-ament-copyright <!nocheck>"
		"ros-${ROS_DISTRO}-ament-flake8 <!nocheck>"
		"ros-${ROS_DISTRO}-ament-pep257 <!nocheck>"
		"python3-all"
		"python3-setuptools"
		"dh-python"
	DEPENDS
		"ros-${ROS_DISTRO}-librealsense2"
		"ros-${ROS_DISTRO}-realsense2-camera"
		"ros-${ROS_DISTRO}-realsense2-camera-msgs"
		"ros-${ROS_DISTRO}-rviz2"
)

ament_package()
