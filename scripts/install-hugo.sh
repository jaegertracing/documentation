#!/bin/bash

HUGO_VERSION=$1
OS=$2

function install {
    (
        cd /usr/local/bin
        sudo rm -f hugo
        sudo wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_${OS}-64bit.tar.gz
        sudo tar -xvzf hugo_${HUGO_VERSION}_${OS}-64bit.tar.gz \
          --no-same-permissions
    )
}

if command -v hugo &> /dev/null; then
    echo "Hugo installed. Checking version..."
    installed_hugo_version=$(hugo version | awk '{print $5}')

    if [ "${installed_hugo_version}" != "v${HUGO_VERSION}" ]; then
        echo "Your currently installed version of Hugo (${installed_hugo_version}) doesn't match the required version (${HUGO_VERSION})."
        echo "To install the most appropriate version, see the instructions here: https://github.com/gohugoio/hugo/releases/tag/v${HUGO_VERSION}"
        exit 1
    else
        echo "You have the appropriate version of Hugo installed (${HUGO_VERSION})"
        exit 0
    fi
else
    echo "Hugo not installed. Installing version ${HUGO_VERSION}..."
    install
fi

exit 0
