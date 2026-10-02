# Copyright (C) 2026 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

"""Contracts for the public live-Jackal launch entry points."""

from pathlib import Path


LAUNCH_DIRECTORY = Path(__file__).parents[1] / "launch"


def test_standard_jackal_rviz_reads_namespaced_robot_description():
    """The standard RViz windows use the Clearpath driver's namespaced description."""
    launch_source = (LAUNCH_DIRECTORY / "wandering_jackal.launch.py").read_text(
        encoding="utf-8"
    )

    assert (
        launch_source.count(
            '("/robot_description", [robot_namespace, "/robot_description"])'
        )
        == 2
    )


def test_manual_jackal_forwards_adbscan_selection():
    """Manual navigation preserves the parent launch's ADBSCAN selection."""
    launch_source = (LAUNCH_DIRECTORY / "wandering_jackal_manual_nav.launch.py").read_text(
        encoding="utf-8"
    )

    assert 'DeclareLaunchArgument(\n        "enable_adbscan"' in launch_source
    assert '"enable_adbscan": enable_adbscan' in launch_source
