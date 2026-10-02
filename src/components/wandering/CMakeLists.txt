# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.16)
project(wandering_debian_packages NONE)

set(ROS_DISTRO "jazzy" CACHE STRING "ROS distribution to package")
set(WANDERING_PACKAGE_OUTPUT_DIR "${CMAKE_BINARY_DIR}/packages" CACHE PATH "Directory for generated Debian packages")
set(WANDERING_PACKAGE_COMPONENTS "" CACHE STRING "Semicolon-separated source directories to package")
set(WANDERING_PACKAGE_VERSION_SUFFIX "" CACHE STRING "Optional suffix appended to Debian package versions")
set(WANDERING_BUILD_DEPENDS_OUTPUT_DIR "${CMAKE_BINARY_DIR}/debian-build-deps" CACHE PATH "Directory for generated Debian build dependency control files")

add_custom_target(package
  COMMAND ${CMAKE_COMMAND}
    -DROS_DISTRO=${ROS_DISTRO}
    -DWANDERING_SOURCE_DIR=${CMAKE_SOURCE_DIR}
    -DWANDERING_BUILD_DIR=${CMAKE_BINARY_DIR}
    -DWANDERING_PACKAGE_OUTPUT_DIR=${WANDERING_PACKAGE_OUTPUT_DIR}
    "-DWANDERING_PACKAGE_COMPONENTS=${WANDERING_PACKAGE_COMPONENTS}"
    -DWANDERING_PACKAGE_VERSION_SUFFIX=${WANDERING_PACKAGE_VERSION_SUFFIX}
    -P ${CMAKE_SOURCE_DIR}/cmake/PackageAll.cmake
  USES_TERMINAL
  COMMENT "Building native Debian packages for ${ROS_DISTRO}"
)

add_custom_target(debian-build-deps
  COMMAND ${CMAKE_COMMAND}
    -DROS_DISTRO=${ROS_DISTRO}
    -DWANDERING_SOURCE_DIR=${CMAKE_SOURCE_DIR}
    -DWANDERING_BUILD_DEPENDS_OUTPUT_DIR=${WANDERING_BUILD_DEPENDS_OUTPUT_DIR}
    "-DWANDERING_PACKAGE_COMPONENTS=${WANDERING_PACKAGE_COMPONENTS}"
    -P ${CMAKE_SOURCE_DIR}/cmake/GenerateDebianBuildDepends.cmake
  USES_TERMINAL
  COMMENT "Generating Debian build dependency control files for ${ROS_DISTRO}"
)