#!/usr/bin/env python3

# Copyright (c) 2024 The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0

# This script fetches the auto-generated metrics reports from the jaegertracing/jaeger
# repository and publishes a reference page of current Jaeger v2 metrics.
# It is intended to be run as part of the RELEASE PROCESS so that the committed
# metrics-reference.md always reflects the state of a specific release tag.
# The purpose is to track BACKWARDS COMPATIBILITY of metrics across Jaeger v2 releases.

import logging
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Base URL template for the v2 metrics reference docs stored in the jaeger repository
# under cmd/jaeger/docs/migration/. Note: these are committed markdown files, not CI artifacts;
# Set the JAEGER_METRICS_REF environment variable to a specific release tag/branch
# if you need reproducible output; it defaults to "main".
BASE_RAW_URL_TEMPLATE = "https://raw.githubusercontent.com/jaegertracing/jaeger/{ref}/cmd/jaeger/docs/migration/"
JAEGER_METRICS_REF = os.environ.get("JAEGER_METRICS_REF", "main")

TARGET_FILES = [
    {"filename": "all-in-one-metrics.md", "title": "Jaeger"},
    {"filename": "badger-metrics.md", "title": "Badger Storage"},
    {"filename": "cassandra-metrics.md", "title": "Cassandra Storage"},
    {"filename": "elasticsearch-metrics.md", "title": "Elasticsearch Storage"},
    {"filename": "opensearch-metrics.md", "title": "OpenSearch Storage"},
]


def fetch_markdown(filename):
    url = BASE_RAW_URL_TEMPLATE.format(ref=JAEGER_METRICS_REF) + filename
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        logger.error(f"HTTP Error fetching {filename}: {e.code} {e.reason}")
        return None
    except Exception as e:
        logger.error(f"Error fetching {filename}: {e}")
        return None


def extract_v2_metrics_table(raw_md):
    """Parse the raw markdown and return a new table with only v2 Metric + v2 Labels columns.

    The source files have 4 columns: V1 Metric | V1 Labels | V2 Metric | V2 Labels.
    We extract only the columns that matter for v2 backwards-compatibility tracking,
    dropping rows where V2 Metric is N/A (metric was removed in v2).
    """
    output_lines = []
    in_table = False

    for line in raw_md.split("\n"):
        stripped = line.strip()

        # Detect the start of a 4-column metrics table (V1 Metric header)
        if "V1 Metric" in stripped and "V2 Metric" in stripped:
            in_table = True
            # Emit the new v2-only header
            output_lines.append("| Metric | Labels |")
            output_lines.append("|--------|--------|")
            continue

        # Skip the separator row (|---|---:|:---|...)
        if in_table and re.fullmatch(r'[\|\-\s:]+', stripped):
            continue

        if in_table and stripped.startswith("|"):
            # Strip leading/trailing pipes first to avoid empty first column from `|| ...` rows
            cols = [c.strip() for c in stripped.strip('|').split("|")]
            # cols[0]=V1 Metric, cols[1]=V1 Labels, cols[2]=V2 Metric, cols[3]=V2 Labels
            if len(cols) >= 4:
                v2_metric = cols[2]
                v2_labels = cols[3]
                # Skip metrics that don't exist in v2
                if v2_metric and v2_metric.lower() != "n/a":
                    output_lines.append(f"| {v2_metric} | {v2_labels} |")
        elif in_table and stripped == "":
            in_table = False
            output_lines.append("")
        elif not in_table:
            # Carry over subsection headings, but downgrade H1 to H3 to avoid multiple page H1s.
            # Preserve H2-H6 headings as-is to keep section boundaries clear.
            heading_match = re.match(r'^(#{1,6})\s+(.*)', stripped)
            if heading_match:
                hashes, text = heading_match.groups()
                level = len(hashes)
                if level == 1:
                    # Downgrade H1 to H3
                    output_lines.append("### " + text.strip())
                else:
                    # Preserve H2-H6 verbatim
                    output_lines.append(stripped)

    return "\n".join(output_lines)


def generate_metrics_reference():
    content = "---\n"
    content += "title: Metrics Reference (v2)\n"
    content += "navtitle: Metrics Reference\n"
    content += "hasparent: true\n"
    content += "---\n\n"
    content += (
        "This page is intended to provide a reference of all metrics exposed by Jaeger v2. Once "
        "populated, it is used to track **backwards compatibility across Jaeger v2 releases** — "
        "i.e. ensuring metric names and labels do not change unexpectedly between versions.\n\n"
    )
    content += (
        "> **Note:** The full metrics table is generated as part of the Jaeger release process and\n"
        "> is not committed verbatim to this repository. Run `make fetch-metrics` after a release\n"
        "> to populate this page with up-to-date data.\n\n"
    )

    missing_files = False

    for item in TARGET_FILES:
        logger.info(f"Fetching {item['filename']}...")
        raw_md = fetch_markdown(item["filename"])
        if raw_md is not None:
            v2_table = extract_v2_metrics_table(raw_md)
            content += f"## {item['title']} Metrics\n\n"
            content += v2_table.strip() + "\n\n"
        else:
            logger.warning(f"Skipping {item['filename']} due to fetch failure.")
            missing_files = True

    return content, missing_files


def save_metrics_reference(content):
    # Resolve output path relative to the repository root (parent of the scripts/ dir)
    # so the script works correctly regardless of the current working directory.
    repo_root = Path(__file__).resolve().parent.parent
    target_path = repo_root / "content/docs/v2/_dev/operations/metrics-reference.md"
    os.makedirs(target_path.parent, exist_ok=True)
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(content)
    logger.info(f"Successfully saved metrics reference to {target_path}")


def main():
    try:
        content, missing_files = generate_metrics_reference()
        save_metrics_reference(content)

        if missing_files:
            logger.error("Failed to fetch one or more metrics files. The generated page may be incomplete.")
            sys.exit(1)

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
