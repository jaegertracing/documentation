---
title: Configuration
aliases: [../configuration]
hasparent: true
weight: 1
---

{{< warning >}}
We are currently working on expanding this section with more details. [Examples of working configuration files](https://github.com/jaegertracing/jaeger/tree/v2.11.0/cmd/jaeger) can be found in the Jaeger repository. In the future the documentation for all configuration properties will be [auto-generated](https://github.com/jaegertracing/jaeger/issues/6186).
{{< /warning >}}

## Introduction

Jaeger can be configured via a YAML configuration file that uses the same format as the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/configuration/). The configuration defines the main ingestion pipeline as a collection of **receivers**, **processors**, **connectors**, and **exporters**. Jaeger implements many of these components, but also a number of **extensions** that provide Jaeger's unique capabilities.

```shell
jaeger --config config.yaml
```

### Configuration Examples

[Examples of working configuration files](https://github.com/jaegertracing/jaeger/tree/v2.11.0/cmd/jaeger) are available in the Jaeger GitHub repository:
  * `config-{storage}.yaml` are examples of running Jaeger as `collector` role with different storage backends.
  * `config-query.yaml` is an example of running Jaeger in a standalone `query` role (with UI).
  * `cmd/jaeger/internal/all-in-one.yaml` is bundled in the Jaeger binary for `all-in-one` role.
  * Other examples demonstrate additional features like SPM, tail sampling, adaptive sampling, etc.

### Environment Variables

Jaeger v2 can only be configured via a config file, it does not recognize environment variables in the same way as Jaeger v1 used to do. However, the format of that YAML config does allow referring to environment variables, which provides some additional flexibility when needed. For example, in the config snippet below the hostname is `localhost` by default but it can be overwritten via `JAEGER_LISTEN_HOST` environment variable, which is useful when running Jaeger in a container and it needs to be `0.0.0.0`:

```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: "${env:JAEGER_LISTEN_HOST:-localhost}:4317"
      http:
        endpoint: "${env:JAEGER_LISTEN_HOST:-localhost}:4318"
```

One category of environment variables that Jaeger v2 does recognize automatically is those that control the behavior of the OpenTelemetry Go SDK, such as `OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318`.

### Config Overrides

Another way to override certain config values is by passing them via `--set` command line flags:
```
--set=receivers.otlp.protocols.grpc.endpoint=0.0.0.0:4317
```

This can be handy when running the `all-in-one` role that relies on a built-in config.

## Extensions

### Jaeger storage

`jaeger_storage` extension is responsible for configuring all storage backends used by other parts of Jaeger. It may appear strange that we need it, considering that a typical pattern in the OpenTelemetry Collector is to have distinct exporters for any specific destination. However, the OpenTelemetry Collector is primarily concerned with writing data, while Jaeger also allows to read the data via UI and query APIs, so we need a mechanism to share the storage configuration across different components. The `jaeger_storage` extension achieves that.

Here is an example of how to configure the extension:

```yaml
jaeger_storage:
  backends:
    some_trace_storage:
      memory:
        max_traces: 100000
  metric_backends:
    some_metrics_storage:
      prometheus:
        endpoint: http://prometheus:9090
        normalize_calls: true
        normalize_duration: true
```

In this example:
  * `backends` is a dictionary of backends for tracing data
  * `metric_backends` is a dictionary of backends for metrics
  * `some_storage` and `some_metrics_storage` are some names given to certain backends that can be referenced from other components
  * `memory` is a type of the backend, in this case in-memory storage
  * `prometheus` is a type of the backend, in this case Prometheus-compatible remote server

### Jaeger query

`jaeger_query` extension is responsible for running HTTP and gRPC servers that expose trace query APIs and the UI frontend. In the future the configuration documentation will be [auto-generated](https://github.com/jaegertracing/jaeger/issues/6628) from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/v2.11.0/cmd/jaeger/internal/extension/jaegerquery/config.go#L16) as the authoritative source.

Here's an example of how to configure the extension:

```yaml
jaeger_query:
  storage:
    traces: some_trace_storage
    metrics: some_metrics_storage
  base_path: /
  ui:
    config_file: /etc/jaeger/ui-config.json
    log_access: true
  grpc:
    endpoint: 0.0.0.0:16685
  http:
    endpoint: 0.0.0.0:16686
```

Of note here is the `storage` section, which references by name the storage backends configured in the `jaeger_storage` extension.

#### Clock Skew Adjustment

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. `jaeger_query` extension implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/v2.11.0/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to their timestamps.

Sometimes these adjustments themselves make the trace hard to understand. For example, when repositioning the server span within the bounds of its parent span, Jaeger does not know the exact relationship between the request and response latencies, so it assumes they are equal and places the child span in the middle of the parent span (see [issue #961](https://github.com/jaegertracing/jaeger/issues/961#issuecomment-453925244)).

The `jaeger_query` extension supports a configuration property that controls how much clock skew adjustment should be allowed.

```
extensions:
  jaeger_query:
    max_clock_skew_adjust: 30s
```

 Setting this parameter to zero (`0s`) disables clock skew adjustment completely. This setting applies to all traces retrieved from the given query service. There is an open [ticket #197](https://github.com/jaegertracing/jaeger-ui/issues/197) to support toggling the adjustment on and off directly in the UI.

#### UI Base Path

The base path for all `jaeger_query` extension HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running Jaeger behind a reverse proxy. Here is example code to set the base path.

```
extensions:
  jaeger_query:
    base_path: /
    ui:
      config_file: /etc/jaeger/ui-config.json
    grpc:
    http:
```

#### UI Customization

Several aspects of the UI can be customized. Please refer to the dedicated [User Interface](../frontend-ui/) page.

### Remote sampling

`remote_sampling` extension is responsible for running HTTP/gRPC servers that expose the [Remote Sampling API](../../architecture/apis/#remote-sampling-configuration).

```yaml
remote_sampling:
  # You can either use file or adaptive sampling strategy in remote_sampling
  # file:
  #   path: ./cmd/jaeger/sampling-strategies.json
  adaptive:
    sampling_store: some_store
    initial_sampling_probability: 0.1
  http:
  grpc:
```

## Exporters

### Jaeger storage

`jaeger_storage_exporter` is a generic exporter that can be used to send data to any storage backend registered in the `jaeger_storage` extension. Sample configuration:

```yaml
jaeger_storage_exporter:
  trace_storage: some_trace_storage
  queue:
    num_consumers: 10
    queue_size: 100
```

## Processors

### Adaptive sampling

`adaptive_sampling` processor observes all the traces collected by Jaeger and dynamically calculates sampling probabilities for different services and endpoints in order to satisfy certain throughput targets (number of traces per second).
