# Copyright (C) 2026 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

import pytest
import rclpy


@pytest.fixture(scope="session")
def ros_context():
    rclpy.init()
    try:
        yield
    finally:
        if rclpy.ok():
            rclpy.shutdown()
