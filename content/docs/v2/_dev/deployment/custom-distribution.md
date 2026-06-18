---
title: Custom Distribution
---

Since Jaeger v2 is built on the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) framework, you can use the [OpenTelemetry Collector Builder (`ocb`)](https://github.com/open-telemetry/opentelemetry-collector/tree/main/cmd/builder) to create custom Jaeger distributions with additional or fewer components than the default binary ships with.

This is useful when you want to:
  * Add third-party OpenTelemetry Collector components (receivers, processors, exporters, connectors, extensions) to Jaeger.
  * Remove unused components to reduce binary size and attack surface.
  * Pin specific versions of dependencies for compliance or reproducibility.

## Prerequisites

Install the OpenTelemetry Collector Builder:

```sh
go install go.opentelemetry.io/collector/cmd/builder@latest
```

The installed binary will be named `builder`. Rename or alias it to `ocb` if you prefer:

```sh
mv $(go env GOPATH)/bin/builder $(go env GOPATH)/bin/ocb
```

## Builder Manifest

The `ocb` tool takes a YAML manifest file (commonly named `builder.yaml`) that declares which components to include in the binary. Jaeger provides a [reference manifest](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/builder.yaml) that reproduces the default distribution.

Here is a minimal example that builds a Jaeger binary with just the core components:

```yaml
dist:
  module: github.com/example/my-jaeger
  name: jaeger
  description: My custom Jaeger distribution
  output_path: ./build

telemetry:
  gomod: github.com/jaegertracing/jaeger v2.19.0
  import: github.com/jaegertracing/jaeger/components/telemetry

extensions:
  - gomod: github.com/jaegertracing/jaeger v2.19.0
    import: github.com/jaegertracing/jaeger/components/extension/jaegerstorage
  - gomod: github.com/jaegertracing/jaeger v2.19.0
    import: github.com/jaegertracing/jaeger/components/extension/jaegerquery
  - gomod: github.com/jaegertracing/jaeger v2.19.0
    import: github.com/jaegertracing/jaeger/components/ext/extension/healthcheckv2extension

receivers:
  - gomod: github.com/jaegertracing/jaeger v2.19.0
    import: github.com/jaegertracing/jaeger/components/ext/receiver/otlpreceiver

exporters:
  - gomod: github.com/jaegertracing/jaeger v2.19.0
    import: github.com/jaegertracing/jaeger/components/exporter/storageexporter

processors:
  - gomod: github.com/jaegertracing/jaeger v2.19.0
    import: github.com/jaegertracing/jaeger/components/ext/processor/batchprocessor
```

## Available Components

Jaeger exposes its components as public Go packages under [`components/`](https://github.com/jaegertracing/jaeger/tree/main/components) in the Jaeger repository:

  * **Jaeger-specific components** (`components/extension/`, `components/exporter/`, `components/processor/`) — these are Jaeger's own implementations such as the storage exporter, query extension, adaptive sampling processor, etc.
  * **Third-party OTel components** (`components/ext/`) — these are upstream OpenTelemetry Collector components (from core and contrib) re-exported through Jaeger's module. Using these ensures version consistency with the rest of the Jaeger distribution, as their actual versions are resolved transitively through Jaeger's `go.mod`.

All components use a single `gomod` entry (`github.com/jaegertracing/jaeger`) which simplifies dependency management in the manifest.

## Adding Custom Components

To add a component that is not part of the default Jaeger distribution, append it to the relevant section in your manifest. For example, to add the [resource detection processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/resourcedetectionprocessor):

```yaml
processors:
  # ... existing processors ...
  - gomod: github.com/open-telemetry/opentelemetry-collector-contrib/processor/resourcedetectionprocessor v0.123.0
```

## Building

Run the builder:

```sh
ocb --config builder.yaml
```

The resulting binary will be placed in the `output_path` directory specified in the manifest. You can then run it with a standard Jaeger configuration file:

```sh
./build/jaeger --config config.yaml
```

Cross-compilation is supported via environment variables:

```sh
GOOS=linux GOARCH=arm64 ocb --config builder.yaml
```

## Version Compatibility

Replace the version placeholder (`v2.19.0` in the examples above) with the Jaeger release version you want to base your distribution on. All Jaeger component packages within a given release are versioned together, so you only need to track a single version number.
