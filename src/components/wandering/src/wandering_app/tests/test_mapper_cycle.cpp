// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include <gtest/gtest.h>

#include <chrono>
#include <memory>
#include <thread>
#include <vector>

#include "WanderingMapper.h"
#include "dummyactionserver.hpp"
#include "geometry_msgs/msg/transform_stamped.hpp"
#include "tf2_ros/static_transform_broadcaster.h"

namespace
{

class TestableWanderingMapper : public WanderingMapper
{
public:
  bool hasRequiredFrames() { return areTfFramesPresent(); }

  void setCostmap(const nav_msgs::msg::OccupancyGrid::SharedPtr & costmap)
  {
    mapEngine_->mapCallback(costmap);
  }

  bool initializeForTest() { return init(); }

  void mapOnce() { doMap(); }

  std::vector<nav2_msgs::action::NavigateToPose::Goal> sentGoals() const
  {
    return goalCatcher_->getSentGoals();
  }

  bool isMoving() { return goalCatcher_->isMoving(); }
};

nav_msgs::msg::OccupancyGrid::SharedPtr makeCostmap()
{
  constexpr uint32_t width = 20;
  constexpr uint32_t height = 20;
  auto costmap = std::make_shared<nav_msgs::msg::OccupancyGrid>();
  costmap->info.width = width;
  costmap->info.height = height;
  costmap->info.resolution = 0.1;
  costmap->data.assign(width * height, -1);
  for (uint32_t y = 3; y < 17; ++y) {
    for (uint32_t x = 3; x < 17; ++x) {
      costmap->data[y * width + x] = 0;
    }
  }
  return costmap;
}

TEST(WanderingMapperCycleTest, InitializesAndSubmitsAutonomousGoal)
{
  auto mapper = std::make_shared<TestableWanderingMapper>();
  auto tf_publisher = rclcpp::Node::make_shared("mapper_cycle_tf_publisher");
  tf2_ros::StaticTransformBroadcaster broadcaster(tf_publisher);
  geometry_msgs::msg::TransformStamped transform;
  transform.header.frame_id = "map";
  transform.child_frame_id = "base_link";
  transform.transform.translation.x = 1.0;
  transform.transform.translation.y = 1.0;
  transform.transform.rotation.w = 1.0;

  const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(2);
  while (!mapper->hasRequiredFrames() && std::chrono::steady_clock::now() < deadline) {
    transform.header.stamp = mapper->now();
    broadcaster.sendTransform(transform);
    rclcpp::spin_some(mapper);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  ASSERT_TRUE(mapper->hasRequiredFrames());

  mapper->setCostmap(makeCostmap());
  ASSERT_TRUE(mapper->initializeForTest());
  mapper->mapOnce();

  const auto goals = mapper->sentGoals();
  ASSERT_EQ(goals.size(), 1U);
  EXPECT_EQ(goals.front().pose.header.frame_id, "map");
  EXPECT_GT(goals.front().pose.pose.position.x, 0.0);
  EXPECT_GT(goals.front().pose.pose.position.y, 0.0);

  const auto result_deadline = std::chrono::steady_clock::now() + std::chrono::seconds(3);
  while (mapper->isMoving() && std::chrono::steady_clock::now() < result_deadline) {
    rclcpp::spin_some(mapper);
    std::this_thread::sleep_for(std::chrono::milliseconds(10));
  }
  EXPECT_FALSE(mapper->isMoving());
}

}  // namespace

int main(int argc, char ** argv)
{
  ::testing::InitGoogleTest(&argc, argv);
  rclcpp::init(argc, argv);

  auto action_server = std::make_shared<NavGoalActionServer>();
  action_server->setDuration(0);
  std::thread server_thread([&action_server]() { rclcpp::spin(action_server); });

  const int result = RUN_ALL_TESTS();
  rclcpp::shutdown();
  action_server.reset();
  server_thread.join();
  return result;
}
