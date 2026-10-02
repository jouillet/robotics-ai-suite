# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

cmake_minimum_required(VERSION 3.5)
project(wandering_app)

# Default to C99
if(NOT CMAKE_C_STANDARD)
  set(CMAKE_C_STANDARD 99)
endif()

# Default to C++17
if(NOT CMAKE_CXX_STANDARD)
  set(CMAKE_CXX_STANDARD 17)
endif()

if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  if(NOT FUZZTEST_FUZZING_MODE)
    add_compile_options(-Wall -Wextra -Wpedantic -Werror -fstack-protector-all -Wno-deprecated-declarations)
  endif()
endif()

# find dependencies
find_package(ament_cmake REQUIRED)
find_package(ament_index_cpp REQUIRED)
find_package(rclcpp REQUIRED)
find_package(rclcpp_action REQUIRED)
find_package(std_msgs REQUIRED)
find_package(geometry_msgs REQUIRED)
find_package(nav_msgs REQUIRED)
find_package(nav2_msgs REQUIRED)
find_package(nav2_util REQUIRED)
find_package(nav2_costmap_2d REQUIRED)
find_package(pluginlib REQUIRED)
find_package(rviz_common REQUIRED)
find_package(tf2_ros REQUIRED)
find_package(Qt5 REQUIRED COMPONENTS Widgets)

set(CMAKE_AUTOMOC ON)

include_directories(
  include
  include/wandering_app
)

set(dependencies
  rclcpp
  std_msgs
  nav_msgs
  geometry_msgs
  nav2_msgs
  nav2_util
  nav2_costmap_2d
  rclcpp_components
  tf2_ros
)

add_executable(wandering src/main.cpp src/MapEngine.cpp src/WanderingMapper.cpp src/GoalCatcher.cpp src/utils.cpp)
ament_target_dependencies(wandering ${dependencies})

add_library(wandering_rviz_panel SHARED
  src/wandering_control_panel.cpp
  include/wandering_app/WanderingControlPanel.hpp
)
target_include_directories(wandering_rviz_panel PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include>
)
ament_target_dependencies(wandering_rviz_panel
  pluginlib
  rclcpp
  rviz_common
  std_msgs
)
target_link_libraries(wandering_rviz_panel Qt5::Widgets)

pluginlib_export_plugin_description_file(rviz_common wandering_rviz_plugins.xml)

install(TARGETS
  wandering
  DESTINATION lib/${PROJECT_NAME}
)

install(TARGETS wandering_rviz_panel
  ARCHIVE DESTINATION lib
  LIBRARY DESTINATION lib
  RUNTIME DESTINATION bin
)

install(DIRECTORY include/
  DESTINATION include
)

install(FILES wandering_rviz_plugins.xml
  DESTINATION share/${PROJECT_NAME}
)

install(DIRECTORY
  behavior_trees
  DESTINATION share/${PROJECT_NAME}/
  USE_SOURCE_PERMISSIONS
)

if(BUILD_TESTING)
  find_package(ament_cmake_gtest REQUIRED)
  find_package(launch_testing_ament_cmake REQUIRED)

  add_launch_test(tests/test_invalid_param.py)

  ament_add_gtest(test_mapengine tests/test_mapengine.cpp src/MapEngine.cpp src/utils.cpp TIMEOUT 10)
  ament_target_dependencies(test_mapengine ${dependencies})

  ament_add_gtest(test_goalcatcher tests/test_goalcatcher.cpp src/GoalCatcher.cpp TIMEOUT 15)
  ament_target_dependencies(test_goalcatcher ${dependencies})

  ament_add_gtest(test_inputs tests/test_inputs.cpp src/WanderingMapper.cpp src/GoalCatcher.cpp src/MapEngine.cpp src/utils.cpp TIMEOUT 20)
  ament_target_dependencies(test_inputs ${dependencies})

  ament_add_gtest(test_mapper_cycle
    tests/test_mapper_cycle.cpp src/WanderingMapper.cpp src/GoalCatcher.cpp src/MapEngine.cpp src/utils.cpp)
  ament_target_dependencies(test_mapper_cycle ${dependencies})
endif()

if(FUZZTEST_FUZZING_MODE)
  # Fuzztest requires Clang
  if(NOT CXX MATCHES "clang")
    message(FATAL_ERROR "Please set the CXX option to your Clang installation (e.g. -DCXX=clang++)")
  endif()

  # Use a symlink from the compiled frameworks.industrial.edge-controls.actions.fuzzer version
  add_subdirectory(/fuzztest fuzztest)
  enable_testing()
  include(GoogleTest)

  # Enable fuzzing mode
  fuzztest_setup_fuzzing_flags()

  # Enable coverage: https://clang.llvm.org/docs/SourceBasedCodeCoverage.html
  # Enable sanitizers: https://llvm.org/docs/LibFuzzer.html#fuzzer-usage
  #  - Note: memory and address cannot be used at the same time!
  set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fprofile-instr-generate -fcoverage-mapping -fsanitize=address,signed-integer-overflow -g")

  add_library(wanderingLib src/MapEngine.cpp src/WanderingMapper.cpp src/GoalCatcher.cpp src/utils.cpp)
  ament_target_dependencies(wanderingLib ${dependencies})

  add_executable(
    fuzz_mapengine
    tests/fuzzing/fuzz_mapengine.cpp
  )

  target_link_libraries(
    fuzz_mapengine
    PRIVATE
    wanderingLib
  )
  link_fuzztest(fuzz_mapengine)
endif()

ament_package()

include(${CMAKE_CURRENT_SOURCE_DIR}/../../cmake/RosDebianPackage.cmake)
configure_ros_debian_package_with_metadata(
  PACKAGE_NAME "ros-${ROS_DISTRO}-wandering-app"
  DESCRIPTION "Wandering autonomous exploration application"
  CONTACT "ECI Maintainer <eci-maintainer@intel.com>"
  BUILD_DEPENDS
    "build-essential"
    "ninja-build"
    "ros-${ROS_DISTRO}-ament-cmake"
    "ros-${ROS_DISTRO}-ament-index-cpp"
    "ros-${ROS_DISTRO}-rclcpp"
    "ros-${ROS_DISTRO}-rclcpp-action"
    "ros-${ROS_DISTRO}-std-msgs"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-nav-msgs"
    "ros-${ROS_DISTRO}-nav2-msgs"
    "ros-${ROS_DISTRO}-nav2-util"
    "ros-${ROS_DISTRO}-nav2-costmap-2d"
    "ros-${ROS_DISTRO}-pluginlib"
    "ros-${ROS_DISTRO}-rviz-common"
    "ros-${ROS_DISTRO}-tf2-ros"
    "qtbase5-dev"
  DEPENDS
    "ros-${ROS_DISTRO}-nav2-msgs"
    "ros-${ROS_DISTRO}-nav2-util"
    "ros-${ROS_DISTRO}-geometry-msgs"
    "ros-${ROS_DISTRO}-rclcpp-action"
    "ros-${ROS_DISTRO}-action-msgs"
    "ros-${ROS_DISTRO}-nav2-costmap-2d"
    "ros-${ROS_DISTRO}-ament-index-cpp"
    "ros-${ROS_DISTRO}-pluginlib"
    "ros-${ROS_DISTRO}-rviz-common"
    "ros-${ROS_DISTRO}-rmw-cyclonedds-cpp"
    "ros-${ROS_DISTRO}-tf2-ros"
)
