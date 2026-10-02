# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

foreach(required_variable IN ITEMS ROS_DISTRO SIMULATIONS_SOURCE_DIR SIMULATIONS_BUILD_DEPENDS_OUTPUT_DIR SIMULATIONS_PACKAGE_COMPONENTS)
  if(NOT DEFINED ${required_variable} OR "${${required_variable}}" STREQUAL "")
    message(FATAL_ERROR "${required_variable} is required")
  endif()
endforeach()

file(MAKE_DIRECTORY "${SIMULATIONS_BUILD_DEPENDS_OUTPUT_DIR}")
string(REPLACE "," ";" SIMULATIONS_CMAKE_PACKAGES "${SIMULATIONS_PACKAGE_COMPONENTS}")

function(read_debian_build_dependencies cmake_file output_variable)
  if(NOT EXISTS "${cmake_file}")
    message(FATAL_ERROR "Package CMakeLists.txt not found: ${cmake_file}")
  endif()

  file(STRINGS "${cmake_file}" cmake_lines)
  set(build_dependencies "")
  set(in_package_metadata FALSE)
  set(dependency_type "")
  foreach(cmake_line IN LISTS cmake_lines)
    string(STRIP "${cmake_line}" cmake_line_stripped)
    if(NOT in_package_metadata)
      if(cmake_line_stripped MATCHES "^configure_ros_debian_package_with_metadata\\(")
        set(in_package_metadata TRUE)
      endif()
    elseif(cmake_line_stripped MATCHES "^\\)$")
      set(in_package_metadata FALSE)
      set(dependency_type "")
    elseif(cmake_line_stripped MATCHES "^BUILD_DEPENDS$")
      set(dependency_type "BUILD_DEPENDS")
    elseif(cmake_line_stripped MATCHES "^[A-Z_]+$")
      set(dependency_type "")
    elseif(dependency_type STREQUAL "BUILD_DEPENDS" AND cmake_line_stripped MATCHES "^\"([^\"]+)\"$")
      list(APPEND build_dependencies "${CMAKE_MATCH_1}")
    endif()
  endforeach()

  if(in_package_metadata OR build_dependencies STREQUAL "")
    message(FATAL_ERROR "Debian build dependencies are missing or incomplete in ${cmake_file}")
  endif()

  set(${output_variable} "${build_dependencies}" PARENT_SCOPE)
endfunction()

foreach(component IN LISTS SIMULATIONS_CMAKE_PACKAGES)
  set(package_cmake_file "${SIMULATIONS_SOURCE_DIR}/src/${component}/CMakeLists.txt")
  read_debian_build_dependencies("${package_cmake_file}" build_dependencies)

  list(REMOVE_DUPLICATES build_dependencies)
  string(REPLACE "\${ROS_DISTRO}" "${ROS_DISTRO}" build_dependencies "${build_dependencies}")
  string(JOIN ", " build_dependencies_line ${build_dependencies})

  set(control_directory "${SIMULATIONS_BUILD_DEPENDS_OUTPUT_DIR}/${component}/debian")
  string(REPLACE "_" "-" debian_component_name "${component}")
  file(MAKE_DIRECTORY "${control_directory}")
  file(WRITE "${control_directory}/control"
    "Source: simulations-${debian_component_name}-build-deps\n"
    "Section: misc\n"
    "Priority: optional\n"
    "Maintainer: ECI Maintainer <eci.maintainer@intel.com>\n"
    "Standards-Version: 4.7.0\n"
    "Build-Depends: ${build_dependencies_line}\n"
    "\n"
    "Package: simulations-${debian_component_name}-build-deps\n"
    "Architecture: all\n"
    "Description: Build dependencies for simulations ${component}\n"
  )
  message(STATUS "Generated ${control_directory}/control")
endforeach()
