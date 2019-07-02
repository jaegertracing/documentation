#!/bin/bash

JAEGER_VERSION=$1
NEXT_RELEASE_CLI_DIR=data/cli/next-release

if [ -z "$1" ]; then
    echo "You must supply a Jaeger version as the first argument"
    exit 1
fi

TOOLS=(jaeger-collector jaeger-query)

for tool in ${TOOLS[@]}; do
    echo "Generating YAML for ${tool} for version ${JAEGER_VERSION} of Jaeger"

    volume=${PWD}/data/cli/${JAEGER_VERSION}:/data
    docker_image=jaegertracing/${tool}:${JAEGER_VERSION}

    docker run \
        --rm \
        --interactive \
        --volume "${volume}" \
        ${docker_image} docs \
            --format=yaml \
            --dir=/data

    rm -rf ${NEXT_RELEASE_CLI_DIR}
    cp -rf data/cli/${JAEGER_VERSION} ${NEXT_RELEASE_CLI_DIR}
done
