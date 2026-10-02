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

#ifndef NAV2_ADBSCAN_LAYER__ADBSCAN_LAYER_HPP_
#define NAV2_ADBSCAN_LAYER__ADBSCAN_LAYER_HPP_

#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include "geometry_msgs/msg/point_stamped.hpp"
#include "nav2_costmap_2d/costmap_layer.hpp"
#include "nav2_costmap_2d/layered_costmap.hpp"
#include "nav2_dynamic_msgs/msg/obstacle_array.hpp"
#include "rclcpp/rclcpp.hpp"

namespace nav2_adbscan_layer
{

/// @brief A costmap layer that marks ADBSCAN-detected obstacles into the costmap.
///
/// Subscribes to a nav2_dynamic_msgs/ObstacleArray topic (published by the
/// ADBSCAN node), transforms each detected obstacle into the costmap global
/// frame, persists it for a configurable time-to-live (so detections do not
/// flicker between frames), and stamps a lethal footprint that the Nav2
/// planner and controller will avoid.
class ADBScanLayer : public nav2_costmap_2d::CostmapLayer
{
public:
  ADBScanLayer() = default;
  ~ADBScanLayer() override = default;

  void onInitialize() override;

  void updateBounds(
    double robot_x, double robot_y, double robot_yaw, double * min_x, double * min_y,
    double * max_x, double * max_y) override;

  void updateCosts(
    nav2_costmap_2d::Costmap2D & master_grid, int min_i, int min_j, int max_i, int max_j) override;

  void reset() override;

  void onFootprintChanged() override;

  bool isClearable() override { return true; }

private:
  /// @brief A single tracked obstacle, stored in the costmap global frame.
  struct TrackedObstacle
  {
    double wx{0.0};       ///< World x in the global frame [m].
    double wy{0.0};       ///< World y in the global frame [m].
    double radius{0.0};   ///< Marking radius [m] (from obstacle footprint + padding).
    rclcpp::Time expiry;  ///< Time at which this detection should be dropped.
  };

  /// @brief ObstacleArray subscription callback. Queues messages only.
  void obstacleCallback(const nav2_dynamic_msgs::msg::ObstacleArray::SharedPtr msg);

  rcl_interfaces::msg::SetParametersResult onParametersSet(
    const std::vector<rclcpp::Parameter> & parameters);

  /// @brief Drain queued messages, transform obstacles to the global frame and
  ///        insert/refresh them in the cache. Must be called with mutex held.
  void ingestQueuedMessages(const rclcpp::Time & now);

  /// @brief Remove obstacles whose time-to-live has elapsed. Mutex held.
  void purgeExpired(const rclcpp::Time & now);

  /// @brief Mark a filled lethal circle into this layer's grid.
  void markCircle(double wx, double wy, double radius);

  /// @brief Build a stable string key from an obstacle UUID.
  static std::string uuidToKey(const std::array<uint8_t, 16> & uuid);

  // Parameters.
  std::string obstacle_topic_;
  std::string default_obstacle_frame_;
  double time_to_live_{0.5};
  double footprint_padding_{0.05};
  double min_mark_radius_{0.04};
  double max_obstacle_extent_{2.5};
  double max_detection_distance_{6.0};
  double transform_tolerance_{0.2};
  int combination_method_{1};  // 0 = overwrite, 1 = max.
  bool track_velocity_{false};

  // State.
  rclcpp::Subscription<nav2_dynamic_msgs::msg::ObstacleArray>::SharedPtr sub_;
  rclcpp::node_interfaces::OnSetParametersCallbackHandle::SharedPtr parameter_callback_handle_;
  std::vector<nav2_dynamic_msgs::msg::ObstacleArray::SharedPtr> queue_;
  std::unordered_map<std::string, TrackedObstacle> cache_;
  std::recursive_mutex mutex_;

  // Bounds bookkeeping so cleared cells are always republished.
  bool have_last_bounds_{false};
  double last_min_x_{0.0};
  double last_min_y_{0.0};
  double last_max_x_{0.0};
  double last_max_y_{0.0};

  bool rolling_window_{false};
  std::string global_frame_;
  rclcpp::Logger logger_{rclcpp::get_logger("ADBScanLayer")};
  rclcpp::Clock::SharedPtr clock_;
};

}  // namespace nav2_adbscan_layer

#endif  // NAV2_ADBSCAN_LAYER__ADBSCAN_LAYER_HPP_
