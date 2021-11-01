HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)

VERSION_DIRS = $(shell ls -d content/docs/*)

client-libs:
	@for d in $(VERSION_DIRS); do \
		echo $$d; \
	done

develop:
	HUGO_PREVIEW=true hugo server \
        --buildDrafts \
        --buildFuture \
	--ignoreCache

clean:
	rm -rf public

netlify-production-build:
	hugo --minify

netlify-deploy-preview:
	HUGO_PREVIEW=true hugo \
	--buildDrafts \
	--buildFuture \
	--baseURL $(DEPLOY_PRIME_URL) \
	--minify

netlify-branch-deploy:
	hugo \
	--buildDrafts \
	--buildFuture \
	--baseURL $(DEPLOY_PRIME_URL) \
	--minify

build: clean
	hugo -v

link-checker-setup:
	curl https://raw.githubusercontent.com/wjdp/htmltest/master/godownloader.sh | bash

run-link-checker:
	bin/htmltest

check-internal-links: clean build link-checker-setup run-link-checker

check-all-links: clean build link-checker-setup
	bin/htmltest --conf .htmltest.external.yml
