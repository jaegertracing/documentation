#!/bin/bash

HUGO_VERSION=$1
OS=$2

echo "Installing Hugo version ${HUGO_VERSION} for ${OS}"

(
  cd /usr/local/bin
  sudo rm -f hugo
  sudo wget https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_${OS}-64bit.tar.gz
  sudo tar -xvzf hugo_${HUGO_VERSION}_${OS}-64bit.tar.gz \
    --no-same-permissions
)
