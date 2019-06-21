#!/bin/bash

TOOLS=(jaeger-collector jaeger-query)

for tool in ${TOOLS}; do
    docker run \
        --rm \
        --interactive \
        --volume "${PWD}/data/cli:/data" \
        jaegertracing/${tool}:latest docs \
            --format=yaml \
            --dir=/data
done
