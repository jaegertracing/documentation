HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)

develop:
	HUGO_PREVIEW=true \
	hugo server \
        --buildDrafts \
        --buildFuture \
        --disableFastRender

develop-verbose:
	HUGO_PREVIEW=true \
	hugo server \
	--buildDrafts \
	--buildFuture \
	--disableFastRender \
	--verbose \
	--verboseLog

clean:
	rm -rf public

build-content:
	hugo -v --minify

build: clean build-content


htmlproofer-setup:
	gem install bundler
	NOKOGIRI_USE_SYSTEM_LIBRARIES=true bundle install \
	--path vendor/bundle

htmlproofer:
	rm -rf public
	hugo --baseURL "/"
	$(HTMLPROOFER) \
        --empty-alt-ignore \
        public
