// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include <gtest/gtest.h>

#include <chrono>
#include <limits>
#include <memory>
#include <thread>

#include "geometry_msgs/msg/transform_stamped.hpp"
#include "nav2_adbscan_layer/adbscan_layer.hpp"
#include "nav2_costmap_2d/cost_values.hpp"
#include "nav2_costmap_2d/layer.hpp"
#include "nav2_costmap_2d/layered_costmap.hpp"
#include "nav2_util/lifecycle_node.hpp"
#include "pluginlib/class_loader.hpp"
#include "rclcpp/executors/single_threaded_executor.hpp"
#include "tf2_ros/buffer.h"

namespace nav2_adbscan_layer
{
namespace
{

class ADBScanLayerTest : public ::testing::Test
{
protected:
  explicit ADBScanLayerTest(int combination_method = 1) : combination_method_(combination_method) {}

  void SetUp() override
  {
    rclcpp::NodeOptions options;
    options.append_parameter_override("adbscan.time_to_live", 0.05);
    options.append_parameter_override("adbscan.combination_method", combination_method_);
    node_ = std::make_shared<nav2_util::LifecycleNode>("adbscan_layer_test", "", options);
    layered_costmap_ = std::make_unique<nav2_costmap_2d::LayeredCostmap>("map", false, true);
    layered_costmap_->resizeMap(100, 100, 0.1, 0.0, 0.0, false);
    tf_buffer_ = std::make_unique<tf2_ros::Buffer>(node_->get_clock());
    layer_.initialize(
      layered_costmap_.get(), "adbscan", tf_buffer_.get(), node_,
      node_->create_callback_group(rclcpp::CallbackGroupType::MutuallyExclusive));
    publisher_ = node_->create_publisher<nav2_dynamic_msgs::msg::ObstacleArray>(
      "obstacle_array", rclcpp::SensorDataQoS());
    executor_.add_node(node_->get_node_base_interface());
  }

  void TearDown() override { executor_.remove_node(node_->get_node_base_interface()); }

  void publishObstacle(double x, double y, double extent, const std::string & frame = "map")
  {
    nav2_dynamic_msgs::msg::ObstacleArray message;
    message.header.frame_id = frame;
    message.obstacles.resize(1);
    message.obstacles.front().position.x = x;
    message.obstacles.front().position.y = y;
    message.obstacles.front().size.x = extent;
    message.obstacles.front().size.y = extent;
    publisher_->publish(message);
    executor_.spin_some();
  }

  void updateLayer()
  {
    double min_x = std::numeric_limits<double>::max();
    double min_y = std::numeric_limits<double>::max();
    double max_x = std::numeric_limits<double>::lowest();
    double max_y = std::numeric_limits<double>::lowest();
    layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);
    auto * master = layered_costmap_->getCostmap();
    layer_.updateCosts(*master, 0, 0, 100, 100);
  }

  unsigned char masterCostAt(double x, double y)
  {
    unsigned int mx = 0;
    unsigned int my = 0;
    EXPECT_TRUE(layered_costmap_->getCostmap()->worldToMap(x, y, mx, my));
    return layered_costmap_->getCostmap()->getCost(mx, my);
  }

  nav2_adbscan_layer::ADBScanLayer layer_;
  std::shared_ptr<nav2_util::LifecycleNode> node_;
  std::unique_ptr<nav2_costmap_2d::LayeredCostmap> layered_costmap_;
  std::unique_ptr<tf2_ros::Buffer> tf_buffer_;
  rclcpp::Publisher<nav2_dynamic_msgs::msg::ObstacleArray>::SharedPtr publisher_;
  rclcpp::executors::SingleThreadedExecutor executor_;

private:
  int combination_method_;
};

class ADBScanLayerOverwriteTest : public ADBScanLayerTest
{
protected:
  ADBScanLayerOverwriteTest() : ADBScanLayerTest(0) {}
};

TEST(ADBScanLayerPluginTest, IsDiscoverableAndInstantiable)
{
  pluginlib::ClassLoader<nav2_costmap_2d::Layer> loader(
    "nav2_costmap_2d", "nav2_costmap_2d::Layer");
  constexpr char plugin_class[] = "nav2_adbscan_layer::ADBScanLayer";
  ASSERT_TRUE(loader.isClassAvailable(plugin_class));

  std::shared_ptr<nav2_costmap_2d::Layer> instance;
  ASSERT_NO_THROW(instance = loader.createSharedInstance(plugin_class));
  ASSERT_NE(instance, nullptr);
}

TEST_F(ADBScanLayerTest, MarksPublishedObstacleInCostmap)
{
  publishObstacle(2.0, 3.0, 0.2);

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  auto * master = layered_costmap_->getCostmap();
  layer_.updateCosts(*master, 0, 0, 100, 100);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(master->worldToMap(2.0, 3.0, mx, my));
  EXPECT_EQ(master->getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);
  EXPECT_LT(min_x, 2.0);
  EXPECT_GT(max_x, 2.0);
}

TEST_F(ADBScanLayerOverwriteTest, MarksPublishedObstacleInCostmap)
{
  publishObstacle(2.0, 3.0, 0.2);

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  auto * master = layered_costmap_->getCostmap();
  layer_.updateCosts(*master, 0, 0, 100, 100);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(master->worldToMap(2.0, 3.0, mx, my));
  EXPECT_EQ(master->getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);
}

TEST_F(ADBScanLayerTest, UpdatesEnabledParameterAtRuntime)
{
  auto results = node_->set_parameters({rclcpp::Parameter("adbscan.enabled", false)});
  ASSERT_EQ(results.size(), 1U);
  ASSERT_TRUE(results.front().successful);

  publishObstacle(2.0, 3.0, 0.2);
  updateLayer();
  EXPECT_NE(masterCostAt(2.0, 3.0), nav2_costmap_2d::LETHAL_OBSTACLE);

  results = node_->set_parameters({rclcpp::Parameter("adbscan.enabled", true)});
  ASSERT_TRUE(results.front().successful);
  publishObstacle(2.0, 3.0, 0.2);
  updateLayer();
  EXPECT_EQ(masterCostAt(2.0, 3.0), nav2_costmap_2d::LETHAL_OBSTACLE);
}

TEST_F(ADBScanLayerTest, UpdatesTimeToLiveParameterAtRuntime)
{
  auto results = node_->set_parameters({rclcpp::Parameter("adbscan.time_to_live", 0.0)});
  ASSERT_EQ(results.size(), 1U);
  ASSERT_TRUE(results.front().successful);

  publishObstacle(2.0, 3.0, 0.2);
  updateLayer();
  EXPECT_NE(masterCostAt(2.0, 3.0), nav2_costmap_2d::LETHAL_OBSTACLE);

  results = node_->set_parameters({rclcpp::Parameter("adbscan.time_to_live", 0.5)});
  ASSERT_TRUE(results.front().successful);
  publishObstacle(2.0, 3.0, 0.2);
  updateLayer();
  EXPECT_EQ(masterCostAt(2.0, 3.0), nav2_costmap_2d::LETHAL_OBSTACLE);
}

TEST_F(ADBScanLayerTest, UpdatesDetectionDistanceParameterAtRuntime)
{
  auto results = node_->set_parameters({rclcpp::Parameter("adbscan.max_detection_distance", 1.0)});
  ASSERT_EQ(results.size(), 1U);
  ASSERT_TRUE(results.front().successful);

  publishObstacle(2.0, 3.0, 0.2);
  updateLayer();
  EXPECT_NE(masterCostAt(2.0, 3.0), nav2_costmap_2d::LETHAL_OBSTACLE);

  results = node_->set_parameters({rclcpp::Parameter("adbscan.max_detection_distance", 5.0)});
  ASSERT_TRUE(results.front().successful);
  updateLayer();
  EXPECT_EQ(masterCostAt(2.0, 3.0), nav2_costmap_2d::LETHAL_OBSTACLE);

  results = node_->set_parameters({rclcpp::Parameter("adbscan.max_detection_distance", -1.0)});
  ASSERT_FALSE(results.front().successful);
}

TEST_F(ADBScanLayerTest, RejectsInitializationOnlyParameterAtRuntime)
{
  auto results =
    node_->set_parameters({rclcpp::Parameter("adbscan.obstacle_topic", "other_obstacle_array")});
  ASSERT_EQ(results.size(), 1U);
  EXPECT_FALSE(results.front().successful);
}

TEST_F(ADBScanLayerTest, RejectsObstacleLargerThanConfiguredExtent)
{
  publishObstacle(2.0, 3.0, 3.0);

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  auto * master = layered_costmap_->getCostmap();
  layer_.updateCosts(*master, 0, 0, 100, 100);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(master->worldToMap(2.0, 3.0, mx, my));
  EXPECT_NE(master->getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);
}

TEST_F(ADBScanLayerTest, ExpiresObstaclesAndIncludesPriorBounds)
{
  publishObstacle(2.0, 3.0, 0.2);

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(layer_.worldToMap(2.0, 3.0, mx, my));
  ASSERT_EQ(layer_.getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);

  std::this_thread::sleep_for(std::chrono::milliseconds(75));
  min_x = std::numeric_limits<double>::max();
  min_y = std::numeric_limits<double>::max();
  max_x = std::numeric_limits<double>::lowest();
  max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  EXPECT_EQ(layer_.getCost(mx, my), nav2_costmap_2d::NO_INFORMATION);
  EXPECT_LT(min_x, 2.0);
  EXPECT_GT(max_x, 2.0);
}

TEST_F(ADBScanLayerTest, TransformsObstacleIntoCostmapFrame)
{
  geometry_msgs::msg::TransformStamped transform;
  transform.header.frame_id = "map";
  transform.child_frame_id = "sensor_frame";
  transform.transform.translation.x = 1.0;
  transform.transform.rotation.w = 1.0;
  ASSERT_TRUE(tf_buffer_->setTransform(transform, "test", true));
  publishObstacle(1.0, 3.0, 0.2, "sensor_frame");

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  auto * master = layered_costmap_->getCostmap();
  layer_.updateCosts(*master, 0, 0, 100, 100);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(master->worldToMap(2.0, 3.0, mx, my));
  EXPECT_EQ(master->getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);
}

TEST_F(ADBScanLayerTest, RejectsObstacleWithoutTransformIntoCostmapFrame)
{
  publishObstacle(2.0, 3.0, 0.2, "unconnected_frame");

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  auto * master = layered_costmap_->getCostmap();
  layer_.updateCosts(*master, 0, 0, 100, 100);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(master->worldToMap(2.0, 3.0, mx, my));
  EXPECT_NE(master->getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);
}

TEST_F(ADBScanLayerTest, DoesNotMarkObstacleOutsideDetectionDistance)
{
  publishObstacle(7.0, 3.0, 0.2);

  double min_x = std::numeric_limits<double>::max();
  double min_y = std::numeric_limits<double>::max();
  double max_x = std::numeric_limits<double>::lowest();
  double max_y = std::numeric_limits<double>::lowest();
  layer_.updateBounds(0.0, 0.0, 0.0, &min_x, &min_y, &max_x, &max_y);

  auto * master = layered_costmap_->getCostmap();
  layer_.updateCosts(*master, 0, 0, 100, 100);

  unsigned int mx = 0;
  unsigned int my = 0;
  ASSERT_TRUE(master->worldToMap(7.0, 3.0, mx, my));
  EXPECT_NE(master->getCost(mx, my), nav2_costmap_2d::LETHAL_OBSTACLE);
}

}  // namespace
}  // namespace nav2_adbscan_layer

int main(int argc, char ** argv)
{
  ::testing::InitGoogleTest(&argc, argv);
  rclcpp::init(argc, argv);
  const int result = RUN_ALL_TESTS();
  rclcpp::shutdown();
  return result;
}