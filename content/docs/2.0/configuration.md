---
title: Configuration
hasparent: true
weight: 1
---

{{< warning >}}
We are currently working on expanding this section with more details. [Examples of working configuration files](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger) can be found in the Jaeger repository. In the future the documentation for all configuration properties will be [auto-generated](https://github.com/jaegertracing/jaeger/issues/6186).
{{< /warning >}}

## Introduction

Jaeger can be configured via a YAML configuration file that uses the same format as the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/configuration/). The configuration defines the main ingestion pipeline as a collection of **receivers**, **processors**, **connectors**, and **exporters**. Jaeger implements many of these components, but also a number of **extensions** that provide Jaeger's unique capabilities.

## Extensions

### Jaeger storage

`jaeger_storage` extension is responsible for configuring all storage backends used by other parts of Jaeger. It may appear strange that we need it, considering that a typical pattern in the OpenTelemetry Collector is to have distinct exporters for any specific destination. However, the OpenTelemetry Collector is primarily concerned with writing data, while Jaeger also allows to read the data via UI and query APIs, so we need a mechanism to share the storage configuration across different components. The `jaeger_storage` extension achieves that.

Here is an example of how to configure the extension:

```yaml
jaeger_storage:
  backends:
    some_storage:
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

`jaeger_query` extension is responsible for running HTTP and gRPC servers that expose trace query APIs and the UI frontend. Here's an example of how to configure the extension:

```yaml
jaeger_query:
  storage:
    traces: some_storage
    metrics: some_metrics_storage
  base-path: /
  ui:
    config_file: /etc/jaeger/ui-config.json
    log_access: true
  grpc:
    endpoint: 0.0.0.0:16685
  http:
    endpoint: 0.0.0.0:16686
```

Of note here is the `storage` section, which references by name the storage backends configured in the `jaeger_storage` extension.

### Remote sampling

`remote_sampling` extension is responsible for running HTTP/gRPC servers that expose the [Remote Sampling API](../apis/#remote-sampling-configuration-stable).

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
  trace_storage: some_store
  queue:
    num_consumers: 10
    queue_size: 100
```

## Processors

### Adaptive sampling

`adaptive_sampling` processor observes all the traces collected by Jaeger and dynamically calculates sampling probabilities for different services and endpoints in order to satisfy certain throughput targets (number of traces per second).
