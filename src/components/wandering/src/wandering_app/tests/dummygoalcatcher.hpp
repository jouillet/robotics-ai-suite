// Copyright (c) 2021 Intel Corporation
//
// SPDX-License-Identifier: Apache-2.0

#ifndef WANDERING__TESTS__DUMMYGOALCATCHER_HPP_
#define WANDERING__TESTS__DUMMYGOALCATCHER_HPP_

#include <gtest/gtest.h>

#include <fstream>
#include <iostream>
#include <memory>
#include <string>
#include <vector>

#include "GoalCatcher.h"
#include "geometry_msgs/msg/pose_stamped.hpp"

#define GAZEBO_ROBOT_RADIUS 0.22

using std::cerr;
using std::endl;
using std::make_shared;
using std::string;

class DummyGoalCatcher : public ::testing::Test
{
public:
  DummyGoalCatcher()
  {
    this->node_ = rclcpp::Node::make_shared("goalcatcher_test");
    this->goalCatcher_ = std::make_shared<GoalCatcher>(
      this->node_.get(), string("map"), string("base_link"), GAZEBO_ROBOT_RADIUS);
  }

  ~DummyGoalCatcher() {}

  bool sendGoalTest()
  {
    if (!this->goalCatcher_->init()) {
      return false;
    }

    geometry_msgs::msg::PoseStamped::SharedPtr msg =
      std::make_shared<geometry_msgs::msg::PoseStamped>();
    if (!msg) {
      return false;
    } else {
      msg->pose.position.x = 1.0;
      msg->pose.position.y = 1.0;

      nav2_msgs::action::NavigateToPose::Goal::SharedPtr goal =
        std::make_shared<nav2_msgs::action::NavigateToPose::Goal>();
      goal->pose = *msg;

      this->goalCatcher_->send_goal(goal, this->node_->now());
      rclcpp::spin_some(this->node_);
      if (!this->goalCatcher_->isMoving()) {
        cerr << "Goal Catcher should be in moving state" << endl;
        return false;
      }

      while (this->goalCatcher_->isMoving()) {
        rclcpp::spin_some(this->node_);
      }
      // We send a goal which is near and should be reported as visited
      double x = 1.05;
      double y = 1.05;
      if (!this->goalCatcher_->isVisited(x, y)) {
        cerr << "Coord already visited, but goal catcher does not report it!" << endl;
        return false;
      }

      return true;
    }
  }

  bool sendAbortedGoalTest()
  {
    if (!this->goalCatcher_->init()) {
      return false;
    }

    geometry_msgs::msg::PoseStamped::SharedPtr msg =
      std::make_shared<geometry_msgs::msg::PoseStamped>();
    if (!msg) {
      return false;
    } else {
      msg->pose.position.x = 1.0;
      msg->pose.position.y = 1.0;

      nav2_msgs::action::NavigateToPose::Goal::SharedPtr goal =
        std::make_shared<nav2_msgs::action::NavigateToPose::Goal>();
      goal->pose = *msg;

      this->goalCatcher_->send_goal(goal, this->node_->now());
      rclcpp::spin_some(this->node_);
      while (this->goalCatcher_->isMoving()) {
        rclcpp::spin_some(this->node_);
      }

      if (!this->goalCatcher_->isGoalBlocked(msg->pose.position.x, msg->pose.position.y)) {
        cerr << "Coord should be blocked!" << endl;
        return false;
      }

      return true;
    }
  }

  bool sendStalledGoalTest()
  {
    this->node_->set_parameter(rclcpp::Parameter("goal_progress_timeout", 0.1));
    this->goalCatcher_ = std::make_shared<GoalCatcher>(
      this->node_.get(), string("map"), string("base_link"), GAZEBO_ROBOT_RADIUS);
    if (!this->goalCatcher_->init()) {
      return false;
    }

    auto goal = std::make_shared<nav2_msgs::action::NavigateToPose::Goal>();
    goal->pose.pose.position.x = 2.0;
    goal->pose.pose.position.y = 2.0;
    this->goalCatcher_->send_goal(goal, this->node_->now());

    const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(3);
    while (this->goalCatcher_->isMoving() && std::chrono::steady_clock::now() < deadline) {
      rclcpp::spin_some(this->node_);
    }

    return !this->goalCatcher_->isMoving() && this->goalCatcher_->isGoalBlocked(2.0, 2.0);
  }

  bool visitedToleranceTest()
  {
    this->node_->set_parameter(rclcpp::Parameter("goal_visited_tolerance", 0.35));
    this->goalCatcher_ =
      std::make_shared<GoalCatcher>(this->node_.get(), string("map"), string("base_link"), 0.32);
    if (!this->goalCatcher_->init()) {
      return false;
    }

    auto goal = std::make_shared<nav2_msgs::action::NavigateToPose::Goal>();
    goal->pose.pose.position.x = 1.0;
    goal->pose.pose.position.y = 1.0;
    this->goalCatcher_->send_goal(goal, this->node_->now());

    const auto deadline = std::chrono::steady_clock::now() + std::chrono::seconds(3);
    while (this->goalCatcher_->isMoving() && std::chrono::steady_clock::now() < deadline) {
      rclcpp::spin_some(this->node_);
    }

    return !this->goalCatcher_->isMoving() && !this->goalCatcher_->isVisited(1.4, 1.0);
  }

  bool autonomousGoalBypassesSentGoalHistoryTest()
  {
    if (!this->goalCatcher_->init()) {
      return false;
    }

    auto firstGoal = std::make_shared<nav2_msgs::action::NavigateToPose::Goal>();
    firstGoal->pose.pose.position.x = 1.0;
    firstGoal->pose.pose.position.y = 1.0;
    this->goalCatcher_->send_goal(firstGoal, this->node_->now());
    const auto firstDeadline = std::chrono::steady_clock::now() + std::chrono::seconds(3);
    while (this->goalCatcher_->isMoving() && std::chrono::steady_clock::now() < firstDeadline) {
      rclcpp::spin_some(this->node_);
    }

    auto nearbyFrontier = std::make_shared<nav2_msgs::action::NavigateToPose::Goal>();
    nearbyFrontier->pose.pose.position.x = 1.1;
    nearbyFrontier->pose.pose.position.y = 1.1;
    this->goalCatcher_->send_goal(nearbyFrontier, this->node_->now(), false);
    rclcpp::spin_some(this->node_);
    const bool submitted = this->goalCatcher_->getSentGoals().size() == 2;

    const auto secondDeadline = std::chrono::steady_clock::now() + std::chrono::seconds(3);
    while (this->goalCatcher_->isMoving() && std::chrono::steady_clock::now() < secondDeadline) {
      rclcpp::spin_some(this->node_);
    }
    return submitted && !this->goalCatcher_->isMoving();
  }

private:
  rclcpp::Node::SharedPtr node_;
  std::shared_ptr<GoalCatcher> goalCatcher_;
};

#endif  // WANDERING__TESTS__DUMMYGOALCATCHER_HPP_
