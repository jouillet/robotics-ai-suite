# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Contract tests for the scan-only ADBSCAN simulation test launch."""

import importlib.util
from pathlib import Path

from launch.actions import DeclareLaunchArgument, ExecuteProcess, SetEnvironmentVariable


def test_simulation_launch_exposes_robot_integration_arguments():
    """Customers can connect either an included or external robot simulator."""
    launch_file = (
        Path(__file__).parents[1] / "launch" / "test_wandering_adbscan_scanonly_sim.launch.py"
    )
    spec = importlib.util.spec_from_file_location(
        "test_wandering_adbscan_scanonly_sim", launch_file
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.get_package_share_directory = lambda package: f"/share/{package}"

    description = module.generate_launch_description()
    arguments = {
        action.name for action in description.entities if isinstance(action, DeclareLaunchArgument)
    }

    assert {
        "adbscan_params_file",
        "cloud_topic",
        "fusion_params_file",
        "namespace",
        "params_file",
        "robot_model",
        "scan_topic",
        "simulator_launch_file",
        "start_simulator",
        "start_wandering",
        "use_sim_time",
    } <= arguments

    robot_model_declaration = next(
        action
        for action in description.entities
        if isinstance(action, DeclareLaunchArgument) and action.name == "robot_model"
    )
    turtlebot_model_environment = [
        action for action in description.entities if isinstance(action, SetEnvironmentVariable)
    ][-1]
    assert description.entities.index(robot_model_declaration) < description.entities.index(
        turtlebot_model_environment
    )


def test_headless_fixture_supervises_gazebo_directly():
    """The headless test fixture must not leave Gazebo behind after its parent exits."""
    launch_file = Path(__file__).parents[1] / "launch" / "test_turtlebot3_headless.launch.py"
    spec = importlib.util.spec_from_file_location("test_turtlebot3_headless", launch_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.get_package_share_directory = lambda package: f"/share/{package}"
    module.get_package_prefix = lambda package: f"/prefix/{package}"

    description = module.generate_launch_description()
    launch_source = launch_file.read_text()

    assert any(isinstance(action, ExecuteProcess) for action in description.entities)
    assert 'cmd=["ruby", gz_executable, "sim"' in launch_source
    assert "gz_sim.launch.py" not in launch_source
    assert any(
        isinstance(action, DeclareLaunchArgument) and action.name == "use_sim_time"
        for action in description.entities
    )
