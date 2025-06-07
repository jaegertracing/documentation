# Copyright (c) The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0
#
# cSpell:ignore refcache

HTMLTEST     ?= htmltest
HTMLTEST_DIR ?= tmp/.htmltest

# Use $(HTMLTEST) in PATH, if available; otherwise, we'll get a copy
ifeq (, $(shell which $(HTMLTEST)))
override HTMLTEST=$(HTMLTEST_DIR)/bin/htmltest
ifeq (, $(shell which $(HTMLTEST)))
GET_LINK_CHECKER_IF_NEEDED=get-link-checker
endif
endif

# generate currently doesn't do anything, but can be useful in the future.
generate:

develop: generate
	npm run serve

clean:
	rm -rf $(HTMLTEST_DIR) public/* resources

get-link-checker:
	rm -Rf $(HTMLTEST_DIR)/bin
	curl https://raw.githubusercontent.com/wjdp/htmltest/master/godownloader.sh \
		| bash -s -- -b $(HTMLTEST_DIR)/bin

# Use --keep-going to ensure that the refcache gets saved even if there are
# link-checking errors.
check-links: $(GET_LINK_CHECKER_IF_NEEDED)
	$(MAKE) --keep-going GET_LINK_CHECKER_IF_NEEDED= \
		_restore-refcache _check-links _save-refcache

_restore-refcache:
	mkdir -p $(HTMLTEST_DIR)
	cp data/refcache.json $(HTMLTEST_DIR)/refcache.json

_check-links:
	$(HTMLTEST) --log-level 1 --conf .htmltest.yml

_save-refcache:
	@echo "Saving refcache.json to data/refcache.json"
	jq . $(HTMLTEST_DIR)/refcache.json > data/refcache.json

check-links-all: check-links check-links-older

check-links-older: $(GET_LINK_CHECKER_IF_NEEDED)
	$(HTMLTEST) --log-level 1 --conf .htmltest.old-versions.yml

check-links-internal:
	$(HTMLTEST) --log-level 1 --skip-external --conf .htmltest.yml

.cspell/project-names.g.txt: .cspell/project-names-src.txt
	cat .cspell/project-names-src.txt | grep -v '^#' | grep -v '^\s*$$' | tr ' ' '\n' > .cspell/project-names.g.txt

_spellcheck: .cspell/project-names.g.txt
	./scripts/spellcheck.sh

fetch-blog-feed:
	curl -s -o assets/data/medium.xml https://medium.com/feed/jaegertracing

fetch-roadmap:
	python3 scripts/generate_roadmap.py

# only x.y.0 semver values are valid for kicking off a new release.
SEMVER_REGEX := ^([0-9]+\.){2}0$$
VALID_VERSION := $(shell echo "$(VERSION)" | grep -E "$(SEMVER_REGEX)")

ifneq "$(VALID_VERSION)" "$(VERSION)"
validate-version:
	@echo "ERROR: Invalid VERSION=$(VERSION). Must be in format x.y.0."
	@false  # Exit with an error code
else
validate-version:
	@echo "VERSION=$(VERSION) is valid."
endif

# `make start-release VERSION=x.y.0
start-release: validate-version
	git tag release-$(VERSION)
	git push upstream release-$(VERSION)
