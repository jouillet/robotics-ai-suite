# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

foreach(required_variable IN ITEMS ROS_DISTRO COLLAB_SLAM_SOURCE_DIR COLLAB_SLAM_BUILD_DIR COLLAB_SLAM_PACKAGE_OUTPUT_DIR COLLAB_SLAM_PACKAGE_COMPONENTS)
  if(NOT DEFINED ${required_variable} OR "${${required_variable}}" STREQUAL "")
    message(FATAL_ERROR "${required_variable} is required")
  endif()
endforeach()

file(MAKE_DIRECTORY "${COLLAB_SLAM_PACKAGE_OUTPUT_DIR}")
set(staging_dir "${COLLAB_SLAM_BUILD_DIR}/staging")
file(MAKE_DIRECTORY "${staging_dir}")
string(REPLACE "," ";" COLLAB_SLAM_CMAKE_PACKAGES "${COLLAB_SLAM_PACKAGE_COMPONENTS}")

foreach(package_name IN LISTS COLLAB_SLAM_CMAKE_PACKAGES)
  set(package_source_dir "${COLLAB_SLAM_SOURCE_DIR}/src/${package_name}")
  set(package_build_dir "${COLLAB_SLAM_BUILD_DIR}/${package_name}")
  if(NOT EXISTS "${package_source_dir}/CMakeLists.txt")
    message(FATAL_ERROR "Package source directory not found: ${package_source_dir}")
  endif()

  message(STATUS "Packaging ${package_name}")

  execute_process(
    COMMAND "${CMAKE_COMMAND}" -G Ninja -S "${package_source_dir}" -B "${package_build_dir}"
      -DROS_DISTRO=${ROS_DISTRO}
      -DBUILD_TESTING=OFF
      -DCMAKE_INSTALL_PREFIX=${staging_dir}
      "-DCMAKE_PREFIX_PATH=${staging_dir};/opt/ros/${ROS_DISTRO}"
      -DCOLLAB_SLAM_PACKAGE_VERSION_SUFFIX=${COLLAB_SLAM_PACKAGE_VERSION_SUFFIX}
      -DPACKAGE_VERSION_SUFFIX=${COLLAB_SLAM_PACKAGE_VERSION_SUFFIX}
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND "${CMAKE_COMMAND}" --build "${package_build_dir}" --parallel
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND "${CMAKE_COMMAND}" --install "${package_build_dir}" --prefix "${staging_dir}"
    COMMAND_ERROR_IS_FATAL ANY
  )
  execute_process(
    COMMAND cpack --config "${package_build_dir}/CPackConfig.cmake" -G DEB -B "${COLLAB_SLAM_PACKAGE_OUTPUT_DIR}"
    COMMAND_ERROR_IS_FATAL ANY
  )
endforeach()
