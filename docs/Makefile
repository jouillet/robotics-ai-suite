# SPDX-FileCopyrightText: (C) 2025 Intel Corporation
# SPDX-License-Identifier: Apache-2.0

.DEFAULT_GOAL := help

.PHONY: help build serve check clean clean-all

SHELL	    := bash -eu -o pipefail

PROJECT_NAME  := robotics-ai-suite-docs
OUT_DIR       := out

$(OUT_DIR):
	mkdir -p $(OUT_DIR)

VENV_DIR     := venv_$(PROJECT_NAME)

$(VENV_DIR): user-guide/requirements.txt
	python3 -m venv $@ ;\
  set +u; . ./$@/bin/activate; set -u ;\
  python -m pip install --upgrade pip ;\
  python -m pip install -r user-guide/requirements.txt

check: | $(VENV_DIR) ## Check for and/or install prerequisite tools

build: sphinx-dirhtml ## Build the Sphinx user guide

serve: $(VENV_DIR) $(OUT_DIR) ## Live-rebuild and serve the Sphinx user guide
	set +u;	. ./$</bin/activate; set -u ;\
	sphinx-autobuild "${SOURCEDIR}" "${OUT_DIR}"

clean: ## Delete Sphinx build artifacts
	rm -rf $(OUT_DIR)

clean-all: clean ## Delete Sphinx build artifacts and tools
	rm -rf $(VENV_DIR)

SPHINXBUILD   := sphinx-build
SOURCEDIR     := user-guide/

sphinx-%: $(VENV_DIR) $(OUT_DIR)
	set +u;	. ./$</bin/activate; set -u ;\
	$(SPHINXBUILD) -M $* "$(SOURCEDIR)" "$(OUT_DIR)" -W

help: ## Print help for each target
	@echo $(PROJECT_NAME) make targets
	@echo "Target               Makefile:Line    Description"
	@echo "-------------------- ---------------- -----------------------------------------"
	@grep -H -n '^[[:alnum:]_-]*:.* ##' $(MAKEFILE_LIST) \
    | sort -t ":" -k 3 \
    | awk 'BEGIN  {FS=":"}; {sub(".* ## ", "", $$4)}; {printf "%-20s %-16s %s\n", $$3, $$1 ":" $$2, $$4};'
