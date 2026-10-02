// Copyright (C) 2026 Intel Corporation
// SPDX-License-Identifier: Apache-2.0

#ifndef WANDERING_APP__WANDERING_CONTROL_PANEL_HPP_
#define WANDERING_APP__WANDERING_CONTROL_PANEL_HPP_

#include <memory>

#include <QLabel>
#include <QPushButton>

#include "rclcpp/rclcpp.hpp"
#include "rviz_common/panel.hpp"
#include "std_msgs/msg/bool.hpp"

namespace wandering_app
{

class WanderingControlPanel : public rviz_common::Panel
{
  Q_OBJECT

public:
  explicit WanderingControlPanel(QWidget * parent = nullptr);
  void onInitialize() override;

private Q_SLOTS:
  void activateManualMode();
  void activateAutonomousMode();

private:
  void publishPauseCommand(bool pause);

  QLabel * state_label_{nullptr};
  QPushButton * pause_button_{nullptr};
  QPushButton * resume_button_{nullptr};
  rclcpp::Publisher<std_msgs::msg::Bool>::SharedPtr pause_publisher_;
};

}  // namespace wandering_app

#endif  // WANDERING_APP__WANDERING_CONTROL_PANEL_HPP_