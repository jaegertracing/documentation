---
title: Configuration
hasparent: true
weight: 1
---

{{< warning >}}
We are currently working on expanding this section with more details. [Examples of working configuration files](https://github.com/jaegertracing/jaeger/tree/v2.5.0/cmd/jaeger) can be found in the Jaeger repository. In the future the documentation for all configuration properties will be [auto-generated](https://github.com/jaegertracing/jaeger/issues/6186).
{{< /warning >}}

## Introduction

Jaeger can be configured via a YAML configuration file that uses the same format as the [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/configuration/). The configuration defines the main ingestion pipeline as a collection of **receivers**, **processors**, **connectors**, and **exporters**. Jaeger implements many of these components, but also a number of **extensions** that provide Jaeger's unique capabilities.

### Environment Variables

Note that Jaeger v2 does not recognize environment variables in the same way as Jaeger v1 used to do for configuration, it only reads the YAML config file. However, the format of that YAML config does allow referring to environment variables, that provides some additional flexibility when needed. For example, in the config snippet below the hostname is `localhost` by default but it can be overwritten via `JAEGER_LISTEN_HOST` environment variable, which is useful when running Jaeger in a container and it needs to be `0.0.0.0`:

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

`jaeger_query` extension is responsible for running HTTP and gRPC servers that expose trace query APIs and the UI frontend. Here's an example of how to configure the extension:

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

### Remote sampling

`remote_sampling` extension is responsible for running HTTP/gRPC servers that expose the [Remote Sampling API](../apis/#remote-sampling-configuration).

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

## Receivers

### No-op

`nop` can be used for Jaeger UI / query service deployment that does not require ingestion pipeline.

### OTLP

`otlp` receives data via gRPC or HTTP using OTLP format. Example configuration below:

```yaml
otlp:
    protocols:
      grpc:
      http:
```

### Jaeger

`jaeger` accepts Jaeger formatted traces transported via gRPC or Thrift protocols.

```yaml
jaeger:
  protocols:
    grpc:
    thrift_binary:
    thrift_compact:
    thrift_http:
```

### Kafka

`kafka` accepts spans from Kafka in various formats (OTLP, Jaeger, Zipkin).

### Zipkin

`zipkin` accepts spans using Zipkin v1 and v2 protocols.

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

### No-op

`nop` can be used for Jaeger UI / query service deployment that does not require ingestion pipeline.

### Prometheus

`prometheus` sends metrics to Prometheus. Sample configuration:

```yaml
prometheus:
  endpoint: "1.2.3.4:1234"
```

### OTLP

`otlp` export data via gRPC using OTLP format. Sample configuration:

```yaml
otlp:
  endpoint: otelcol2:4317
  tls:
    cert_file: file.cert
    key_file: file.key
```

### OTLP_HTTP

`otlphttp` exports traces and/or metrics via HTTP using OTLP format. Sample configuration:

```yaml
otlphttp:
  endpoint: https://example.com:4318
```

### Debug

`debug` outputs telemetry data to the console for debugging purposes. Sample configuration:

```yaml
debug:
  verbosity: detailed
  sampling_initial: 5
  sampling_thereafter: 200
```

### Kafka

`kafka` sends data to Kafka in various formats (OTLP, Jaeger, Zipkin). Here's an example of how to configure the extension:

```yaml
kafka:
    brokers:
      - localhost:9092
    topic: ${env:KAFKA_TOPIC:-jaeger-spans}
    encoding: ${env:KAFKA_ENCODING:-otlp_proto}
```

## Processors

### Adaptive sampling

`adaptive_sampling` processor observes all the traces collected by Jaeger and dynamically calculates sampling probabilities for different services and endpoints in order to satisfy certain throughput targets (number of traces per second).
