HUGO_VERSION = 0.43
HTMLPROOFER  = bundle exec htmlproofer
NODE_BIN     = node_modules/.bin
HUGO_THEME   = jaeger-docs
BASE_URL     = https://www.jaegertracing.io
THEME_DIR    := themes/$(HUGO_THEME)

macos-setup:
	scripts/install-hugo.sh $(HUGO_VERSION) macOS

clean:
	rm -rf public

build-content:
	hugo -v \
	--theme $(HUGO_THEME) \
        --baseURL $(BASE_URL)

build-content-preview:
	hugo -v \
	--theme $(HUGO_THEME)

build: clean build-content

build-preview: clean build-content-preview

develop:
	hugo server \
	--theme $(HUGO_THEME) \
        --buildDrafts \
        --buildFuture \
        --disableFastRender \
        --ignoreCache

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
