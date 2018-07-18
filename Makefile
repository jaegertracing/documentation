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
<<<<<<< HEAD
	--theme $(HUGO_THEME) \
        --baseURL $(BASE_URL)

build-content-preview:
	hugo -v \
	--theme $(HUGO_THEME)
=======
        --baseURL $(BASE_URL)

build-content-preview:
	hugo -v

build-assets: check-node
	(cd $(THEME_DIR) && $(GULP) build)

build: clean build-assets build-content
>>>>>>> 60cc1b7... Fix broken build (#106)

build: clean build-content

build-preview: clean build-content-preview

develop:
	hugo server \
<<<<<<< HEAD
	--theme $(HUGO_THEME) \
=======
>>>>>>> 60cc1b7... Fix broken build (#106)
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
