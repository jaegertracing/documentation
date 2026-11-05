#!/usr/bin/env python3
"""Checks the link conventions of the pages under content/docs/v2/_dev.

A link to a file in the jaeger repository is written as a reference-style link
whose URL is defined once at the end of the page, so that a file that moves
costs one line to fix. Inline links inside a shortcode body are allowed, since
Hugo renders a shortcode body on its own and it cannot see the page's
definitions. Every reference definition sits in the block at the end of the
page, after the last line of prose.
"""

import glob
import re
import sys

DEV_DIR = "content/docs/v2/_dev"
SOURCE_LINK = re.compile(
    r"\[[^\]]*\]\(https://github\.com/jaegertracing/jaeger/(?:blob|tree)/[^)]+\)"
)
DEFINITION = re.compile(r"^\[[^\]]+\]:\s+\S")
SHORTCODE_OPEN = re.compile(r"\{\{[<%]\s*(\w+)[^/]*?[>%]\}\}")
SHORTCODE_CLOSE = re.compile(r"\{\{[<%]\s*/(\w+)\s*[>%]\}\}")


def check(path):
    problems = []
    lines = open(path, encoding="utf-8").read().split("\n")
    in_shortcode = False
    for number, line in enumerate(lines, start=1):
        if SHORTCODE_CLOSE.search(line):
            in_shortcode = False
            continue
        if SHORTCODE_OPEN.search(line) and not SHORTCODE_CLOSE.search(line):
            in_shortcode = True
        if not in_shortcode and SOURCE_LINK.search(line):
            problems.append(
                f"{path}:{number}: inline link to a jaeger source file; use a "
                "reference-style link defined at the end of the page"
            )
    last_prose = 0
    for number, line in enumerate(lines, start=1):
        if line.strip() and not DEFINITION.match(line):
            last_prose = number
    for number, line in enumerate(lines, start=1):
        if DEFINITION.match(line) and number < last_prose:
            problems.append(
                f"{path}:{number}: link definition before the end of the page; "
                "move it below the last paragraph"
            )
    return problems


def main():
    problems = []
    for path in sorted(glob.glob(f"{DEV_DIR}/**/*.md", recursive=True)):
        problems.extend(check(path))
    for problem in problems:
        print(problem)
    if problems:
        print(f"{len(problems)} problems found in {DEV_DIR}; see scripts/check-dev-links.py")
        return 1
    print(f"Link conventions hold in {DEV_DIR}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
