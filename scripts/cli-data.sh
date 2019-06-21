#!/bin/bash

TOOLS=(jaeger-query)

for tool in ${TOOLS}; do
    docker run \
        --rm \
        --interactive \
        --volume "${PWD}/data/cli:/data" \
        jaegertracing/jaeger-query:latest docs \
            --format=yaml \
            --dir=/data
done

