HUGO_VERSION = 0.37.1
HTMLPROOFER  = bundle exec htmlproofer
NODE_BIN     = node_modules/.bin
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)
GULP         := $(NODE_BIN)/gulp
CONCURRENTLY := $(NODE_BIN)/concurrently
WRITE_GOOD   := $(NODE_BIN)/write-good

macos-setup:
	brew switch hugo $(HUGO_VERSION) && brew link --overwrite hugo
	npm install
	(cd $(THEME_DIR) && npm install)

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

dev:
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
