#!/bin/bash

JAEGER_VERSION=$1

if [ -z "$1" ]; then
    echo "You must supply a Jaeger version as the first argument"
    exit 1
fi

TOOLS=(jaeger-collector jaeger-query)

for tool in ${TOOLS[@]}; do
    echo "Generating YAML for ${tool}"

    docker run \
        --rm \
        --interactive \
        --volume "${PWD}/data/cli/${JAEGER_VERSION}:/data" \
        jaegertracing/${tool}:latest docs \
            --format=yaml \
            --dir=/data
done
