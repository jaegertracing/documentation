HUGO_VERSION = 0.38
HTMLPROOFER  = bundle exec htmlproofer
NODE_BIN     = node_modules/.bin
HUGO_THEME   = jaeger-docs
#BASE_URL     = https://jaegertracing.netlify.com
THEME_DIR    := themes/$(HUGO_THEME)
GULP         := $(NODE_BIN)/gulp
CONCURRENTLY := $(NODE_BIN)/concurrently
WRITE_GOOD   := $(NODE_BIN)/write-good
NODE_VER     := $(shell node -v | cut -c2- | cut -c1)
GOOD_NODE     := $(shell if [ $(NODE_VER) -ge 4 ]; then echo true; else echo false; fi)

macos-setup: check-node
	scripts/install-hugo.sh $(HUGO_VERSION) macOS
	npm install
	(cd $(THEME_DIR) && npm install)

.PHONY: check-node
check-node:
	@echo Build requires Node 4.x or higher && $(GOOD_NODE)

netlify-setup:
	(cd $(THEME_DIR) && npm install)

clean:
	rm -rf public $(THEME_DIR)/data/assetHashes.json $(THEME_DIR)/static

build-content:
	hugo -v \
		--theme $(HUGO_THEME)

build-assets:
	(cd $(THEME_DIR) && $(GULP) build)

build: clean build-assets build-content

netlify-build: netlify-setup build

dev: check-node
	$(CONCURRENTLY) "make develop-content" "make develop-assets"

develop-content: build-assets
	hugo server \
		--theme $(HUGO_THEME) \
        --buildDrafts \
        --buildFuture \
        --disableFastRender \
        --ignoreCache

develop-assets:
	(cd $(THEME_DIR) && $(GULP) dev)

htmlproofer-setup:
	gem install bundler \
        --no-rdoc \
        --no-ri
	NOKOGIRI_USE_SYSTEM_LIBRARIES=true bundle install \
		--path vendor/bundle

htmlproofer: build
	$(HTMLPROOFER) \
        --empty-alt-ignore \
        public

write-good:
	$(WRITE_GOOD) content/**/*.md
