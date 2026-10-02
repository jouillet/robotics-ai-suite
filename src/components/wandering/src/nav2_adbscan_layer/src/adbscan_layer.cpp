// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions
// and limitations under the License.

#include "nav2_adbscan_layer/adbscan_layer.hpp"

#include <algorithm>
#include <cmath>
#include <limits>
#include <memory>
#include <string>
#include <utility>

#include "nav2_costmap_2d/costmap_math.hpp"
#include "pluginlib/class_list_macros.hpp"
#include "tf2/utils.h"
#include "tf2_geometry_msgs/tf2_geometry_msgs.hpp"

using nav2_costmap_2d::LETHAL_OBSTACLE;
using nav2_costmap_2d::NO_INFORMATION;
using rcl_interfaces::msg::ParameterType;

namespace nav2_adbscan_layer
{

void ADBScanLayer::onInitialize()
{
  auto node = node_.lock();
  if (!node) {
    throw std::runtime_error{"ADBScanLayer: failed to lock lifecycle node"};
  }
  logger_ = node->get_logger();
  clock_ = node->get_clock();

  declareParameter("enabled", rclcpp::ParameterValue(true));
  declareParameter("obstacle_topic", rclcpp::ParameterValue(std::string("obstacle_array")));
  declareParameter("default_obstacle_frame", rclcpp::ParameterValue(std::string("base_link")));
  declareParameter("time_to_live", rclcpp::ParameterValue(0.5));
  declareParameter("footprint_padding", rclcpp::ParameterValue(0.05));
  declareParameter("min_mark_radius", rclcpp::ParameterValue(0.04));
  declareParameter("max_obstacle_extent", rclcpp::ParameterValue(2.5));
  declareParameter("max_detection_distance", rclcpp::ParameterValue(6.0));
  declareParameter("transform_tolerance", rclcpp::ParameterValue(0.2));
  declareParameter("combination_method", rclcpp::ParameterValue(1));

  node->get_parameter(name_ + "." + "enabled", enabled_);
  node->get_parameter(name_ + "." + "obstacle_topic", obstacle_topic_);
  node->get_parameter(name_ + "." + "default_obstacle_frame", default_obstacle_frame_);
  node->get_parameter(name_ + "." + "time_to_live", time_to_live_);
  node->get_parameter(name_ + "." + "footprint_padding", footprint_padding_);
  node->get_parameter(name_ + "." + "min_mark_radius", min_mark_radius_);
  node->get_parameter(name_ + "." + "max_obstacle_extent", max_obstacle_extent_);
  node->get_parameter(name_ + "." + "max_detection_distance", max_detection_distance_);
  node->get_parameter(name_ + "." + "transform_tolerance", transform_tolerance_);
  node->get_parameter(name_ + "." + "combination_method", combination_method_);

  global_frame_ = layered_costmap_->getGlobalFrameID();
  rolling_window_ = layered_costmap_->isRolling();

  // This layer owns its own grid; initialise to NO_INFORMATION before matching
  // the master costmap size so the allocated cells start cleared.
  default_value_ = NO_INFORMATION;
  ADBScanLayer::matchSize();
  current_ = true;

  rclcpp::QoS qos = rclcpp::SensorDataQoS();
  sub_ = node->create_subscription<nav2_dynamic_msgs::msg::ObstacleArray>(
    obstacle_topic_, qos, std::bind(&ADBScanLayer::obstacleCallback, this, std::placeholders::_1));
  parameter_callback_handle_ = node->add_on_set_parameters_callback(
    std::bind(&ADBScanLayer::onParametersSet, this, std::placeholders::_1));

  RCLCPP_INFO(
    logger_, "ADBScanLayer '%s' initialized: topic='%s' global_frame='%s' ttl=%.2fs padding=%.2fm",
    name_.c_str(), obstacle_topic_.c_str(), global_frame_.c_str(), time_to_live_,
    footprint_padding_);
}

void ADBScanLayer::obstacleCallback(const nav2_dynamic_msgs::msg::ObstacleArray::SharedPtr msg)
{
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  queue_.push_back(msg);
}

rcl_interfaces::msg::SetParametersResult ADBScanLayer::onParametersSet(
  const std::vector<rclcpp::Parameter> & parameters)
{
  rcl_interfaces::msg::SetParametersResult result;
  result.successful = false;

  bool enabled = enabled_;
  double time_to_live = time_to_live_;
  double footprint_padding = footprint_padding_;
  double min_mark_radius = min_mark_radius_;
  double max_obstacle_extent = max_obstacle_extent_;
  double max_detection_distance = max_detection_distance_;
  double transform_tolerance = transform_tolerance_;
  int combination_method = combination_method_;

  for (const auto & parameter : parameters) {
    const std::string & name = parameter.get_name();
    if (name == name_ + ".obstacle_topic" || name == name_ + ".default_obstacle_frame") {
      result.reason = name + " can only be changed while the layer is reinitialized";
      return result;
    }
    if (name == name_ + ".enabled") {
      if (parameter.get_type() != rclcpp::ParameterType::PARAMETER_BOOL) {
        result.reason = name + " must be a boolean";
        return result;
      }
      enabled = parameter.as_bool();
    } else if (name == name_ + ".time_to_live") {
      time_to_live = parameter.as_double();
    } else if (name == name_ + ".footprint_padding") {
      footprint_padding = parameter.as_double();
    } else if (name == name_ + ".min_mark_radius") {
      min_mark_radius = parameter.as_double();
    } else if (name == name_ + ".max_obstacle_extent") {
      max_obstacle_extent = parameter.as_double();
    } else if (name == name_ + ".max_detection_distance") {
      max_detection_distance = parameter.as_double();
    } else if (name == name_ + ".transform_tolerance") {
      transform_tolerance = parameter.as_double();
    } else if (name == name_ + ".combination_method") {
      combination_method = parameter.as_int();
    }
  }

  if (
    time_to_live < 0.0 || footprint_padding < 0.0 || min_mark_radius < 0.0 ||
    max_obstacle_extent <= 0.0 || max_detection_distance < 0.0 || transform_tolerance < 0.0 ||
    (combination_method != 0 && combination_method != 1)) {
    result.reason = "ADBScan layer parameters are outside their valid ranges";
    return result;
  }

  std::lock_guard<std::recursive_mutex> lock(mutex_);
  enabled_ = enabled;
  time_to_live_ = time_to_live;
  footprint_padding_ = footprint_padding;
  min_mark_radius_ = min_mark_radius;
  max_obstacle_extent_ = max_obstacle_extent;
  max_detection_distance_ = max_detection_distance;
  transform_tolerance_ = transform_tolerance;
  combination_method_ = combination_method;
  if (!enabled_) {
    queue_.clear();
    cache_.clear();
  }
  result.successful = true;
  return result;
}

std::string ADBScanLayer::uuidToKey(const std::array<uint8_t, 16> & uuid)
{
  static const char * hex = "0123456789abcdef";
  std::string key;
  key.reserve(32);
  for (uint8_t b : uuid) {
    key.push_back(hex[(b >> 4) & 0xF]);
    key.push_back(hex[b & 0xF]);
  }
  return key;
}

void ADBScanLayer::ingestQueuedMessages(const rclcpp::Time & now)
{
  const rclcpp::Duration ttl = rclcpp::Duration::from_seconds(time_to_live_);

  for (const auto & msg : queue_) {
    // ADBSCAN may not stamp the header; fall back to a configured frame and
    // to the latest available transform when the stamp is empty.
    std::string source_frame =
      msg->header.frame_id.empty() ? default_obstacle_frame_ : msg->header.frame_id;
    rclcpp::Time stamp(msg->header.stamp, now.get_clock_type());
    const bool use_latest = (stamp.nanoseconds() == 0);

    for (const auto & ob : msg->obstacles) {
      geometry_msgs::msg::PointStamped in;
      in.header.frame_id = source_frame;
      in.header.stamp = use_latest ? rclcpp::Time(0, 0, now.get_clock_type()) : stamp;
      in.point = ob.position;

      geometry_msgs::msg::PointStamped out;
      if (source_frame == global_frame_) {
        out = in;
      } else {
        try {
          tf_->transform(in, out, global_frame_, tf2::durationFromSec(transform_tolerance_));
        } catch (const tf2::TransformException & ex) {
          RCLCPP_DEBUG(
            logger_, "ADBScanLayer: dropping obstacle, TF %s->%s failed: %s", source_frame.c_str(),
            global_frame_.c_str(), ex.what());
          continue;
        }
      }

      // ADBSCAN is intended to report object-sized clusters. Reject a merged
      // ground, wall, or background cluster before it can mask the costmap.
      const double extent = std::max(ob.size.x, ob.size.y);
      if (extent > max_obstacle_extent_) {
        RCLCPP_DEBUG(
          logger_, "ADBScanLayer: dropping %.2fm-wide obstacle (limit %.2fm)", extent,
          max_obstacle_extent_);
        continue;
      }

      // Footprint radius from the obstacle's horizontal extent, plus padding.
      const double half_extent = 0.5 * extent;
      const double radius = std::max(half_extent + footprint_padding_, min_mark_radius_);

      TrackedObstacle tracked;
      tracked.wx = out.point.x;
      tracked.wy = out.point.y;
      tracked.radius = radius;
      tracked.expiry = now + ttl;

      cache_[uuidToKey(ob.uuid.uuid)] = tracked;
    }
  }
  queue_.clear();
}

void ADBScanLayer::purgeExpired(const rclcpp::Time & now)
{
  for (auto it = cache_.begin(); it != cache_.end();) {
    if (it->second.expiry <= now) {
      it = cache_.erase(it);
    } else {
      ++it;
    }
  }
}

void ADBScanLayer::markCircle(double wx, double wy, double radius)
{
  const double x0 = wx - radius;
  const double y0 = wy - radius;
  const double x1 = wx + radius;
  const double y1 = wy + radius;

  int mx0{0}, my0{0}, mx1{0}, my1{0};
  worldToMapEnforceBounds(x0, y0, mx0, my0);
  worldToMapEnforceBounds(x1, y1, mx1, my1);

  const double r2 = radius * radius;
  for (int my = my0; my <= my1; ++my) {
    for (int mx = mx0; mx <= mx1; ++mx) {
      double cx{0.0}, cy{0.0};
      mapToWorld(static_cast<unsigned int>(mx), static_cast<unsigned int>(my), cx, cy);
      const double dx = cx - wx;
      const double dy = cy - wy;
      if (dx * dx + dy * dy <= r2) {
        setCost(static_cast<unsigned int>(mx), static_cast<unsigned int>(my), LETHAL_OBSTACLE);
      }
    }
  }
}

void ADBScanLayer::updateBounds(
  double robot_x, double robot_y, double /*robot_yaw*/, double * min_x, double * min_y,
  double * max_x, double * max_y)
{
  if (!enabled_) {
    return;
  }

  std::lock_guard<std::recursive_mutex> lock(mutex_);

  if (rolling_window_) {
    updateOrigin(robot_x - getSizeInMetersX() / 2.0, robot_y - getSizeInMetersY() / 2.0);
  }

  const rclcpp::Time now = clock_->now();
  ingestQueuedMessages(now);
  purgeExpired(now);

  // Clear the layer's grid and re-stamp all currently valid detections.
  resetMaps();
  current_ = true;

  double m_min_x = std::numeric_limits<double>::max();
  double m_min_y = std::numeric_limits<double>::max();
  double m_max_x = std::numeric_limits<double>::lowest();
  double m_max_y = std::numeric_limits<double>::lowest();
  bool any = false;

  for (const auto & kv : cache_) {
    const TrackedObstacle & ob = kv.second;

    const double d = std::hypot(ob.wx - robot_x, ob.wy - robot_y);
    if (d > max_detection_distance_) {
      continue;
    }

    markCircle(ob.wx, ob.wy, ob.radius);
    any = true;
    m_min_x = std::min(m_min_x, ob.wx - ob.radius);
    m_min_y = std::min(m_min_y, ob.wy - ob.radius);
    m_max_x = std::max(m_max_x, ob.wx + ob.radius);
    m_max_y = std::max(m_max_y, ob.wy + ob.radius);
  }

  // Always include the previous marked region so that cells cleared this cycle
  // are recomputed and republished to the master costmap.
  if (have_last_bounds_) {
    *min_x = std::min(*min_x, last_min_x_);
    *min_y = std::min(*min_y, last_min_y_);
    *max_x = std::max(*max_x, last_max_x_);
    *max_y = std::max(*max_y, last_max_y_);
  }

  if (any) {
    *min_x = std::min(*min_x, m_min_x);
    *min_y = std::min(*min_y, m_min_y);
    *max_x = std::max(*max_x, m_max_x);
    *max_y = std::max(*max_y, m_max_y);

    last_min_x_ = m_min_x;
    last_min_y_ = m_min_y;
    last_max_x_ = m_max_x;
    last_max_y_ = m_max_y;
    have_last_bounds_ = true;
  } else {
    have_last_bounds_ = false;
  }
}

void ADBScanLayer::updateCosts(
  nav2_costmap_2d::Costmap2D & master_grid, int min_i, int min_j, int max_i, int max_j)
{
  if (!enabled_) {
    return;
  }

  std::lock_guard<std::recursive_mutex> lock(mutex_);

  switch (combination_method_) {
    case 0:
      updateWithOverwrite(master_grid, min_i, min_j, max_i, max_j);
      break;
    case 1:
    default:
      updateWithMax(master_grid, min_i, min_j, max_i, max_j);
      break;
  }
}

void ADBScanLayer::onFootprintChanged()
{
  // Footprint padding is applied per-obstacle; nothing to precompute here.
}

void ADBScanLayer::reset()
{
  std::lock_guard<std::recursive_mutex> lock(mutex_);
  queue_.clear();
  cache_.clear();
  have_last_bounds_ = false;
  resetMaps();
  current_ = false;
}

}  // namespace nav2_adbscan_layer

PLUGINLIB_EXPORT_CLASS(nav2_adbscan_layer::ADBScanLayer, nav2_costmap_2d::Layer)
