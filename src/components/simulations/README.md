<!--
Copyright (C) 2025 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# Simulations

## Documentation

Comprehensive documentation on this component is available here: [dev guide](https://developer.robotics.intel.com/development-stack/software_references/amr/simulation/).

## Overview

A collection of ROS 2 simulation packages and tutorials for robotics applications, including TurtleSim tutorials, RealSense camera simulations, and Pick & Place demonstrations using Gazebo. These simulations provide a comprehensive environment for testing and developing autonomous mobile robot (AMR) applications.

## Get Started

### System Requirements

Prepare the target system following the [official documentation](https://developer.robotics.intel.com/development-stack/platform_foundation/getting_started/).

### Build

To build ROS packages natively for local development, export `ROS_DISTRO` and run `make build`.

To build Debian packages natively with CPACK:
1. Install generated build dependencies.
2. Build packages with `make package`.

After packaging finishes, Debian packages are available in `build/debian-packages/packages/`. The following commands are an example for Jazzy.

```bash
ROS_DISTRO=jazzy make build
ROS_DISTRO=jazzy make install-debian-build-deps
ROS_DISTRO=jazzy make package
```

You can list all built packages:

```bash
ls build/debian-packages/packages/*.deb
```

Notes:
- Package names and versions come from package CMake metadata and distro-specific `src/<package>/<distro>/debian/changelog` files.
- `*build-deps*.deb` packages are generated only to satisfy build dependencies and are not runtime deliverables.

To clean all build artifacts:

```bash
make clean
```

### Install

If Ubuntu 22.04 with Humble is used, then run

```bash
source /opt/ros/humble/setup.bash
```

If Ubuntu 24.04 with Jazzy is used, then run

```bash
source /opt/ros/jazzy/setup.bash
```

Finally, install the Debian packages that were built via ``make package``:

```bash
sudo apt update
cd build/debian-packages/packages/
sudo apt install ./*.deb
```

### Test

To run unit tests (implemented with ``colcon``) execute the below command with target ``ROS_DISTRO`` (example for Jazzy):

```bash
ROS_DISTRO=jazzy make test
```

### Development

There is a set of prepared Makefile targets to speed up the development.

In particular, use the following Makefile target to run code linters.

```bash
make lint
```

Alternatively, you can run linters individually.

```bash
make lint-bash
make lint-clang
make lint-githubactions
make lint-json
make lint-markdown
make lint-python
make lint-yaml
```

To run license compliance validation:

```bash
make license-check
```

To see a full list of available Makefile targets:

```bash
make help
```

Commonly used targets:

```text
build                        Build selected ROS packages with Colcon
debian-build-deps            Generate Debian Build-Depends control files
install-debian-build-deps    Install generated Debian Build-Depends
package                      Build Debian packages with CPack
test                         Build and run tests with Colcon
test-results                 Summarize Colcon test results to testout/test-summary.md
container-package            Build Debian packages in container
container-test               Build and run tests in container
clean                        Remove local build/install/log/test/package artifacts
help                         Print all available targets
```

## Usage

The simulations component provides several simulation packages and tutorials:

### TurtleSim Tutorial

Basic ROS 2 tutorial using TurtleSim for learning ROS 2 concepts and testing simple robot behaviors.

### RealSense2 Tutorial

Simulation environment for Intel RealSense depth cameras, allowing testing of perception and vision-based applications without physical hardware.

### Pick & Place Simulation

Complete Pick & Place demonstration in Gazebo simulation environment, including:
- Robot configuration packages
- Custom Gazebo plugins for robotic manipulation
- Pick & Place task implementation

These simulations can be launched individually or combined depending on your testing requirements. Refer to the individual package documentation and launch files for specific usage instructions.

## License

simulations is licensed under [Apache 2.0 License](./LICENSES/Apache-2.0.txt).
