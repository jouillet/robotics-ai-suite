<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# Fuzzing

The fuzzing tests in this directory rely on the Google
[FuzzTest framework](https://github.com/google/fuzztest). They target the
`MapEngine` core algorithms to discover potential edge-case memory safety issues,
integer overflows, and unexpected input crashes.

## CI Workflow

In CI, fuzz testing is executed within the `sdle-evidence.yml` workflow as part
of SDLe compliance evidence generation. It runs automated fuzzing builds across
supported ROS 2 distributions and collects execution artifacts and sanitization
reports.

## Manual Execution

Follow the steps below to execute the fuzz tests manually in a containerized
environment.

### Docker Environment

Use the `eci-fuzzer` container image configured with Clang, FuzzTest, and ROS 2:

```bash
docker pull amr-registry.caas.intel.com/edge-controls/eci-fuzzer:jazzy
```

*(Replace `jazzy` with `humble` if targeting ROS 2 Humble).*

#### Start the Docker Container

Mount the repository workspace and start an interactive session:

```bash
docker run -v "$PWD":/workspace -w /workspace -it --name wandering_fuzzer amr-registry.caas.intel.com/edge-controls/eci-fuzzer:jazzy /bin/bash
```

#### Environment Setup

Source the target ROS 2 environment:

```bash
source /opt/ros/jazzy/setup.bash
```

### Build and Execute Tests

Build the `wandering_app` package with Clang and FuzzTest mode enabled:

```bash
CXX=clang++ colcon build \
  --packages-select wandering_app \
  --cmake-args -DCXX=clang++ -DFUZZTEST_FUZZING_MODE=ON -DBUILD_TESTING=OFF
```

Execute the fuzzing binary with the desired duration:

```bash
./build/wandering_app/fuzz_mapengine --fuzz_for=10s
```

Example output:

```text
[.] Sanitizer coverage enabled. Counter map size: 32117, Cmp map size: 262144
[==========] Running 1 test from 1 test suite.
[----------] Global test environment set-up.
[----------] 1 test from MapEngineTest
[ RUN      ] MapEngineTest.testFunctionsWithInput
FUZZTEST_PRNG_SEED=MvzUJwl4oTsd9xBv-vC8ewJ8QQ82KMKNytmcKhlh2p0
[*] Corpus size:     1 | Edges covered:     53 | Fuzzing time:        665.802us | Total runs:  1.00e+00 | Runs/secs:  1501 | Max stack usage:    14208
[.] Fuzzing timeout set to: 10s
[*] Corpus size:     2 | Edges covered:     54 | Fuzzing time:        749.727us | Total runs:  4.00e+00 | Runs/secs:  5335 | Max stack usage:    14208
...
[.] Fuzzing was terminated.

=================================================================
=== Fuzzing stats

Elapsed time: 10.000113205s
Total runs: 1428514
Edges covered: 59
Total edges: 32117
Corpus size: 7
Max stack used: 14208

[       OK ] MapEngineTest.testFunctionsWithInput (10000 ms)
[----------] 1 test from MapEngineTest (10000 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (10000 ms total)
[  PASSED  ] 1 test.
```

[.] Fuzzing was terminated.

=================================================================
=== Fuzzing stats

Elapsed time: 2.000113205s
Total runs: 286514
Edges covered: 59
Total edges: 32117
Corpus size: 7
Max stack used: 14208

[       OK ] MapEngineTest.testFunctionsWithInput (2000 ms)
[----------] 1 test from MapEngineTest (2000 ms total)

[----------] Global test environment tear-down
[==========] 1 test from 1 test suite ran. (2000 ms total)
[  PASSED  ] 1 test.

```
