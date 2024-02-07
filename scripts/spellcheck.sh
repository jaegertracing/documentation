#!/usr/bin/env bash

find content/ -name '*.md' -exec bash -c 'misspelled_words=$(aspell --encoding=utf-8 list --mode=markdown --lang=en --ignore-case --personal=./my_dictionary.txt < "$0" | sort | uniq); if [ -n "$misspelled_words" ]; then echo -e "File: $0\nMisspelled words:\n$misspelled_words\n---------------------------------------------------"; fi' {} \;