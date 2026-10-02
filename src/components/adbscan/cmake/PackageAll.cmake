# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

foreach(required_variable IN ITEMS ROS_DISTRO ADBSCAN_SOURCE_DIR ADBSCAN_BUILD_DIR ADBSCAN_PACKAGE_OUTPUT_DIR ADBSCAN_PACKAGE_COMPONENTS)
  if(NOT DEFINED ${required_variable} OR "${${required_variable}}" STREQUAL "")
    message(FATAL_ERROR "${required_variable} is required")
  endif()
endforeach()

file(MAKE_DIRECTORY "${ADBSCAN_PACKAGE_OUTPUT_DIR}")
string(REPLACE "," ";" ADBSCAN_CMAKE_PACKAGES "${ADBSCAN_PACKAGE_COMPONENTS}")

foreach(package_name IN LISTS ADBSCAN_CMAKE_PACKAGES)
  set(package_source_dir "${ADBSCAN_SOURCE_DIR}/src/${package_name}")
  set(package_build_dir "${ADBSCAN_BUILD_DIR}/${package_name}")
  if(NOT EXISTS "${package_source_dir}/CMakeLists.txt")
    message(FATAL_ERROR "Package source directory not found: ${package_source_dir}")
  endif()

  message(STATUS "Packaging ${package_name}")

  execute_process(
    COMMAND "${CMAKE_COMMAND}" -G Ninja -S "${package_source_dir}" -B "${package_build_dir}"
      -DROS_DISTRO=${ROS_DISTRO}
      -DBUILD_TESTING=OFF
      -DADBSCAN_PACKAGE_VERSION_SUFFIX=${ADBSCAN_PACKAGE_VERSION_SUFFIX}
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND "${CMAKE_COMMAND}" --build "${package_build_dir}" --parallel
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND cpack --config "${package_build_dir}/CPackConfig.cmake" -G DEB -B "${ADBSCAN_PACKAGE_OUTPUT_DIR}"
    COMMAND_ERROR_IS_FATAL ANY
  )
endforeach()
