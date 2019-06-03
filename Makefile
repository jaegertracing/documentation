HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)

# TODO use docker
JAEGER=/home/ploffay/projects/golang/src/github.com/jaegertracing/jaeger

develop:
	HUGO_PREVIEW=true \
	hugo server \
        --buildDrafts \
        --buildFuture \
        --disableFastRender

clean:
	rm -rf public

build-content:
	hugo -v

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

.PHONY:gen-commands
gen-commands:
	go run ${JAEGER}/cmd/all-in-one/main.go docs --dir ./content/docs/next-release
	go run ${JAEGER}/cmd/query/main.go docs --dir ./content/docs/next-release
	sed -i -e "s/](/](..\//g" ./content/docs/next-release/jaeger-*.md
	sed -i -e "s/\.md//g" ./content/docs/next-release/jaeger-*.md
