# SPDX-License-Identifier: Apache-2.0
# Copyright (C) 2026 Intel Corporation

cmake_minimum_required(VERSION 3.16)
project(rvc_simulation NONE)

install(FILES README.md DESTINATION share/${PROJECT_NAME})

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
	PACKAGE_NAME "ros-${ROS_DISTRO}-rvc-simulation"
	DESCRIPTION "Meta package for RVC (single-arm two-belt) pick and place simulation deb files"
	CONTACT "ECI Maintainer <eci.maintainer@intel.com>"
	BUILD_DEPENDS
		"debhelper-compat (= 13)"
	DEPENDS
		"ros-${ROS_DISTRO}-robot-config"
		"ros-${ROS_DISTRO}-robot-config-plugins"
		"ros-${ROS_DISTRO}-rvc"
)
