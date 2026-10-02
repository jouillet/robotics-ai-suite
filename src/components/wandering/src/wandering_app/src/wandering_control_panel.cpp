// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#include "wandering_app/WanderingControlPanel.hpp"

#include <QVBoxLayout>

#include "pluginlib/class_list_macros.hpp"
#include "rviz_common/display_context.hpp"
#include "rviz_common/ros_integration/ros_node_abstraction_iface.hpp"

namespace wandering_app
{

WanderingControlPanel::WanderingControlPanel(QWidget * parent) : rviz_common::Panel(parent)
{
  auto * layout = new QVBoxLayout(this);

  state_label_ = new QLabel("Autonomous exploration is initializing", this);
  pause_button_ = new QPushButton("Manual mode", this);
  resume_button_ = new QPushButton("Autonomous mode", this);

  pause_button_->setToolTip("Stop autonomous exploration and cancel its active goal");
  resume_button_->setToolTip("Resume autonomous exploration and frontier selection");

  layout->addWidget(state_label_);
  layout->addWidget(pause_button_);
  layout->addWidget(resume_button_);

  connect(pause_button_, &QPushButton::clicked, this, &WanderingControlPanel::activateManualMode);
  connect(
    resume_button_, &QPushButton::clicked, this, &WanderingControlPanel::activateAutonomousMode);
}

void WanderingControlPanel::onInitialize()
{
  const auto node_abstraction = getDisplayContext()->getRosNodeAbstraction().lock();
  if (!node_abstraction) {
    state_label_->setText("RViz ROS node is unavailable");
    pause_button_->setEnabled(false);
    resume_button_->setEnabled(false);
    return;
  }

  pause_publisher_ = node_abstraction->get_raw_node()->create_publisher<std_msgs::msg::Bool>(
    "/wander/pause_wandering", rclcpp::QoS(1));
  state_label_->setText("Autonomous exploration running");
}

void WanderingControlPanel::activateManualMode() { publishPauseCommand(true); }

void WanderingControlPanel::activateAutonomousMode() { publishPauseCommand(false); }

void WanderingControlPanel::publishPauseCommand(bool pause)
{
  if (!pause_publisher_) {
    state_label_->setText("Exploration control is unavailable");
    return;
  }

  std_msgs::msg::Bool command;
  command.data = pause;
  pause_publisher_->publish(command);
  state_label_->setText(
    pause ? "Manual mode: select Nav2 goals in the map" : "Autonomous exploration running");
}

}  // namespace wandering_app

PLUGINLIB_EXPORT_CLASS(wandering_app::WanderingControlPanel, rviz_common::Panel)