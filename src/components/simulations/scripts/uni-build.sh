#!/bin/bash
set -e

# Copyright (C) 2025 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

if [ $# -eq 0 ]; then
  echo "Usage: $0 <ros_distro> [parallel_jobs]"
  echo "Example: $0 humble 4"
  exit 1
fi

ROS_DISTRO_INPUT="$1"
PARALLEL_JOBS="${2:-auto}"

export DEBIAN_FRONTEND=noninteractive
export ROS_DISTRO="${ROS_DISTRO_INPUT}"

if [ "${PARALLEL_JOBS}" = "auto" ]; then
  PARALLEL_JOBS=$(nproc)
fi

export DEB_BUILD_OPTIONS="parallel=${PARALLEL_JOBS} nocheck"
export MAKEFLAGS="-j${PARALLEL_JOBS}"

echo "Building packages for ROS ${ROS_DISTRO_INPUT} with ${PARALLEL_JOBS} parallel jobs"

if [ -f "/opt/ros/${ROS_DISTRO_INPUT}/setup.bash" ]; then
  # shellcheck disable=SC1090
  source "/opt/ros/${ROS_DISTRO_INPUT}/setup.bash"
  echo "ROS ${ROS_DISTRO_INPUT} environment sourced"
fi

git config --global --add safe.directory '*'

echo "Setting up Gazebo repository for ROS: ${ROS_DISTRO_INPUT}"
apt-get update
apt-get install -y lsb-release curl gnupg devscripts equivs

curl --connect-timeout 30 --max-time 60 --retry 3 \
  --output /usr/share/keyrings/pkgs-osrf-archive-keyring.gpg \
  https://packages.osrfoundation.org/gazebo.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/pkgs-osrf-archive-keyring.gpg] https://packages.osrfoundation.org/gazebo/ubuntu-stable $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/gazebo-stable.list > /dev/null
apt-get update

if [ "${ROS_DISTRO_INPUT}" = "humble" ]; then
  apt-get install -y ignition-fortress gz-sim7-cli libgz-sim7 libgz-sim7-dev ros-humble-ros-gz
elif [ "${ROS_DISTRO_INPUT}" = "jazzy" ]; then
  apt-get install -y gz-harmonic gz-sim8-cli libgz-sim8 libgz-sim8-dev ros-jazzy-ros-gz ros-jazzy-gz-sim-vendor
else
  echo "Unsupported ROS distribution: ${ROS_DISTRO_INPUT}"
  exit 1
fi

echo "Installing Debian build dependencies from generated control files"
make debian-build-deps-install

echo "Building Debian packages with CPACK"
make package

OUTPUT_DIR="/tmp/${ROS_DISTRO_INPUT}_simulations_deb_packages"
mkdir -p "${OUTPUT_DIR}"
find build/debian-packages/packages -name "*.deb" -exec cp {} "${OUTPUT_DIR}/" \;

echo "Built packages:"
ls -la "${OUTPUT_DIR}"

echo "All packages built successfully for ROS ${ROS_DISTRO_INPUT}"
