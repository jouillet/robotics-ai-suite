# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.16)
project(benchmark_framework NONE)

set(ROS_DISTRO "humble" CACHE STRING "ROS distribution to package")
set(BENCHMARK_PACKAGE_OUTPUT_DIR "${CMAKE_BINARY_DIR}/packages" CACHE PATH "Directory for generated Debian packages")
set(BENCHMARK_PACKAGE_VERSION_SUFFIX "" CACHE STRING "Optional suffix appended to Debian package versions")

set(benchmark_install_dir "benchmarking")

# Python and shell sources under src/ (installed executable)
file(GLOB benchmark_python_sources "${CMAKE_CURRENT_SOURCE_DIR}/src/*.py")
file(GLOB benchmark_shell_sources "${CMAKE_CURRENT_SOURCE_DIR}/src/*.sh")
install(PROGRAMS ${benchmark_python_sources} ${benchmark_shell_sources}
  DESTINATION "${benchmark_install_dir}/src"
)

# Top-level launcher and setup scripts (installed executable)
file(GLOB benchmark_root_scripts "${CMAKE_CURRENT_SOURCE_DIR}/*.sh")
install(PROGRAMS
  "${CMAKE_CURRENT_SOURCE_DIR}/quickstart"
  ${benchmark_root_scripts}
  DESTINATION "${benchmark_install_dir}"
)

# Top-level data files
install(FILES
  "${CMAKE_CURRENT_SOURCE_DIR}/Makefile"
  "${CMAKE_CURRENT_SOURCE_DIR}/docker-compose.yml"
  "${CMAKE_CURRENT_SOURCE_DIR}/pyproject.toml"
  "${CMAKE_CURRENT_SOURCE_DIR}/README.md"
  DESTINATION "${benchmark_install_dir}"
)

# Configuration, dashboards and schemas
install(DIRECTORY
  "${CMAKE_CURRENT_SOURCE_DIR}/prometheus"
  "${CMAKE_CURRENT_SOURCE_DIR}/grafana"
  "${CMAKE_CURRENT_SOURCE_DIR}/schemas"
  "${CMAKE_CURRENT_SOURCE_DIR}/config"
  DESTINATION "${benchmark_install_dir}"
)

set(CPACK_PACKAGE_DIRECTORY "${BENCHMARK_PACKAGE_OUTPUT_DIR}")

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-benchmark-framework"
  DESCRIPTION "ROS2 KPI Monitoring Stack for benchmark analysis and visualization"
  CONTACT "ECI Maintainer <eci.maintainer@intel.com>"
  ARCHITECTURE "all"
  BUILD_DEPENDS
    "cmake"
    "dpkg-dev"
    "file"
  DEPENDS
    "python3"
    "python3-matplotlib"
    "python3-numpy"
    "python3-psutil"
    "python3-yaml"
    "python3-tk"
    "python3-prometheus-client"
    "python3-jsonschema"
    "python3-openpyxl"
)
