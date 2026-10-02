<!--
Copyright (C) 2026 Intel Corporation

SPDX-License-Identifier: Apache-2.0
-->

# `wandering_app`

`wandering_app` is the autonomous frontier-exploration application package for
the `wandering` workspace. It processes 2D occupancy grids or Nav2 costmaps to
identify unexplored frontiers and dispatches navigation goals to Nav2 via the
`NavigateToPose` action interface.

The package also includes the **Wandering Control** RViz panel plugin, enabling
operators to toggle between autonomous wandering and manual navigation modes.

## Package contents and structure

```
wandering_app/
├── CMakeLists.txt
├── package.xml
├── wandering_rviz_plugins.xml          # Pluginlib export for the RViz panel
├── include/
│   ├── utils.h                         # Utility functions and helpers
│   └── wandering_app/
│       ├── GoalCatcher.h               # Nav2 action client and goal state tracking
│       ├── MapEngine.h                 # Frontier exploration and costmap analysis engine
│       ├── WanderingControlPanel.hpp   # RViz control panel Qt widget
│       └── WanderingMapper.h           # Top-level node managing exploration cycles
├── src/
│   ├── GoalCatcher.cpp
│   ├── main.cpp                        # Entry point for the wandering node
│   ├── MapEngine.cpp
│   ├── utils.cpp
│   ├── wandering_control_panel.cpp
│   └── WanderingMapper.cpp
├── behavior_trees/
│   └── spin360.xml                     # Custom Nav2 behavior tree definition
├── param/                              # Application and platform parameter presets
│   ├── aaeon_node_params.yaml
│   ├── depth_scan.yaml
│   └── gazebo_nav.param.yaml
├── launch/                             # Standalone and legacy platform launch files
│   ├── aaeon_sl_node_launch.py
│   ├── aaeon_wander_integrated.launch.py
│   ├── gazebo_wander.launch.py
│   ├── rtabmap.launch.py
│   ├── rtabmap_gazebo.launch.py
│   ├── rtabmap_infra_only.launch.py
│   └── standalone_wander.launch.py
└── tests/                              # Unit, integration, and fuzz testing suite
    ├── dummyactionserver.hpp
    ├── dummygoalcatcher.hpp
    ├── mapenginetest.hpp
    ├── test_goalcatcher.cpp
    ├── test_inputs.cpp
    ├── test_invalid_param.py
    ├── test_mapengine.cpp
    ├── test_mapper_cycle.cpp
    ├── inputs/
    └── fuzzing/
```

## Architecture and components

### `wandering` executable (`WanderingMapper`)

The primary node (`wandering_mapper`) orchestrates the exploration lifecycle:

1. **Map processing (`MapEngine`):** Subscribes to `/map` or
   `/global_costmap/costmap` (`nav_msgs/msg/OccupancyGrid`). It builds an
   internal costmap representation, tracks previously visited cells, checks
   coverage statistics, and selects candidate frontier coordinates.
2. **Goal dispatch (`GoalCatcher`):** Sends `nav2_msgs/action/NavigateToPose`
   goals to the Nav2 action server. It monitors navigation progress, detects
   stalls or blocked goals, and prevents re-visiting already explored areas.
3. **Control and coordination:** Listens to pause/resume commands on
   `/pause_wandering` (`std_msgs/msg/Bool`), handles initial exploratory
   rotations, and listens to the TF tree to track robot localization.

### RViz control panel (`wandering_rviz_panel`)

A pluginlib-based RViz panel providing:

* **Manual mode:** Pauses autonomous frontier goal dispatching and cancels any
  active wandering goal, allowing operators to use RViz navigation tools (such
  as Nav2 Goal).
* **Autonomous mode:** Resumes frontier search and dispatches exploration goals.

## Interfaces

### Subscribed topics

| Topic | Type | Description |
| :--- | :--- | :--- |
| `/global_costmap/costmap` | `nav_msgs/msg/OccupancyGrid` | Global costmap used for frontier extraction (when `use_costmap:=true`). |
| `/map` | `nav_msgs/msg/OccupancyGrid` | SLAM occupancy grid used when costmap mode is disabled. |
| `/pause_wandering` | `std_msgs/msg/Bool` | Signal to pause or resume autonomous exploration goal generation. |
| `/initialpose` | `geometry_msgs/msg/PoseStamped` | External pose updates or repositioning triggers. |
| `/tf`, `/tf_static` | `tf2_msgs/msg/TFMessage` | Robot coordinate frame transformations (`map` to `base_link`). |

### Action clients

| Action | Type | Description |
| :--- | :--- | :--- |
| `navigate_to_pose` | `nav2_msgs/action/NavigateToPose` | Nav2 navigation action server for goal dispatching and tracking. |

## Key parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `use_costmap` | `bool` | `true` | Use `/global_costmap/costmap` instead of raw SLAM `/map`. |
| `robot_radius` | `double` | `0.3` | Inscribed radius of the robot in metres. |
| `transform_tolerance` | `double` | `0.5` | Allowed TF lookup latency in seconds. |
| `global_frame` | `string` | `map` | Reference world/map frame for navigation goals. |
| `robot_base_frame` | `string` | `base_link` | Robot base frame. |
| `occupancy_grid_topic` | `string` | `map` | Topic name when subscribing to standard occupancy grids. |
| `cost_map_topic` | `string` | `global_costmap/costmap` | Topic name when subscribing to global costmaps. |
| `enable_initial_rotation` | `bool` | `true` | Perform a 360-degree rotation on startup to prime SLAM. |
| `use_sim_time` | `bool` | `false` | Synchronize time against `/clock` in simulation environments. |

## Testing and verification

The package includes comprehensive unit and integration tests:

```bash
# Run unit and launch tests
colcon test --packages-select wandering_app --event-handlers console_direct+

# Check test results
colcon test-result --verbose
```

For fuzz testing details on `MapEngine`, refer to [tests/fuzzing/README.md](tests/fuzzing/README.md).
