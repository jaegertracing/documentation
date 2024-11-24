# Copyright (c) The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0

HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)
HTMLTEST     := htmltest

# generate currently doesn't do anything, but can be useful in the future.
generate:

develop: generate
	HUGO_PREVIEW=true hugo server \
		--buildDrafts \
		--buildFuture \
		--ignoreCache

clean:
	rm -rf public

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
	hugo --logLevel info

link-checker-setup:
	curl https://raw.githubusercontent.com/wjdp/htmltest/master/godownloader.sh | bash

check-links:
	$(HTMLTEST) --conf .htmltest.yml

check-links-older:
	$(HTMLTEST) --conf .htmltest.old-versions.yml

check-links-external:
	$(HTMLTEST) --conf .htmltest.external.yml

check-links-all: check-links check-links-older check-links-external

spellcheck:
	cat scripts/cspell/project-names.txt | grep -v '^#' | grep -v '^\s*$$' | tr ' ' '\n' > scripts/cspell/project-names-parsed.txt
	cd scripts/cspell && ./spellcheck.sh

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
