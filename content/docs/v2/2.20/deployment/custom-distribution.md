---
title: Custom Distribution
---

Since Jaeger v2 is built on the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) framework, you can use the [OpenTelemetry Collector Builder (`ocb`)](https://opentelemetry.io/docs/collector/extend/ocb/) to create custom Jaeger distributions that include additional components or exclude unused ones.

This is useful when you want to:
  * Add third-party OpenTelemetry Collector components (receivers, processors, exporters, connectors, extensions) to Jaeger.
  * Remove unused components to reduce binary size and attack surface.
  * Pin specific versions of dependencies for compliance or reproducibility.

## Prerequisites

Follow the [official instructions](https://opentelemetry.io/docs/collector/extend/ocb/) to install the OpenTelemetry Collector Builder (`ocb`).

## Builder Manifest

The `ocb` tool takes a YAML manifest file (commonly named `builder.yaml`) that declares which components to include in the binary. Jaeger provides a [reference manifest](https://github.com/jaegertracing/jaeger/blob/v2.20.0/cmd/jaeger/builder.yaml) that reproduces the default distribution. Note that the reference manifest uses `v0.0.0` with a `replaces` directive for in-repo builds — when building outside the Jaeger repository, use a real release version as shown in the example below.

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

Jaeger exposes its components as public Go packages under [`components/`](https://github.com/jaegertracing/jaeger/tree/v2.20.0/components) in the Jaeger repository:

  * **Jaeger-specific components** (`components/extension/`, `components/exporter/`, `components/processor/`) — these are Jaeger's own implementations such as the storage exporter, query extension, adaptive sampling processor, etc.
  * **Third-party OTel components** (`components/ext/`) — these are upstream OpenTelemetry Collector components (from core and contrib) re-exported through Jaeger's module. Using these ensures version consistency with the rest of the Jaeger distribution, as their actual versions are resolved transitively through Jaeger's `go.mod`.

All components use a single `gomod` entry (`github.com/jaegertracing/jaeger`) which simplifies dependency management in the manifest.

## Adding Custom Components

To add a component that is not part of the default Jaeger distribution, append it to the relevant section in your manifest. For example, to add the [resource detection processor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/resourcedetectionprocessor):

```yaml
processors:
  # ... existing processors ...
  - gomod: github.com/open-telemetry/opentelemetry-collector-contrib/processor/resourcedetectionprocessor v0.123.0
    import: github.com/open-telemetry/opentelemetry-collector-contrib/processor/resourcedetectionprocessor
```

{{< warning >}}
When adding components from `opentelemetry-collector-contrib` or other OTel modules, use the same version of OpenTelemetry that Jaeger is built with. Mixing different OTel versions may cause API incompatibilities and build failures. Check Jaeger's [`go.mod`](https://github.com/jaegertracing/jaeger/blob/v2.20.0/go.mod) for the exact versions used in each release.
{{< /warning >}}

## Building

Run the builder:

```sh
ocb --config builder.yaml --skip-strict-versioning
```

The `--skip-strict-versioning` flag is recommended because Jaeger's component packages use the same module version as the main Jaeger module, which may not match the versions of upstream OpenTelemetry dependencies. Without this flag, `ocb` would reject the build due to version mismatches between the declared `gomod` versions and the transitively resolved ones.

The resulting binary will be placed in the `output_path` directory specified in the manifest. You will need to provide a configuration file that references the components included in your custom build:

```sh
./build/jaeger --config config.yaml
```

Cross-compilation is supported via environment variables:

```sh
GOOS=linux GOARCH=arm64 ocb --config builder.yaml
```

## Version Compatibility

Replace the version placeholder (`v2.19.0` in the examples above) with the Jaeger release version you want to base your distribution on. All Jaeger component packages within a given release are versioned together, so you only need to track a single version number.
