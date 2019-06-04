HTMLPROOFER  = bundle exec htmlproofer
HUGO_THEME   = jaeger-docs
THEME_DIR    := themes/$(HUGO_THEME)
JAEGER_VERSION?=latest


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

# TODO add ingester, collector
.PHONY:gen-commands
gen-commands:
	rm ./content/docs/next-release/jaeger-*
	docker run --rm -it -e SPAN_STORAGE_TYPE=elasticsearch -v "${PWD}/content/docs/next-release:/data" jaegertracing/jaeger-query:${JAEGER_VERSION} docs --format=md --dir=/data
#	add _elasticsaerch suffix to files
	rename '.md' '_elasticsearch.md' ./content/docs/next-release/jaeger-query*
#	change links in files to reflect rename to _elasticsearch
	sed -i -e "s/\.md/_elasticsearch/g" ./content/docs/next-release/jaeger-*.md
	docker run --rm -it -v "${PWD}/content/docs/next-release:/data" jaegertracing/jaeger-query:${JAEGER_VERSION} docs --format=md --dir=/data
	sed -i -e "s/\.md//g" ./content/docs/next-release/jaeger-*.md
#	hugo links have to start with ../
	sed -i -e "s/](/](..\//g" ./content/docs/next-release/jaeger-*.md
