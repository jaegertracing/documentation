#!/usr/bin/env python3
# Copyright (c) 2026 The Jaeger Authors.
# SPDX-License-Identifier: Apache-2.0
"""
convert-metrics-to-yaml.py

Converts a combined Prometheus text-format metrics snapshot (produced by the
jaeger integration tests) into the YAML data file consumed by the Hugo
documentation site.

Usage:
    python3 scripts/convert-metrics-to-yaml.py \\
        --input  combined-metrics.txt \\
        --output data/metrics/2.17/metrics.yaml \\
        --version 2.17.0

Input format (Prometheus text exposition format):
    # HELP otelcol_exporter_sent_spans ...
    # TYPE otelcol_exporter_sent_spans counter
    otelcol_exporter_sent_spans{exporter="otlp", ...} 42

Output format:
    version: "2.17.0"
    metrics:
      - name: otelcol_exporter_sent_spans
        labels:
          - exporter
          - service_name
"""

import argparse
import re
import sys
from collections import defaultdict

LABEL_PATTERN = re.compile(r'(\w+)=')
METRIC_LINE = re.compile(r'^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s')
EXCLUDED_LABELS = {'service_instance_id', 'otel_scope_version', 'otel_scope_schema_url'}


def parse_metrics(text: str) -> dict:
    """Parse Prometheus text format and return {metric_name: set_of_label_names}."""
    metrics = defaultdict(set)
    for line in text.splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        m = METRIC_LINE.match(line)
        if not m:
            continue
        name = m.group(1)
        labels_str = m.group(2) or ''
        labels = set(LABEL_PATTERN.findall(labels_str)) - EXCLUDED_LABELS
        metrics[name].update(labels)
    return metrics


def metrics_to_yaml(metrics: dict, version: str) -> str:
    """Render metrics dict as YAML string."""
    lines = [f'version: "{version}"', 'metrics:']
    for name in sorted(metrics):
        labels = sorted(metrics[name])
        lines.append(f'  - name: {name}')
        if labels:
            lines.append('    labels:')
            for label in labels:
                lines.append(f'      - {label}')
    lines.append('')  # trailing newline
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Convert Prometheus metrics snapshot to Hugo data YAML')
    parser.add_argument('--input', required=True, help='Path to combined Prometheus text-format metrics file')
    parser.add_argument('--output', required=True, help='Path to write the output YAML file')
    parser.add_argument('--version', required=True, help='Jaeger version string, e.g. 2.17.0')
    args = parser.parse_args()

    with open(args.input) as f:
        text = f.read()

    metrics = parse_metrics(text)
    if not metrics:
        print(f'ERROR: no metrics found in {args.input}', file=sys.stderr)
        sys.exit(1)

    yaml_out = metrics_to_yaml(metrics, args.version)

    import os
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    with open(args.output, 'w') as f:
        f.write(yaml_out)

    print(f'Wrote {len(metrics)} metrics to {args.output}')


if __name__ == '__main__':
    main()
