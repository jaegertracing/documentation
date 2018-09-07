HUGO_VERSION = 0.43
HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)

macos-setup:
	scripts/install-hugo.sh $(HUGO_VERSION) macOS

clean:
	rm -rf public

build-content:
	hugo -v

build: clean build-content

develop:
	hugo server \
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

htmlproofer:
	rm -rf public
	hugo --baseURL "/"
	$(HTMLPROOFER) \
        --empty-alt-ignore \
        public
