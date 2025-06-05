---
title: Deployment
weight: 4
children:
- title: Configuration
  url: configuration
- title: User Interface
  url: frontend-ui
- title: On Kubernetes
  url: kubernetes
- title: On Windows
  url: windows
- title: Security
  url: security
---

Jaeger backend is released as a single binary or container image (see [Downloads](../../../download/)). Despite that, it can be configured to operate in different **roles**, such as all-in-one, collector, query, and ingester (see [Architecture](../architecture/)). An explicit configuration file can be provided via the `--config` command line argument. When running in a container, the path to the config file must be mapped into the container file system (the `-v ...` mapping below):

```
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 5778:5778 \
  -p 9411:9411 \
  -v /path/to/local/config.yaml:/jaeger/config.yaml \
  jaegertracing/jaeger:{{< currentVersion >}} \
  --config /jaeger/config.yaml
```

## Management Ports

The following intra-oriented ports are exposed by default (can be changed via configuration):

Port  | Protocol | Endpoint   | Function
----- | -------  | ---------- | --------
8888  | HTTP     | `/metrics` | metrics port for exposing metrics which can be scraped with Prometheus compatible systems
8889  | HTTP     | `/metrics` | ingester port for reading data from Kafka topics and writing to a supported backend
13133 | HTTP     | `/status`  | Healthcheck port via the `healthcheckv2` extension
27777 | HTTP     | `/`        | expvar port for process level metrics per the Go standards

See [APIs](../architecture/apis/) for the list of all API ports.

## Configuration

Jaeger can be customized via configuration YAML file (see [Configuration](./configuration/)).

Jaeger **collector** is stateless and thus many instances of **collector** can be run in parallel. **collector** instances require almost no configuration, except for storage location, such as [Cassandra](../storage/cassandra/#configuration) or [Elasticsearch](../storage/elasticsearch/#configuration).

## Query Configuration

The `jaeger_query` extension has a few deployment-related configuration options. In the future the configuration documentation will be auto-generated from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/v2.5.0/cmd/jaeger/internal/extension/jaegerquery/config.go#L16) as the authoritative source.

### Clock Skew Adjustment

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. `jaeger_query` extension implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/v2.5.0/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to their timestamps.

Sometimes these adjustments themselves make the trace hard to understand. For example, when repositioning the server span within the bounds of its parent span, Jaeger does not know the exact relationship between the request and response latencies, so it assumes they are equal and places the child span in the middle of the parent span (see [issue #961](https://github.com/jaegertracing/jaeger/issues/961#issuecomment-453925244)).

The `jaeger_query` extension supports a configuration property that controls how much clock skew adjustment should be allowed.

```
extensions:
  jaeger_query:
    max_clock_skew_adjust: 30s
```

 Setting this parameter to zero (`0s`) disables clock skew adjustment completely. This setting applies to all traces retrieved from the given query service. There is an open [ticket #197](https://github.com/jaegertracing/jaeger-ui/issues/197) to support toggling the adjustment on and off directly in the UI.

### UI Base Path

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

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](./frontend-ui/).

## SPM

Service Performance Monitoring (SPM) requires a deployment of Prometheus-compatible metrics storage (see [SPM page](../architecture/spm/)).

## Service Maps

In order to display service dependency diagrams, production deployments need an external process that aggregates data and computes dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and writes them directly to the storage.

[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[model.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/model.proto
[thriftrw]: https://www.npmjs.com/package/thriftrw
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/v2.5.0/internal/storage/v1/grpc/proto/storage.proto
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
