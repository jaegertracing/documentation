#!/bin/bash

PROJ_WORDS=.cspell/project-words.txt
# Check if the project-words.txt file exists
if [ ! -f "$PROJ_WORDS" ]; then
    echo "project-words.txt file not found."
    exit 1
fi
if ! sort -c --ignore-case "$PROJ_WORDS"; then
    echo "project-words.txt is not sorted."
    exit 1
fi

npx --no-install cspell --no-progress -c .cspell.yml content 'layouts/**/*.md'

if [ $? -ne 0 ]; then
    echo "Misspelling(s) found."
    exit 1
fi
