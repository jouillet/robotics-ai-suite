# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Contract tests for the Jackal Nav2 launch interface."""

import importlib.util
from pathlib import Path

from launch.actions import DeclareLaunchArgument


def test_navigation_jackal_exposes_robot_namespace_argument():
    """The parent Jackal launch can configure Nav2 without an environment variable."""
    launch_file = Path(__file__).parents[1] / "launch" / "dep_navigation_jackal.launch.py"
    spec = importlib.util.spec_from_file_location("dep_navigation_jackal", launch_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.get_package_share_directory = lambda package: f"/share/{package}"

    description = module.generate_launch_description()
    arguments = {
        action.name for action in description.entities if isinstance(action, DeclareLaunchArgument)
    }

    assert "robot_namespace" in arguments
