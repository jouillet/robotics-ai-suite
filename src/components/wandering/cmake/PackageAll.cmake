# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

foreach(required_variable IN ITEMS ROS_DISTRO WANDERING_SOURCE_DIR WANDERING_BUILD_DIR WANDERING_PACKAGE_OUTPUT_DIR WANDERING_PACKAGE_COMPONENTS)
  if(NOT DEFINED ${required_variable} OR "${${required_variable}}" STREQUAL "")
    message(FATAL_ERROR "${required_variable} is required")
  endif()
endforeach()

file(MAKE_DIRECTORY "${WANDERING_PACKAGE_OUTPUT_DIR}")
string(REPLACE "," ";" WANDERING_CMAKE_PACKAGES "${WANDERING_PACKAGE_COMPONENTS}")

foreach(package_name IN LISTS WANDERING_CMAKE_PACKAGES)
  set(package_source_dir "${WANDERING_SOURCE_DIR}/src/${package_name}")
  set(package_build_dir "${WANDERING_BUILD_DIR}/${package_name}")
  if(NOT EXISTS "${package_source_dir}/CMakeLists.txt")
    message(FATAL_ERROR "Package source directory not found: ${package_source_dir}")
  endif()

  message(STATUS "Packaging ${package_name}")

  execute_process(
    COMMAND "${CMAKE_COMMAND}" -G Ninja -S "${package_source_dir}" -B "${package_build_dir}"
      -DROS_DISTRO=${ROS_DISTRO}
      -DBUILD_TESTING=OFF
      -DWANDERING_PACKAGE_VERSION_SUFFIX=${WANDERING_PACKAGE_VERSION_SUFFIX}
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND "${CMAKE_COMMAND}" --build "${package_build_dir}" --parallel
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND cpack --config "${package_build_dir}/CPackConfig.cmake" -G DEB -B "${WANDERING_PACKAGE_OUTPUT_DIR}"
    COMMAND_ERROR_IS_FATAL ANY
  )
endforeach()