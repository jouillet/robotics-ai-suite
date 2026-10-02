// SPDX-License-Identifier: Apache-2.0
/*
Copyright (C) 2026 Intel Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions
and limitations under the License.
*/

// Point cloud fusion node.
//
// Subscribes to a 2D LiDAR scan and a depth-camera point cloud, transforms both
// into a common target frame, concatenates them and (optionally) voxel-grid
// downsamples the result. The 2D scan is projected into 3D at its physical
// mount height (implicit in the TF tree), so the fused cloud preserves the
// LiDAR's 360-degree perimeter coverage while adding the camera's height-aware
// points. The fused cloud is published for consumption by the ADBSCAN node in
// PointCloud2 ("3D") mode.

#include <cmath>
#include <limits>
#include <memory>
#include <string>

#include "adbscan_sensor_fusion/pointcloud_filter.hpp"
#include "laser_geometry/laser_geometry.hpp"
#include "message_filters/subscriber.h"
#include "message_filters/sync_policies/approximate_time.h"
#include "message_filters/synchronizer.h"
#include "pcl/common/common.h"
#include "pcl/point_cloud.h"
#include "pcl/point_types.h"
#include "pcl_conversions/pcl_conversions.h"
#include "rclcpp/rclcpp.hpp"
#include "sensor_msgs/msg/laser_scan.hpp"
#include "sensor_msgs/msg/point_cloud2.hpp"
#include "tf2_ros/buffer.h"
#include "tf2_ros/transform_listener.h"
#include "tf2_sensor_msgs/tf2_sensor_msgs.hpp"

namespace adbscan_sensor_fusion
{

using sensor_msgs::msg::LaserScan;
using sensor_msgs::msg::PointCloud2;

class PointCloudFusionNode : public rclcpp::Node
{
public:
  PointCloudFusionNode() : rclcpp::Node("adbscan_pointcloud_fusion")
  {
    target_frame_ = declare_parameter<std::string>("target_frame", "base_link");
    scan_topic_ = declare_parameter<std::string>("scan_topic", "scan");
    cloud_topic_ = declare_parameter<std::string>("cloud_topic", "camera/depth/color/points");
    output_topic_ = declare_parameter<std::string>("output_topic", "adbscan/points");
    scan_range_cutoff_ = declare_parameter<double>("scan_range_cutoff", -1.0);
    min_x_ = declare_parameter<double>("min_x", -std::numeric_limits<double>::infinity());
    max_x_ = declare_parameter<double>("max_x", std::numeric_limits<double>::infinity());
    min_y_ = declare_parameter<double>("min_y", -std::numeric_limits<double>::infinity());
    max_y_ = declare_parameter<double>("max_y", std::numeric_limits<double>::infinity());
    min_z_ = declare_parameter<double>("min_z", -std::numeric_limits<double>::infinity());
    max_z_ = declare_parameter<double>("max_z", std::numeric_limits<double>::infinity());
    min_range_ = declare_parameter<double>("min_range", 0.0);
    max_range_ = declare_parameter<double>("max_range", std::numeric_limits<double>::infinity());
    remove_ground_ = declare_parameter<bool>("remove_ground", false);
    ground_distance_threshold_ = declare_parameter<double>("ground_distance_threshold", 0.08);
    ground_max_tilt_degrees_ = declare_parameter<double>("ground_max_tilt_degrees", 12.0);
    voxel_leaf_size_ = declare_parameter<double>("voxel_leaf_size", 0.03);
    use_voxel_filter_ = declare_parameter<bool>("use_voxel_filter", true);
    sync_queue_size_ = declare_parameter<int>("sync_queue_size", 10);
    sync_max_interval_ = declare_parameter<double>("sync_max_interval", 0.1);
    transform_timeout_ = declare_parameter<double>("transform_timeout", 0.1);
    fuse_scan_ = declare_parameter<bool>("fuse_scan", true);
    fuse_cloud_ = declare_parameter<bool>("fuse_cloud", true);

    tf_buffer_ = std::make_shared<tf2_ros::Buffer>(get_clock());
    tf_listener_ = std::make_shared<tf2_ros::TransformListener>(*tf_buffer_);

    pub_ = create_publisher<PointCloud2>(output_topic_, rclcpp::SensorDataQoS());

    // Select the subscription topology from the fusion flags. When both sensors
    // are fused we time-synchronize them; when only one is enabled we subscribe
    // to that sensor alone so the node still publishes if the other sensor is
    // absent (e.g. a simulated robot with no depth camera and fuse_cloud=false).
    if (fuse_scan_ && fuse_cloud_) {
      const rmw_qos_profile_t qos = rclcpp::SensorDataQoS().get_rmw_qos_profile();
      scan_sub_.subscribe(this, scan_topic_, qos);
      cloud_sub_.subscribe(this, cloud_topic_, qos);

      sync_ = std::make_shared<Synchronizer>(
        SyncPolicy(static_cast<uint32_t>(sync_queue_size_)), scan_sub_, cloud_sub_);
      sync_->setMaxIntervalDuration(rclcpp::Duration::from_seconds(sync_max_interval_));
      sync_->registerCallback(
        std::bind(
          &PointCloudFusionNode::syncCallback, this, std::placeholders::_1, std::placeholders::_2));
    } else if (fuse_scan_) {
      scan_only_sub_ = create_subscription<LaserScan>(
        scan_topic_, rclcpp::SensorDataQoS(),
        [this](const LaserScan::ConstSharedPtr msg) { buildAndPublish(msg, nullptr); });
    } else if (fuse_cloud_) {
      cloud_only_sub_ = create_subscription<PointCloud2>(
        cloud_topic_, rclcpp::SensorDataQoS(),
        [this](const PointCloud2::ConstSharedPtr msg) { buildAndPublish(nullptr, msg); });
    } else {
      RCLCPP_ERROR(
        get_logger(),
        "Both fuse_scan and fuse_cloud are false; the fusion node has nothing to publish.");
    }

    RCLCPP_INFO(
      get_logger(),
      "adbscan_pointcloud_fusion: scan='%s'%s cloud='%s'%s -> '%s' (target_frame='%s')",
      scan_topic_.c_str(), fuse_scan_ ? "" : " (disabled)", cloud_topic_.c_str(),
      fuse_cloud_ ? "" : " (disabled)", output_topic_.c_str(), target_frame_.c_str());
  }

private:
  using SyncPolicy = message_filters::sync_policies::ApproximateTime<LaserScan, PointCloud2>;
  using Synchronizer = message_filters::Synchronizer<SyncPolicy>;

  bool transformCloud(const PointCloud2 & in, PointCloud2 & out)
  {
    if (in.header.frame_id == target_frame_) {
      out = in;
      return true;
    }
    try {
      auto tf = tf_buffer_->lookupTransform(
        target_frame_, in.header.frame_id, in.header.stamp,
        tf2::durationFromSec(transform_timeout_));
      tf2::doTransform(in, out, tf);
      return true;
    } catch (const tf2::TransformException & ex) {
      RCLCPP_WARN_THROTTLE(
        get_logger(), *get_clock(), 2000, "Failed to transform cloud %s -> %s: %s",
        in.header.frame_id.c_str(), target_frame_.c_str(), ex.what());
      return false;
    }
  }

  void syncCallback(
    const LaserScan::ConstSharedPtr & scan, const PointCloud2::ConstSharedPtr & cloud)
  {
    buildAndPublish(scan, cloud);
  }

  // Build the fused cloud from whichever inputs are available/enabled and
  // publish it. Either argument may be null when only one sensor is in use.
  void buildAndPublish(
    const LaserScan::ConstSharedPtr & scan, const PointCloud2::ConstSharedPtr & cloud)
  {
    pcl::PointCloud<pcl::PointXYZ> fused;

    // 1) Lift the 2D scan into 3D directly in the target frame (uses TF, so the
    //    physical mount height and orientation are honoured).
    if (fuse_scan_ && scan) {
      PointCloud2 scan_cloud;
      try {
        projector_.transformLaserScanToPointCloud(
          target_frame_, *scan, scan_cloud, *tf_buffer_, scan_range_cutoff_,
          laser_geometry::channel_option::None);
        pcl::PointCloud<pcl::PointXYZ> pcl_scan;
        pcl::fromROSMsg(scan_cloud, pcl_scan);
        fused += pcl_scan;
      } catch (const tf2::TransformException & ex) {
        RCLCPP_WARN_THROTTLE(
          get_logger(), *get_clock(), 2000, "Failed to project laser scan into %s: %s",
          target_frame_.c_str(), ex.what());
      }
    }

    // 2) Transform the depth-camera cloud into the target frame and append.
    if (fuse_cloud_ && cloud) {
      PointCloud2 tf_cloud;
      if (transformCloud(*cloud, tf_cloud)) {
        pcl::PointCloud<pcl::PointXYZ> pcl_cam;
        pcl::fromROSMsg(tf_cloud, pcl_cam);
        fused += pcl_cam;
      }
    }

    if (fused.empty()) {
      return;
    }

    PointCloudFilterOptions filter_options;
    filter_options.min_x = min_x_;
    filter_options.max_x = max_x_;
    filter_options.min_y = min_y_;
    filter_options.max_y = max_y_;
    filter_options.min_z = min_z_;
    filter_options.max_z = max_z_;
    filter_options.min_range = min_range_;
    filter_options.max_range = max_range_;
    filter_options.remove_ground = remove_ground_;
    filter_options.ground_distance_threshold = ground_distance_threshold_;
    filter_options.ground_max_tilt_degrees = ground_max_tilt_degrees_;
    filter_options.use_voxel_filter = use_voxel_filter_;
    filter_options.voxel_leaf_size = voxel_leaf_size_;
    auto filter_result = filterPointCloud(std::move(fused), filter_options);

    if (filter_result.cloud.empty()) {
      RCLCPP_WARN_THROTTLE(
        get_logger(), *get_clock(), 2000,
        "Fusion filters removed all %zu points (after crop: %zu, after ground removal: %zu)",
        filter_result.input_count, filter_result.cropped_count,
        filter_result.ground_filtered_count);
      return;
    }

    // 3) The PCL-only filter pipeline bounds downstream ADBSCAN runtime.
    PointCloud2 out;
    const auto & output_cloud = filter_result.cloud;
    pcl::PointXYZ min_point;
    pcl::PointXYZ max_point;
    pcl::getMinMax3D(output_cloud, min_point, max_point);
    RCLCPP_INFO_THROTTLE(
      get_logger(), *get_clock(), 2000,
      "Fusion point counts: input=%zu cropped=%zu ground_filtered=%zu output=%zu "
      "bounds=[(%.2f, %.2f, %.2f), (%.2f, %.2f, %.2f)]",
      filter_result.input_count, filter_result.cropped_count, filter_result.ground_filtered_count,
      output_cloud.size(), min_point.x, min_point.y, min_point.z, max_point.x, max_point.y,
      max_point.z);
    pcl::toROSMsg(output_cloud, out);

    out.header.frame_id = target_frame_;
    // Stamp with the newest available input so downstream latency checks pass.
    rclcpp::Time stamp(0, 0, get_clock()->get_clock_type());
    if (scan) {
      stamp = rclcpp::Time(scan->header.stamp);
    }
    if (cloud) {
      const rclcpp::Time cloud_stamp(cloud->header.stamp);
      if (cloud_stamp > stamp) {
        stamp = cloud_stamp;
      }
    }
    out.header.stamp = stamp;
    pub_->publish(out);
  }

  // Parameters.
  std::string target_frame_;
  std::string scan_topic_;
  std::string cloud_topic_;
  std::string output_topic_;
  double scan_range_cutoff_{-1.0};
  double min_x_{-std::numeric_limits<double>::infinity()};
  double max_x_{std::numeric_limits<double>::infinity()};
  double min_y_{-std::numeric_limits<double>::infinity()};
  double max_y_{std::numeric_limits<double>::infinity()};
  double min_z_{-std::numeric_limits<double>::infinity()};
  double max_z_{std::numeric_limits<double>::infinity()};
  double min_range_{0.0};
  double max_range_{std::numeric_limits<double>::infinity()};
  bool remove_ground_{false};
  double ground_distance_threshold_{0.08};
  double ground_max_tilt_degrees_{12.0};
  double voxel_leaf_size_{0.03};
  bool use_voxel_filter_{true};
  int sync_queue_size_{10};
  double sync_max_interval_{0.1};
  double transform_timeout_{0.1};
  bool fuse_scan_{true};
  bool fuse_cloud_{true};

  // State.
  laser_geometry::LaserProjection projector_;
  std::shared_ptr<tf2_ros::Buffer> tf_buffer_;
  std::shared_ptr<tf2_ros::TransformListener> tf_listener_;
  rclcpp::Publisher<PointCloud2>::SharedPtr pub_;
  message_filters::Subscriber<LaserScan> scan_sub_;
  message_filters::Subscriber<PointCloud2> cloud_sub_;
  std::shared_ptr<Synchronizer> sync_;
  // Used only in single-sensor mode (fuse_scan xor fuse_cloud).
  rclcpp::Subscription<LaserScan>::SharedPtr scan_only_sub_;
  rclcpp::Subscription<PointCloud2>::SharedPtr cloud_only_sub_;
};

}  // namespace adbscan_sensor_fusion

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<adbscan_sensor_fusion::PointCloudFusionNode>());
  rclcpp::shutdown();
  return 0;
}
