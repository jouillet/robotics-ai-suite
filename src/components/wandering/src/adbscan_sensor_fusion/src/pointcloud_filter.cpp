// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include "adbscan_sensor_fusion/pointcloud_filter.hpp"

#include <algorithm>
#include <cmath>
#include <memory>

#include "pcl/filters/crop_box.h"
#include "pcl/filters/extract_indices.h"
#include "pcl/filters/passthrough.h"
#include "pcl/filters/voxel_grid.h"
#include "pcl/segmentation/sac_segmentation.h"

namespace adbscan_sensor_fusion
{

PointCloudFilterResult filterPointCloud(
  pcl::PointCloud<pcl::PointXYZ> cloud, const PointCloudFilterOptions & options)
{
  PointCloudFilterResult result;
  result.input_count = cloud.size();

  const bool crop_xy = options.min_x > -std::numeric_limits<double>::infinity() ||
                       options.max_x < std::numeric_limits<double>::infinity() ||
                       options.min_y > -std::numeric_limits<double>::infinity() ||
                       options.max_y < std::numeric_limits<double>::infinity();
  const bool crop_z = options.min_z > -std::numeric_limits<double>::infinity() ||
                      options.max_z < std::numeric_limits<double>::infinity();
  if (crop_xy) {
    pcl::CropBox<pcl::PointXYZ> xy_filter;
    xy_filter.setInputCloud(std::make_shared<pcl::PointCloud<pcl::PointXYZ>>(std::move(cloud)));
    xy_filter.setMin(
      Eigen::Vector4f(
        static_cast<float>(options.min_x), static_cast<float>(options.min_y),
        -std::numeric_limits<float>::infinity(), 1.0F));
    xy_filter.setMax(
      Eigen::Vector4f(
        static_cast<float>(options.max_x), static_cast<float>(options.max_y),
        std::numeric_limits<float>::infinity(), 1.0F));
    xy_filter.filter(cloud);
  }
  if (
    (options.min_range > 0.0 || options.max_range < std::numeric_limits<double>::infinity()) &&
    !cloud.empty()) {
    cloud.erase(
      std::remove_if(
        cloud.begin(), cloud.end(),
        [&options](const pcl::PointXYZ & point) {
          const double range = std::hypot(point.x, point.y);
          return range < options.min_range || range > options.max_range;
        }),
      cloud.end());
    cloud.width = static_cast<uint32_t>(cloud.size());
    cloud.height = 1;
    cloud.is_dense = true;
  }
  if (crop_z && !cloud.empty()) {
    pcl::PassThrough<pcl::PointXYZ> z_filter;
    z_filter.setInputCloud(std::make_shared<pcl::PointCloud<pcl::PointXYZ>>(std::move(cloud)));
    z_filter.setFilterFieldName("z");
    z_filter.setFilterLimits(static_cast<float>(options.min_z), static_cast<float>(options.max_z));
    z_filter.filter(cloud);
  }
  result.cropped_count = cloud.size();

  if (options.remove_ground && !cloud.empty()) {
    auto input = std::make_shared<pcl::PointCloud<pcl::PointXYZ>>(std::move(cloud));
    pcl::SACSegmentation<pcl::PointXYZ> segmenter;
    segmenter.setOptimizeCoefficients(true);
    segmenter.setModelType(pcl::SACMODEL_PERPENDICULAR_PLANE);
    segmenter.setMethodType(pcl::SAC_RANSAC);
    segmenter.setMaxIterations(100);
    segmenter.setDistanceThreshold(options.ground_distance_threshold);
    segmenter.setAxis(Eigen::Vector3f::UnitZ());
    segmenter.setEpsAngle(static_cast<float>(options.ground_max_tilt_degrees * M_PI / 180.0));
    segmenter.setInputCloud(input);

    pcl::PointIndices::Ptr ground_indices = std::make_shared<pcl::PointIndices>();
    pcl::ModelCoefficients coefficients;
    segmenter.segment(*ground_indices, coefficients);
    if (!ground_indices->indices.empty()) {
      pcl::ExtractIndices<pcl::PointXYZ> extractor;
      extractor.setInputCloud(input);
      extractor.setIndices(ground_indices);
      extractor.setNegative(true);
      extractor.filter(cloud);
    } else {
      cloud = std::move(*input);
    }
  }
  result.ground_filtered_count = cloud.size();

  if (options.use_voxel_filter && options.voxel_leaf_size > 0.0 && !cloud.empty()) {
    auto input = std::make_shared<pcl::PointCloud<pcl::PointXYZ>>(std::move(cloud));
    pcl::VoxelGrid<pcl::PointXYZ> voxel_filter;
    const float leaf_size = static_cast<float>(options.voxel_leaf_size);
    voxel_filter.setInputCloud(input);
    voxel_filter.setLeafSize(leaf_size, leaf_size, leaf_size);
    voxel_filter.filter(result.cloud);
  } else {
    result.cloud = std::move(cloud);
  }

  return result;
}

}  // namespace adbscan_sensor_fusion
