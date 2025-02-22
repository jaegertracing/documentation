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
---

Jaeger backend is released as a single binary or container image (see [Downloads](../../../download/)). Despite that, it can be configured to operate in different roles, such as all-in-one, collector, query, and ingester (see [Architecture](../architecture/)).

## Management Ports

The following intra-oriented ports are exposed by default (can be changed via configuration):

Port  | Protocol | Function
----- | -------  | ---
8888  | HTTP     | metrics port for exposing metrics which can be scraped with Prometheus compatible systems at `/metrics`
8889  | HTTP     | ingester port for reading data from Kafka topics and writing to a supported backend
13133 | HTTP     | Healthcheck port via the `healthcheckv2` extension
27777 | HTTP     | expvar port for process level metrics per the Go standards

See [APIs](../apis/) for the list of all API ports.

## Configuration

Jaeger can be customized via configuration YAML file (see [Configuration](../configuration/)). 


**jaeger** is stateless and thus many instances of **jaeger** can be run in parallel. **jaeger** instances require almost no configuration, except for storage location, such as:

Cassandra:
```
  jaeger_storage:
    backends:
      some_storage:
        cassandra:
          schema: 
            keyspace: "jaeger_v1_dc1"
          connection:
            auth: 
              basic:
                username: "cassandra"
                password: "cassandra"
            tls:
              insecure: true
```

OpenSearch:
```
  jaeger_storage:
    backends:
      some_storage:
        opensearch:
          index_prefix: "jaeger-main"
```

ElasticSearch:
```
  jaeger_storage:
    backends:
      some_storage:
        elasticsearch:
          index_prefix: "jaeger-main"
      another_storage:
        elasticsearch:
          index_prefix: "jaeger-archive"
```

## Query Configuration

The `jaeger_query` extension has a few deployment-related configuration options.

### Clock Skew Adjustment

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. `jaeger_query` extension implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/master/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to their timestamps.

Sometimes these adjustments themselves make the trace hard to understand. For example, when repositioning the server span within the bounds of its parent span, Jaeger does not know the exact relationship between the request and response latencies, so it assumes they are equal and places the child span in the middle of the parent span (see [issue #961](https://github.com/jaegertracing/jaeger/issues/961#issuecomment-453925244)).

**jaeger** query extension supports configuration in the config file

```
query:
  max-clock-skew-adjustment: 30s
```

 that controls how much clock skew adjustment should be allowed. Setting this parameter to zero (`0s`) disables clock skew adjustment completely. This setting applies to all traces retrieved from the given query service. There is an open [ticket #197](https://github.com/jaegertracing/jaeger-ui/issues/197) to support toggling the adjustment on and off directly in the UI.

### UI Base Path

The base path for all **jaeger** query extension HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running **jaeger** behind a reverse proxy. Here is example code to set the base path.

```
query:
  base-path: /
  static-files: /go/bin/jaeger-ui-build/build
  ui-config: /etc/jaeger/ui-config.json
  grpc:
  http:
```

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](../frontend-ui/).

## SPM

Service Performance Monitoring (SPM) requires a deployment of Prometheus-compatible metrics storage (see [SPM page](../spm/)).

### TLS support

Jaeger supports TLS connections to Prometheus server as long as you've [configured
your Prometheus server](https://prometheus.io/docs/guides/tls-encryption/) correctly.

## Service Maps

In order to display service dependency diagrams, production deployments need an external process that aggregates data and computes dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and writes them directly to the storage.

[cqlsh]: http://cassandra.apache.org/doc/latest/tools/cqlsh.html
[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[model.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/model.proto
[thriftrw]: https://www.npmjs.com/package/thriftrw
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/v2.0.0/plugin/storage/grpc/proto/storage.proto
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
