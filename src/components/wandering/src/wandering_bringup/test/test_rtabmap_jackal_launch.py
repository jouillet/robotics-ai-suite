# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Contract tests for the Jackal RTAB-Map launch interface."""

import importlib.util
from pathlib import Path

from launch.actions import DeclareLaunchArgument


def test_rtabmap_jackal_exposes_parent_launch_arguments():
    """The parent Jackal launch can configure RTAB-Map without environment state."""
    launch_file = Path(__file__).parents[1] / "launch" / "dep_rtabmap_jackal.launch.py"
    spec = importlib.util.spec_from_file_location("dep_rtabmap_jackal", launch_file)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    module.get_package_share_directory = lambda package: f"/share/{package}"

    description = module.generate_launch_description()
    arguments = {
        action.name for action in description.entities if isinstance(action, DeclareLaunchArgument)
    }

    assert {
        "aligned_depth_topic",
        "camera_namespace",
        "database_path",
        "rgb_camera_info_topic",
        "rgb_image_topic",
        "robot_namespace",
    } <= arguments
