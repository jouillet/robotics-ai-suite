# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

foreach(required_variable IN ITEMS ROS_DISTRO POINTCLOUD_SOURCE_DIR POINTCLOUD_BUILD_DIR POINTCLOUD_PACKAGE_OUTPUT_DIR POINTCLOUD_PACKAGE_COMPONENTS)
  if(NOT DEFINED ${required_variable} OR "${${required_variable}}" STREQUAL "")
    message(FATAL_ERROR "${required_variable} is required")
  endif()
endforeach()

file(MAKE_DIRECTORY "${POINTCLOUD_PACKAGE_OUTPUT_DIR}")
string(REPLACE "," ";" POINTCLOUD_CMAKE_PACKAGES "${POINTCLOUD_PACKAGE_COMPONENTS}")

foreach(package_name IN LISTS POINTCLOUD_CMAKE_PACKAGES)
  set(package_source_dir "${POINTCLOUD_SOURCE_DIR}/src/${package_name}")
  set(package_build_dir "${POINTCLOUD_BUILD_DIR}/${package_name}")
  if(NOT EXISTS "${package_source_dir}/CMakeLists.txt")
    message(FATAL_ERROR "Package source directory not found: ${package_source_dir}")
  endif()

  message(STATUS "Packaging ${package_name}")

  execute_process(
    COMMAND "${CMAKE_COMMAND}" -G Ninja -S "${package_source_dir}" -B "${package_build_dir}"
      -DROS_DISTRO=${ROS_DISTRO}
      -DBUILD_TESTING=OFF
      -DBUILD_TEST=OFF
      -DPOINTCLOUD_PACKAGE_VERSION_SUFFIX=${POINTCLOUD_PACKAGE_VERSION_SUFFIX}
      -DPACKAGE_VERSION_SUFFIX=${POINTCLOUD_PACKAGE_VERSION_SUFFIX}
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND "${CMAKE_COMMAND}" --build "${package_build_dir}" --parallel
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND cpack --config "${package_build_dir}/CPackConfig.cmake" -G DEB -B "${POINTCLOUD_PACKAGE_OUTPUT_DIR}"
    COMMAND_ERROR_IS_FATAL ANY
  )
endforeach()
