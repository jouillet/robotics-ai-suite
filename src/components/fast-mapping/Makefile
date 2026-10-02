# Copyright (C) 2025 Intel Corporation
#
# SPDX-License-Identifier: Apache-2.0

SHELL := bash -eu -o pipefail

COMMIT := $(shell git rev-parse --short HEAD)
DATE := $(shell git log -1 --format=%cd --date=format:"%Y%m%d")
VERSION := $(COMMIT)-$(DATE)

ROOT_DIR:=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))

# Absolute path to the git repository root (needed so super-linter sees .git even when invoked from this component)
REPO_ROOT:=$(shell git rev-parse --show-toplevel 2>/dev/null || echo $(ROOT_DIR))

# Path of this component relative to repo root (used to scope linting with FILTER_REGEX_INCLUDE)
COMPONENT_PATH_REL:=$(shell realpath --relative-to "$(REPO_ROOT)" "$(ROOT_DIR)" 2>/dev/null || echo robotics-ai-suite/components/fast-mapping)

ROS_DISTRO ?= humble

# Map ROS_DISTRO to Ubuntu codename
ifeq ($(ROS_DISTRO),humble)
	UBUNTU_CODENAME := jammy
else
	UBUNTU_CODENAME := noble
endif

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
	MAKE_JOBS ?= $(shell sysctl -n hw.ncpu)
else
	MAKE_JOBS ?= $(shell nproc)
endif

.DEFAULT_GOAL := help
.PHONY: build clean help license-check lint lint-all package test test-e2e test-results source-package debian-build-deps install-debian-build-deps container-package container-test container-debian-build-deps

PROJECT_DEFINITION ?= $(ROOT_DIR)/robotics-project.json
PACKAGE_VERSION_SUFFIX ?=
TEST_SUMMARY ?= $(ROOT_DIR)/testout/test-summary.md
PACKAGE_COMPONENTS := $(shell PROJECT_DEFINITION="$(PROJECT_DEFINITION)" ROOT_DIR="$(ROOT_DIR)" python3 -c 'import json, os, pathlib, re; project = json.loads(pathlib.Path(os.environ["PROJECT_DEFINITION"]).read_text(encoding="utf-8")); components = project.get("ci", {}).get("package_components", []); root = pathlib.Path(os.environ["ROOT_DIR"]) / "src"; valid = project.get("format_version") == 1 and isinstance(components, list) and components and all(isinstance(component, dict) and isinstance(component.get("path"), str) and re.fullmatch(r"[a-z0-9][a-z0-9_-]*", component["path"]) and (root / component["path"]).is_dir() and ("ros_package" not in component or isinstance(component["ros_package"], str) and re.fullmatch(r"[a-z0-9][a-z0-9_]*", component["ros_package"])) for component in components); (_ for _ in ()).throw(SystemExit("Invalid package components in project definition")) if not valid else None; print(",".join(component["path"] for component in components))')
ROS_PACKAGES := $(shell PROJECT_DEFINITION="$(PROJECT_DEFINITION)" python3 -c 'import json, os, pathlib, re; project = json.loads(pathlib.Path(os.environ["PROJECT_DEFINITION"]).read_text(encoding="utf-8")); components = project.get("ci", {}).get("package_components", []); ros_components = [component for component in components if "ros_package" in component]; valid = project.get("format_version") == 1 and isinstance(components, list) and ros_components and all(isinstance(component, dict) and isinstance(component.get("ros_package"), str) and re.fullmatch(r"[a-z0-9][a-z0-9_]*", component["ros_package"]) for component in ros_components); (_ for _ in ()).throw(SystemExit("Invalid ROS packages in project definition")) if not valid else None; print(" ".join(component["ros_package"] for component in ros_components))')
PACKAGE_OUTPUT_DIR = $(ROOT_DIR)/build/debian-packages/packages
BUILD_DEPENDS_OUTPUT_DIR = $(ROOT_DIR)/build/debian-build-deps
MISSING_BUILD_DEPENDENCIES_FILE = $(BUILD_DEPENDS_OUTPUT_DIR)/missing-dependencies.txt
CONTAINER_IMAGE ?= amd64/ros:$(ROS_DISTRO)-ros-base

license-check:
	@# Help: Perform a REUSE license check using docker container https://hub.docker.com/r/fsfe/reuse
	docker run --rm --volume ${ROOT_DIR}:/data fsfe/reuse:5.0.2 lint

package:
	@# Help: Build Debian packages
	command -v ninja >/dev/null || { echo "Error: Ninja is required. Install ninja-build." >&2; exit 1; }
	rm -rf $(ROOT_DIR)/build/debian-packages
	set +u && source /opt/ros/$(ROS_DISTRO)/setup.bash && set -u && \
	cmake -G Ninja -S $(ROOT_DIR) -B $(ROOT_DIR)/build/debian-packages \
		-DROS_DISTRO=$(ROS_DISTRO) \
		-DFASTMAPPING_PACKAGE_OUTPUT_DIR=$(PACKAGE_OUTPUT_DIR) \
		-DFASTMAPPING_PACKAGE_COMPONENTS="$(PACKAGE_COMPONENTS)" \
		-DFASTMAPPING_PACKAGE_VERSION_SUFFIX=$(PACKAGE_VERSION_SUFFIX) && \
	cmake --build $(ROOT_DIR)/build/debian-packages --target package

debian-build-deps:
	@# Help: Generate Debian Build-Depends control files without configuring components
	rm -rf $(BUILD_DEPENDS_OUTPUT_DIR) $(ROOT_DIR)/build/debian-build-deps-config
	cmake -S $(ROOT_DIR) -B $(ROOT_DIR)/build/debian-build-deps-config \
		-DROS_DISTRO=$(ROS_DISTRO) \
		-DFASTMAPPING_PACKAGE_COMPONENTS="$(PACKAGE_COMPONENTS)" \
		-DFASTMAPPING_BUILD_DEPENDS_OUTPUT_DIR=$(BUILD_DEPENDS_OUTPUT_DIR) && \
	cmake --build $(ROOT_DIR)/build/debian-build-deps-config --target debian-build-deps

install-debian-build-deps: debian-build-deps
	@# Help: Install generated Debian Build-Depends with APT
	@command -v mk-build-deps >/dev/null && command -v equivs-build >/dev/null && command -v dpkg-checkbuilddeps >/dev/null || { echo "Error: mk-build-deps, equivs-build, and dpkg-checkbuilddeps are required. Install devscripts, equivs, and dpkg-dev." >&2; exit 1; }
	@apt-get update; \
	install_status=0; \
	for control_file in $(BUILD_DEPENDS_OUTPUT_DIR)/*/debian/control; do \
		mk-build-deps --install --remove \
			--tool 'apt-get --no-install-recommends --no-remove --yes' \
			"$$control_file" || install_status=1; \
	done; \
	: > $(MISSING_BUILD_DEPENDENCIES_FILE); \
	for control_file in $(BUILD_DEPENDS_OUTPUT_DIR)/*/debian/control; do \
		if missing_dependencies="$$(dpkg-checkbuilddeps "$$control_file" 2>&1)"; then \
			continue; \
		fi; \
		printf '%s\n%s\n\n' "$$control_file" "$$missing_dependencies" >> $(MISSING_BUILD_DEPENDENCIES_FILE); \
	done; \
	exit "$$install_status"

build:
	@# Help: Build selected ROS packages with Colcon for local development
	set +u && source /opt/ros/$(ROS_DISTRO)/setup.bash && set -u && \
	colcon build --base-paths $(ROOT_DIR)/src --packages-select $(ROS_PACKAGES) --symlink-install --executor sequential --event-handlers console_direct+

test:
	@# Help: Build & test with Colcon
	set +u && source /opt/ros/$(ROS_DISTRO)/setup.bash && set -u && \
	colcon build --base-paths $(ROOT_DIR)/src --packages-select $(ROS_PACKAGES) --symlink-install --cmake-clean-cache \
		--cmake-args -DBUILD_TESTING=ON --executor sequential --event-handlers console_direct+ && \
	set +u && source $(ROOT_DIR)/install/setup.bash && set -u && \
	colcon test --base-paths $(ROOT_DIR)/src --packages-select $(ROS_PACKAGES) --return-code-on-test-failure --executor sequential --event-handlers console_direct+

test-results:
	@# Help: Summarize Colcon test results
	@mkdir -p "$(dir $(TEST_SUMMARY))"
	python3 .github/scripts/summarize_test_results.py \
		--results-glob 'build/*/test_results/**/*.xml' \
		--ros-distro $(ROS_DISTRO) \
		--summary-file "$(TEST_SUMMARY)"

test-e2e:
	@# Help: Run E2E functional tests
	@command -v Xvfb >/dev/null && command -v gm >/dev/null && python3 -c 'import PIL' >/dev/null 2>&1 || { \
		if command -v apt-get >/dev/null && [ "$$(id -u)" -eq 0 ]; then \
			echo "Installing E2E test dependencies (xvfb, graphicsmagick, python3-pil, python3-pytest)..."; \
			apt-get update -qq && apt-get install -y --no-install-recommends xvfb graphicsmagick python3-pil python3-pytest; \
		fi; \
	}
	set +u && source /opt/ros/$(ROS_DISTRO)/setup.bash && set -u && \
	python3 -m pytest src/fast_mapping/tests/ -v

container-debian-build-deps:
	@# Help: Generate Debian Build-Depends in container
	docker run --rm -t --platform linux/amd64 \
		-v $(ROOT_DIR):/workspace \
		-w /workspace \
		-e ROS_DISTRO=$(ROS_DISTRO) \
		$(CONTAINER_IMAGE) \
		bash -c "source /opt/ros/$(ROS_DISTRO)/setup.bash && make debian-build-deps ROS_DISTRO=$(ROS_DISTRO)"

container-package:
	@# Help: Build Debian package inside ROS container on host
	docker run --rm -t --platform linux/amd64 \
		-v $(ROOT_DIR):/workspace \
		-w /workspace \
		-e ROS_DISTRO=$(ROS_DISTRO) \
		-e PACKAGE_VERSION_SUFFIX=$(PACKAGE_VERSION_SUFFIX) \
		-e DEBIAN_FRONTEND=noninteractive \
		$(CONTAINER_IMAGE) \
		bash -c "apt-get update -qq && apt-get install -y --no-install-recommends cmake ninja-build build-essential devscripts equivs dpkg-dev python3-colcon-common-extensions && \
			source /opt/ros/$(ROS_DISTRO)/setup.bash && \
			make install-debian-build-deps ROS_DISTRO=$(ROS_DISTRO) && \
			make package ROS_DISTRO=$(ROS_DISTRO) PACKAGE_VERSION_SUFFIX=$(PACKAGE_VERSION_SUFFIX)"

container-test:
	@# Help: Build & test with Colcon inside ROS container on host
	docker run --rm -t --platform linux/amd64 \
		-v $(ROOT_DIR):/workspace \
		-w /workspace \
		-e ROS_DISTRO=$(ROS_DISTRO) \
		-e DEBIAN_FRONTEND=noninteractive \
		$(CONTAINER_IMAGE) \
		bash -c "apt-get update -qq && apt-get install -y --no-install-recommends cmake ninja-build build-essential devscripts equivs dpkg-dev python3-colcon-common-extensions && \
			source /opt/ros/$(ROS_DISTRO)/setup.bash && \
			make install-debian-build-deps ROS_DISTRO=$(ROS_DISTRO) && \
			make test ROS_DISTRO=$(ROS_DISTRO)"

lint:
	@# Help: Run all sub-linters using super-linter (using linters defined for this repo only)
	VALIDATE_GITHUB_ACTIONS=true \
	VALIDATE_YAML=true \
	VALIDATE_JSON=true \
	VALIDATE_PYTHON_PYLINT=true \
	VALIDATE_PYTHON_FLAKE8=true \
	VALIDATE_BASH=true \
	VALIDATE_MARKDOWN=true \
	VALIDATE_CLANG_FORMAT=true \
		make lint-all

lint-all:
	@# Help: Run super-linter (mount full repo so .git is present; limit scope to this component)
	docker run --rm --platform linux/amd64 \
		-e SHELL=/bin/bash \
		-e RUN_LOCAL=true \
		--env-file ".github/linters/super-linter.env" \
		-e FILTER_REGEX_INCLUDE="^$(COMPONENT_PATH_REL)/" \
		-e LINTER_RULES_PATH=$(COMPONENT_PATH_REL)/.github/linters \
		$(if $(VALIDATE_GITHUB_ACTIONS),-e VALIDATE_GITHUB_ACTIONS=$(VALIDATE_GITHUB_ACTIONS)) \
		$(if $(VALIDATE_YAML),-e VALIDATE_YAML=$(VALIDATE_YAML)) \
		$(if $(VALIDATE_JSON),-e VALIDATE_JSON=$(VALIDATE_JSON)) \
		$(if $(VALIDATE_PYTHON_PYLINT),-e VALIDATE_PYTHON_PYLINT=$(VALIDATE_PYTHON_PYLINT)) \
		$(if $(VALIDATE_PYTHON_FLAKE8),-e VALIDATE_PYTHON_FLAKE8=$(VALIDATE_PYTHON_FLAKE8)) \
		$(if $(VALIDATE_BASH),-e VALIDATE_BASH=$(VALIDATE_BASH)) \
		$(if $(VALIDATE_MARKDOWN),-e VALIDATE_MARKDOWN=$(VALIDATE_MARKDOWN)) \
		$(if $(VALIDATE_CLANG_FORMAT),-e VALIDATE_CLANG_FORMAT=$(VALIDATE_CLANG_FORMAT)) \
		-v $(REPO_ROOT):/tmp/lint \
			ghcr.io/super-linter/super-linter:slim-v8.1.0

lint-clang:
	@# Help: Run clang linter using super-linter
	VALIDATE_CLANG_FORMAT=true make lint-all

lint-python:
	@# Help: Run Python linter using super-linter
	VALIDATE_PYTHON_PYLINT=true VALIDATE_PYTHON_FLAKE8=true make lint-all

lint-yaml:
	@# Help: Run YAML linter using super-linter
	VALIDATE_YAML=true make lint-all

lint-githubactions:
	@# Help: Run Github Actions linter using super-linter
	VALIDATE_GITHUB_ACTIONS=true make lint-all

lint-bash:
	@# Help: Run Bash linter using super-linter
	VALIDATE_BASH=true make lint-all

lint-markdown:
	@# Help: Run Markdown linter using super-linter
	VALIDATE_MARKDOWN=true make lint-all

lint-json:
	@# Help: Run JSON linter using super-linter
	VALIDATE_JSON=true make lint-all

clean:
	@# Help: Remove local build, install, log, test, and package artifacts
	rm -rf $(ROOT_DIR)/build $(ROOT_DIR)/install $(ROOT_DIR)/log $(ROOT_DIR)/testout *.deb *.buildinfo *.changes 2>/dev/null || \
	docker run --rm -v $(ROOT_DIR):/workspace amd64/ros:$(ROS_DISTRO)-ros-base rm -rf /workspace/build /workspace/install /workspace/log /workspace/testout

source-package:
	@# Help: Create source package tarball
	git archive --format=zip -o fast-mapping-$(VERSION).zip HEAD \
		.bdsignore.all .gitattributes .gitignore CMakeLists.txt Makefile package.xml README.md REUSE.toml \
		.github/linters dependencies docs include launch LICENSES src tests \
		humble jazzy

help:
	@printf "%-20s %s\n" "Target" "Description"
	@printf "%-20s %s\n" "------" "-----------"
	@grep -E '^[a-zA-Z0-9_%-]+:|^[[:space:]]+@# Help:' Makefile | \
	awk '\
		/^[a-zA-Z0-9_%-]+:/ { \
			target = $$1; \
			sub(":", "", target); \
		} \
		/^[[:space:]]+@# Help:/ { \
			if (target != "") { \
				help_line = $$0; \
				sub("^[[:space:]]+@# Help: ", "", help_line); \
				printf "%-20s %s\n", target, help_line; \
				target = ""; \
			} \
		}' | sort -k1,1
