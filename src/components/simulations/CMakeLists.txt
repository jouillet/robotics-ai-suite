# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.16)
project(simulations_debian_packages NONE)

set(ROS_DISTRO "jazzy" CACHE STRING "ROS distribution to package")
set(SIMULATIONS_PACKAGE_OUTPUT_DIR "${CMAKE_BINARY_DIR}/packages" CACHE PATH "Directory for generated Debian packages")
set(SIMULATIONS_PACKAGE_COMPONENTS "" CACHE STRING "Comma-separated source directories to package")
set(SIMULATIONS_PACKAGE_VERSION_SUFFIX "" CACHE STRING "Optional suffix appended to Debian package versions")
set(SIMULATIONS_BUILD_DEPENDS_OUTPUT_DIR "${CMAKE_BINARY_DIR}/debian-build-deps" CACHE PATH "Directory for generated Debian build dependency control files")
set(SIMULATIONS_CMAKE_GENERATOR "Ninja" CACHE STRING "CMake generator used when configuring component package builds")

add_custom_target(package
  COMMAND ${CMAKE_COMMAND}
    -DROS_DISTRO=${ROS_DISTRO}
    -DSIMULATIONS_SOURCE_DIR=${CMAKE_SOURCE_DIR}
    -DSIMULATIONS_BUILD_DIR=${CMAKE_BINARY_DIR}
    -DSIMULATIONS_PACKAGE_OUTPUT_DIR=${SIMULATIONS_PACKAGE_OUTPUT_DIR}
    "-DSIMULATIONS_PACKAGE_COMPONENTS=${SIMULATIONS_PACKAGE_COMPONENTS}"
    -DSIMULATIONS_PACKAGE_VERSION_SUFFIX=${SIMULATIONS_PACKAGE_VERSION_SUFFIX}
    "-DSIMULATIONS_CMAKE_GENERATOR=${SIMULATIONS_CMAKE_GENERATOR}"
    -P ${CMAKE_SOURCE_DIR}/cmake/PackageAll.cmake
  USES_TERMINAL
  COMMENT "Building native Debian packages for ${ROS_DISTRO}"
)

add_custom_target(debian-build-deps
  COMMAND ${CMAKE_COMMAND}
    -DROS_DISTRO=${ROS_DISTRO}
    -DSIMULATIONS_SOURCE_DIR=${CMAKE_SOURCE_DIR}
    -DSIMULATIONS_BUILD_DEPENDS_OUTPUT_DIR=${SIMULATIONS_BUILD_DEPENDS_OUTPUT_DIR}
    "-DSIMULATIONS_PACKAGE_COMPONENTS=${SIMULATIONS_PACKAGE_COMPONENTS}"
    -P ${CMAKE_SOURCE_DIR}/cmake/GenerateDebianBuildDepends.cmake
  USES_TERMINAL
  COMMENT "Generating Debian build dependency control files for ${ROS_DISTRO}"
)
