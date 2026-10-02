# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

cmake_minimum_required(VERSION 3.16)
project(turtlesim_tutorial)

find_package(ament_cmake REQUIRED)

install(FILES package.xml DESTINATION share/${PROJECT_NAME})
install(FILES resource/${PROJECT_NAME} DESTINATION share/ament_index/resource_index/packages)
install(FILES turtlesim_tutorial/launch/turtlesim_tutorial.launch.py DESTINATION share/${PROJECT_NAME}/launch)

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
	PACKAGE_NAME "ros-${ROS_DISTRO}-turtlesim-tutorial-demo"
	DESCRIPTION "turtlesim is a tool made for teaching ROS and ROS packages - sample application"
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
		"ros-${ROS_DISTRO}-turtlesim"
		"ros-${ROS_DISTRO}-rqt"
		"ros-${ROS_DISTRO}-rqt-common-plugins"
		"ros-${ROS_DISTRO}-rviz2"
)

ament_package()
