#!/bin/bash

# Copyright (C) 2023 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

set -e

# shellcheck disable=SC2329 # invoked via trap
cleanup() {
    echo "$pidlist"
    for pid in $pidlist; do
        if ps -p "$pid" > /dev/null; then
            children=$(pstree -A -p "$pid" | grep -Eow "[0-9]+")
            for child in $children; do
                if ps -p "$child" > /dev/null; then
                    kill "$child"
                fi
            done
        fi
    done

    exit "$exitcode"
}

trap cleanup EXIT

# Remove any stale capture so the test can only pass on freshly captured data
rm -f topic.dump

tar -xzf data/rosbag.tar.gz

ros2 launch pointcloud_groundfloor_segmentation realsense_groundfloor_segmentation_launch.py standalone:=True &
pidlist="$!"

sleep 2

ros2 topic echo /segmentation/labeled_points --once > topic.dump &
pidlist="${pidlist} $!"

sleep 2

ros2 bag play rosbag2_2023_12_15-12_09_45/
pidlist="${pidlist} $!"
exitcode=2

# `ros2 topic echo` prints a "does not appear to be published" warning (and no
# message) when nothing is captured, so require an actual PointCloud2 message.
if grep -q "does not appear to be published" topic.dump || ! grep -q "^header:" topic.dump ; then
    echo "Test failed, no ROS output from node"
    exitcode=1
    exit 1
else
    echo "Test passed"
    exitcode=0
    exit 0
fi