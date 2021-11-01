HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)

client-libs-docs:
	@for d in $(shell ls -d content/docs/*); do \
		cp content/_client_libs/*.md $$d/; \
		echo "copied content/_client_libs/*.md -> $$d/"; \
	done

generate:	client-libs-docs

develop:	generate
	HUGO_PREVIEW=true hugo server \
        --buildDrafts \
        --buildFuture \
	--ignoreCache

clean:
	rm -rf public

netlify-production-build:	generate
	hugo --minify

netlify-deploy-preview:	generate
	HUGO_PREVIEW=true hugo \
	--buildDrafts \
	--buildFuture \
	--baseURL $(DEPLOY_PRIME_URL) \
	--minify

netlify-branch-deploy:	generate
	hugo \
	--buildDrafts \
	--buildFuture \
	--baseURL $(DEPLOY_PRIME_URL) \
	--minify

build: clean generate
	hugo -v

link-checker-setup:
	curl https://raw.githubusercontent.com/wjdp/htmltest/master/godownloader.sh | bash

run-link-checker:
	bin/htmltest

check-internal-links: clean build link-checker-setup run-link-checker

check-all-links: clean build link-checker-setup
	bin/htmltest --conf .htmltest.external.yml
