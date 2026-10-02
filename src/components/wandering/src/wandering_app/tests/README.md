<!--
Copyright (C) 2026 Intel Corporation
SPDX-License-Identifier: Apache-2.0
-->

# Wandering App Test Suite

This directory contains the unit, integration, and contract tests for the `wandering_app` package.

## Overview of Tests

- **`test_mapengine.cpp`** (GTest): Validates core MapEngine occupancy grid evaluation, frontier exploration scoring, and goal generation algorithms.
- **`test_goalcatcher.cpp`** (GTest): Tests goal status tracking, Nav2 action client interactions, and navigation goal lifecycle management.
- **`test_inputs.cpp`** (GTest): Tests input validation, costmap parsing boundaries, and edge cases.
- **`test_mapper_cycle.cpp`** (GTest): Bounded component test validating costmap ingestion, TF-based mapper initialization, and autonomous Nav2 goal submission.
- **`test_invalid_param.py`** (pytest): Verifies launch argument parsing, constraint enforcement, and rejection of invalid runtime configurations.
- **`fuzzing/`** (Google FuzzTest): Continuous fuzzing harness targeting the MapEngine component. See [fuzzing/README.md](fuzzing/README.md) for execution instructions.

## Running the Tests

### Via Colcon (Recommended)

From the workspace root, run all tests for `wandering_app`:

```bash
colcon test --packages-select wandering_app --event-handlers console_direct+
```

To display detailed test results:

```bash
colcon test-result --all --verbose
```

### Via CTest Directly

After building the package in the workspace, navigate to the build output directory and run specific tests:

```bash
cd build/wandering_app
ctest -V -R test_goalcatcher
ctest -V -R test_mapengine
ctest -V -R test_mapper_cycle
ctest -V -R test_inputs
ctest -V -R test_invalid_param
```
