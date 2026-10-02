// Copyright (c) 2021 Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

#include <gtest/gtest.h>

#include <filesystem>
#include <string>

#include "mapenginetest.hpp"

TEST(MapEngineFrontierTest, selectsReachableFreeFrontier)
{
  constexpr uint32_t width = 20;
  constexpr uint32_t height = 20;
  auto map = std::make_shared<nav_msgs::msg::OccupancyGrid>();
  map->info.width = width;
  map->info.height = height;
  map->info.resolution = 0.1;
  map->data.assign(width * height, -1);
  for (uint32_t y = 3; y < 17; ++y) {
    for (uint32_t x = 3; x < 17; ++x) {
      map->data[y * width + x] = 0;
    }
  }
  map->data[10 * width + 13] = 20;

  MapEngine mapEngine(true, 0.1);
  mapEngine.mapCallback(map);
  geometry_msgs::msg::PoseStamped pose;
  pose.pose.position.x = 1.05;
  pose.pose.position.y = 1.05;
  ASSERT_TRUE(mapEngine.setRobotPose(pose));

  double x = 0.0;
  double y = 0.0;
  ASSERT_TRUE(mapEngine.getNextGoalCoord(x, y));

  uint32_t targetX = 0;
  uint32_t targetY = 0;
  ASSERT_TRUE(
    nav2_costmap_2d::Costmap2D(width, height, 0.1, 0.0, 0.0).worldToMap(x, y, targetX, targetY));
  EXPECT_EQ(map->data[targetY * width + targetX], 0);
}

TEST_F(MapEngineTest, mapTest)
{
  path fileLocation = __FILE__;
  fileLocation = fileLocation.parent_path().string() + "/inputs/map.log";
  ASSERT_TRUE(testInit(fileLocation.string(), false));
  ASSERT_TRUE(testCoord());
  SUCCEED();
}

TEST_F(MapEngineTest, costmapTest)
{
  path fileLocation = __FILE__;
  fileLocation = fileLocation.parent_path().string() + "/inputs/costmap.log";
  ASSERT_TRUE(testInit(fileLocation.string(), true));
  ASSERT_TRUE(testCoord());
  SUCCEED();
}

TEST_F(MapEngineTest, costmapTestWithReset)
{
  path fileLocation = __FILE__;
  fileLocation = fileLocation.parent_path().string() + "/inputs/costmap.log";
  ASSERT_TRUE(testInit(fileLocation.string(), true));
  ASSERT_TRUE(testCoord());
  resetVisited();
  ASSERT_TRUE(testCoord());
  SUCCEED();
}

int main(int argc, char ** argv)
{
  ::testing::InitGoogleTest(&argc, argv);

  bool all_successful = RUN_ALL_TESTS();

  return all_successful;
}
