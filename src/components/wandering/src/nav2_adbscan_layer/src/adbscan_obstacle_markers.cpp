// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include <algorithm>
#include <chrono>
#include <cmath>
#include <functional>
#include <memory>
#include <string>

#include "nav2_dynamic_msgs/msg/obstacle_array.hpp"
#include "rclcpp/rclcpp.hpp"
#include "visualization_msgs/msg/marker_array.hpp"

namespace nav2_adbscan_layer
{

class ADBScanObstacleMarkers : public rclcpp::Node
{
public:
  ADBScanObstacleMarkers() : Node("adbscan_obstacle_markers")
  {
    obstacle_topic_ = declare_parameter<std::string>("obstacle_topic", "/obstacle_array");
    marker_topic_ = declare_parameter<std::string>("marker_topic", "/adbscan/obstacle_markers");
    marker_lifetime_ = declare_parameter<double>("marker_lifetime", 0.75);
    velocity_scale_ = declare_parameter<double>("velocity_scale", 0.5);
    max_obstacle_extent_ = declare_parameter<double>("max_obstacle_extent", 2.5);

    publisher_ = create_publisher<visualization_msgs::msg::MarkerArray>(marker_topic_, 10);
    subscription_ = create_subscription<nav2_dynamic_msgs::msg::ObstacleArray>(
      obstacle_topic_, rclcpp::SensorDataQoS(),
      std::bind(&ADBScanObstacleMarkers::obstacleCallback, this, std::placeholders::_1));
  }

private:
  void obstacleCallback(const nav2_dynamic_msgs::msg::ObstacleArray::SharedPtr message)
  {
    visualization_msgs::msg::MarkerArray markers;

    visualization_msgs::msg::Marker clear;
    clear.action = visualization_msgs::msg::Marker::DELETEALL;
    markers.markers.push_back(clear);

    const rclcpp::Duration lifetime = rclcpp::Duration::from_seconds(marker_lifetime_);
    const auto stamp = message->header.stamp;
    const std::string frame_id =
      message->header.frame_id.empty() ? "base_link" : message->header.frame_id;

    for (std::size_t index = 0; index < message->obstacles.size(); ++index) {
      const auto & obstacle = message->obstacles[index];
      const float confidence = std::clamp(obstacle.score, 0.0F, 1.0F);
      const double extent = std::max(obstacle.size.x, obstacle.size.y);

      // Match the costmap layer's object-size guard so a merged floor or wall
      // cluster cannot dominate the operator view.
      if (extent > max_obstacle_extent_) {
        continue;
      }

      visualization_msgs::msg::Marker box;
      box.header.frame_id = frame_id;
      box.header.stamp = stamp;
      box.ns = "adbscan_obstacles";
      box.id = static_cast<int32_t>(index * 2);
      box.type = visualization_msgs::msg::Marker::CUBE;
      box.action = visualization_msgs::msg::Marker::ADD;
      box.pose.position = obstacle.position;
      box.pose.orientation.w = 1.0;
      box.scale.x = std::max(obstacle.size.x, 0.05);
      box.scale.y = std::max(obstacle.size.y, 0.05);
      box.scale.z = std::max(obstacle.size.z, 0.05);
      box.color.r = 1.0F - confidence;
      box.color.g = confidence;
      box.color.b = 0.1F;
      box.color.a = 0.25F;
      box.lifetime = lifetime;
      markers.markers.push_back(box);

      const double speed = std::hypot(obstacle.velocity.x, obstacle.velocity.y);
      if (speed == 0.0 || velocity_scale_ <= 0.0) {
        continue;
      }

      visualization_msgs::msg::Marker velocity = box;
      velocity.id += 1;
      velocity.type = visualization_msgs::msg::Marker::ARROW;
      velocity.scale.x = 0.03;
      velocity.scale.y = 0.06;
      velocity.scale.z = 0.08;
      velocity.color.r = 0.2F;
      velocity.color.g = 0.6F;
      velocity.color.b = 1.0F;
      velocity.color.a = 0.9F;
      velocity.points.resize(2);
      velocity.points[0] = obstacle.position;
      velocity.points[1] = obstacle.position;
      velocity.points[1].x += obstacle.velocity.x * velocity_scale_;
      velocity.points[1].y += obstacle.velocity.y * velocity_scale_;
      velocity.points[1].z += obstacle.velocity.z * velocity_scale_;
      markers.markers.push_back(velocity);
    }

    publisher_->publish(markers);
  }

  std::string obstacle_topic_;
  std::string marker_topic_;
  double marker_lifetime_{0.75};
  double velocity_scale_{0.5};
  double max_obstacle_extent_{2.5};
  rclcpp::Publisher<visualization_msgs::msg::MarkerArray>::SharedPtr publisher_;
  rclcpp::Subscription<nav2_dynamic_msgs::msg::ObstacleArray>::SharedPtr subscription_;
};

}  // namespace nav2_adbscan_layer

int main(int argc, char ** argv)
{
  rclcpp::init(argc, argv);
  rclcpp::spin(std::make_shared<nav2_adbscan_layer::ADBScanObstacleMarkers>());
  rclcpp::shutdown();
  return 0;
}