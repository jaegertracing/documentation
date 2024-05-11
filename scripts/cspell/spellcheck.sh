#!/bin/bash

if ! sort -c project-words.txt; then
    echo "project-words.txt is not sorted."
    exit 1
fi
npm ci  # clean install, do not upgrade dependencies
npm run spellcheck
if [ $? -ne 0 ]; then
    echo "Misspelling(s) found."
    exit 1
fi
