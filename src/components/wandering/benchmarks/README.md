<!--
Copyright (C) 2026 Intel Corporation
SPDX-License-Identifier: Apache-2.0
-->

# Performance Benchmarks

This directory contains standalone Google Benchmark workloads. They are not
CTest tests and are excluded from standard correctness gates because runtime
measurements depend on host state.

Build the workloads and perform a short validation run:

```bash
ROS_DISTRO=jazzy make benchmark-check
```

Run the complete suite with five repetitions and write JSON results to
`testout/benchmarks`:

```bash
ROS_DISTRO=jazzy make benchmark-run
```

Each feature directory owns its source, fixtures, inputs, and CMake target.
Add shared helpers under `benchmarks/common` only after they are used by more
than one workload.
