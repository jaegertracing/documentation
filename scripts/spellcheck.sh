#!/bin/bash

PROJ_WORDS=.cspell/project-words.txt
# Check if the project-words.txt file exists
if [ ! -f "$PROJ_WORDS" ]; then
    echo "project-words.txt file not found."
    exit 1
fi
if ! sort -c "$PROJ_WORDS"; then
    echo "project-words.txt is not sorted."
    exit 1
fi

./scripts/npx-helper.sh cspell --version

npm run check:spelling
if [ $? -ne 0 ]; then
    echo "Misspelling(s) found."
    exit 1
fi
