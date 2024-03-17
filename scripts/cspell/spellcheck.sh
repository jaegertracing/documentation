#!/bin/bash

if ! sort -c project-words.txt; then \
    echo "project-words.txt is not sorted." && exit 1; \
fi
npm install cspell
npm run spellcheck