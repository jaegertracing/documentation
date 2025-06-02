# Copyright (c) The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0
#
# cSpell:ignore htmltest refcache

DEPLOY_PRIME_URL ?= http://localhost
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)
HTMLTEST     ?= htmltest
HTMLTEST_DIR ?= tmp/.htmltest

# generate currently doesn't do anything, but can be useful in the future.
generate:

develop: generate
	HUGO_PREVIEW=true hugo server \
		--buildDrafts \
		--buildFuture \
		--ignoreCache

clean:
	rm -rf public/*

netlify-production-build: generate
	hugo --minify

netlify-deploy-preview:	generate
	HUGO_PREVIEW=true hugo \
	--buildDrafts \
	--buildFuture \
	--baseURL $(DEPLOY_PRIME_URL) \
	--minify

netlify-branch-deploy: generate
	hugo \
	--buildDrafts \
	--buildFuture \
	--baseURL $(DEPLOY_PRIME_URL) \
	--minify

build: clean generate
	hugo --cleanDestinationDir -e dev -DFE --logLevel info

link-checker-setup:
	curl https://raw.githubusercontent.com/wjdp/htmltest/master/godownloader.sh | bash

check-links:
	$(HTMLTEST) --conf .htmltest.yml

check-links-older:
	$(HTMLTEST) --log-level 1 --conf .htmltest.old-versions.yml

# Use --keep-going to ensure that the refcache gets saved even if there are
# link-checking errors.
check-links-external:
	$(MAKE) --keep-going _restore-refcache _check-links-external _save-refcache

_restore-refcache:
	mkdir -p $(HTMLTEST_DIR)
	cp data/refcache.json $(HTMLTEST_DIR)/refcache.json

_check-links-external:
	$(HTMLTEST) --log-level 1 --conf .htmltest.external.yml

_save-refcache:
	@echo "Saving refcache.json to data/refcache.json"
	jq . $(HTMLTEST_DIR)/refcache.json > data/refcache.json

check-links-all: check-links check-links-older check-links-external

.cspell/project-names.g.txt: .cspell/project-names-src.txt
	cat .cspell/project-names-src.txt | grep -v '^#' | grep -v '^\s*$$' | tr ' ' '\n' > .cspell/project-names.g.txt

spellcheck: .cspell/project-names.g.txt
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
