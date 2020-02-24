HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)

develop:
	HUGO_PREVIEW=true \
	hugo server \
        --buildDrafts \
        --buildFuture \
	--ignoreCache

clean:
	rm -rf public

build-content:
	hugo -v

build: clean build-content

link-checker-setup:
	curl https://htmltest.wjdp.uk | bash

run-link-checker:
	bin/htmltest

check-internal-links: clean build link-checker-setup run-link-checker

check-all-links: clean build link-checker-setup
	bin/htmltest --conf .htmltest.external.yml
