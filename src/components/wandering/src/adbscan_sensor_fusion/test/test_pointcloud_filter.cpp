// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include <gtest/gtest.h>

#include "adbscan_sensor_fusion/pointcloud_filter.hpp"

namespace adbscan_sensor_fusion
{
namespace
{

pcl::PointCloud<pcl::PointXYZ> makeCloud(std::initializer_list<pcl::PointXYZ> points)
{
  pcl::PointCloud<pcl::PointXYZ> cloud;
  cloud.assign(points.begin(), points.end());
  cloud.width = static_cast<uint32_t>(cloud.size());
  cloud.height = 1;
  return cloud;
}

TEST(PointCloudFilter, FiltersCartesianAndRadialBounds)
{
  PointCloudFilterOptions options;
  options.min_x = 0.5;
  options.max_x = 2.0;
  options.min_y = -0.5;
  options.max_y = 2.0;
  options.min_z = -0.5;
  options.max_z = 0.5;
  options.min_range = 1.0;
  options.max_range = 2.0;
  options.use_voxel_filter = false;

  const auto result = filterPointCloud(
    makeCloud({{1.0F, 1.0F, 0.0F}, {0.25F, 1.0F, 0.0F}, {1.0F, 1.0F, 1.0F}, {0.6F, 0.0F, 0.0F}}),
    options);

  ASSERT_EQ(result.input_count, 4U);
  ASSERT_EQ(result.cropped_count, 1U);
  ASSERT_EQ(result.ground_filtered_count, 1U);
  ASSERT_EQ(result.cloud.size(), 1U);
  EXPECT_FLOAT_EQ(result.cloud.front().x, 1.0F);
  EXPECT_FLOAT_EQ(result.cloud.front().y, 1.0F);
}

TEST(PointCloudFilter, VoxelFilterReducesPointsInTheSameCell)
{
  PointCloudFilterOptions options;
  options.voxel_leaf_size = 1.0;

  const auto result = filterPointCloud(
    makeCloud({{0.1F, 0.1F, 0.1F}, {0.2F, 0.2F, 0.2F}, {1.1F, 1.1F, 1.1F}}), options);

  EXPECT_EQ(result.input_count, 3U);
  EXPECT_EQ(result.cloud.size(), 2U);
}

TEST(PointCloudFilter, RemovesHorizontalGroundPlane)
{
  PointCloudFilterOptions options;
  options.remove_ground = true;
  options.use_voxel_filter = false;

  const auto result = filterPointCloud(
    makeCloud(
      {{-1.0F, -1.0F, 0.0F},
       {-1.0F, 1.0F, 0.0F},
       {1.0F, -1.0F, 0.0F},
       {1.0F, 1.0F, 0.0F},
       {0.0F, 0.0F, 1.0F}}),
    options);

  EXPECT_EQ(result.input_count, 5U);
  ASSERT_EQ(result.cloud.size(), 1U);
  EXPECT_FLOAT_EQ(result.cloud.front().z, 1.0F);
}

TEST(PointCloudFilter, ReturnsEmptyCloudWhenAllPointsAreRejected)
{
  PointCloudFilterOptions options;
  options.min_range = 2.0;
  options.use_voxel_filter = false;

  const auto result = filterPointCloud(makeCloud({{1.0F, 0.0F, 0.0F}}), options);

  EXPECT_EQ(result.input_count, 1U);
  EXPECT_EQ(result.cropped_count, 0U);
  EXPECT_EQ(result.ground_filtered_count, 0U);
  EXPECT_TRUE(result.cloud.empty());
}

}  // namespace
}  // namespace adbscan_sensor_fusion
