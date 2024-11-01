---
title: Deployment
weight: 4
children:
- title: Configuration
  url: configuration
- title: Kubernetes Operator
  url: operator
- title: User Interface
  url: frontend-ui
- title: On Windows
  url: windows
---

The main Jaeger backend components are released as Docker images on [Docker Hub](https://hub.docker.com/r/jaegertracing) and [Quay](https://quay.io/organization/jaegertracing):

!!!UPDATE THE TABLE BELOW
Component             | Docker Hub                                                                                                   | Quay
--------------------- | -------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------
**jaeger-all-in-one**      | [hub.docker.com/r/jaegertracing/all-in-one/](https://hub.docker.com/r/jaegertracing/all-in-one/)         | [quay.io/repository/jaegertracing/all-in-one](https://quay.io/repository/jaegertracing/all-in-one)
**jaeger-agent**      | [hub.docker.com/r/jaegertracing/jaeger-agent/](https://hub.docker.com/r/jaegertracing/jaeger-agent/)         | [quay.io/repository/jaegertracing/jaeger-agent](https://quay.io/repository/jaegertracing/jaeger-agent)
**jaeger-collector**  | [hub.docker.com/r/jaegertracing/jaeger-collector/](https://hub.docker.com/r/jaegertracing/jaeger-collector/) | [quay.io/repository/jaegertracing/jaeger-collector](https://quay.io/repository/jaegertracing/jaeger-collector)
**jaeger-query**      | [hub.docker.com/r/jaegertracing/jaeger-query/](https://hub.docker.com/r/jaegertracing/jaeger-query/)         | [quay.io/repository/jaegertracing/jaeger-query](https://quay.io/repository/jaegertracing/jaeger-query)
**jaeger-ingester**   | [hub.docker.com/r/jaegertracing/jaeger-ingester/](https://hub.docker.com/r/jaegertracing/jaeger-ingester/)   | [quay.io/repository/jaegertracing/jaeger-ingester](https://quay.io/repository/jaegertracing/jaeger-ingester)
**jaeger-remote-storage**   | [hub.docker.com/r/jaegertracing/jaeger-remote-storage/](https://hub.docker.com/r/jaegertracing/jaeger-remote-storage/)   | [quay.io/repository/jaegertracing/jaeger-remote-storage](https://quay.io/repository/jaegertracing/jaeger-remote-storage)

The images listed above are the primary release versions. Most components have additional images published:
  * `${component}-debug` images include Delve debugger
  * `${component}-snapshot` images are published from the tip of the main branch for every commit, allowing testing of unreleased versions
  * `${component}-debug-snapshot` snapshot images that include the Delve debugger

There are orchestration templates for running Jaeger with:

  * Kubernetes: [github.com/jaegertracing/jaeger-kubernetes](https://github.com/jaegertracing/jaeger-kubernetes),
  * OpenShift: [github.com/jaegertracing/jaeger-openshift](https://github.com/jaegertracing/jaeger-openshift).

## Configuration Options

**jaeger** binaries are configured via configuration YAML file. The following ports are exposed by default:
Port  | Protocol | Function
----- | -------  | ---
2777  | HTTP     | expvar port for process level metrics per the Go standards
8888  | HTTP     | metrics port for exposing metrics which can be scraped with Prometheus compatible systems at `/metrics`
8889  | HTTP     | ingester port for reading data from Kafka topics and writing to a supported backend
13133 | HTTP     | Healthcheck port via the `healthcheckv2` extension

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

The following ports can also be used by **jaeger** for varous types of integrations

| Port  | Protocol | Endpoint | Function
| ----- | -------  | -------- | ----
| 4317  | gRPC     | n/a      | Accepts traces in [OpenTelemetry OTLP format][otlp] (Protobuf).
| 4318  | HTTP     | `/v1/traces` | Accepts traces in [OpenTelemetry OTLP format][otlp] (Protobuf and JSON).
| 14268 | HTTP     | `/api/sampling` | Serves sampling policies (see [Remote Sampling](../sampling/#remote-sampling)).
|       |          | `/api/traces` | Accepts spans in [jaeger.thrift][jaeger-thrift] format with `binary` thrift protocol (`POST`).
| 14269 | HTTP     | `/`      | Admin port: health check (`GET`).
|       |          | `/metrics` | Prometheus-style metrics (`GET`).
| 9411  | HTTP     | `/api/v1/spans` and `/api/v2/spans` | Accepts Zipkin spans in Thrift, JSON and Proto (disabled by default).

### Clock Skew Adjustment

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. **jaeger** query extension implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/master/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to their timestamps.

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
  grpc-server:
    host-port: 0.0.0.0:16685
  http-server:
    host-port: 0.0.0.0:16686
```

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](../frontend-ui/).

## Aggregation Jobs for Service Dependencies

Production deployments need an external process that aggregates data and creates dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and writes them directly to the storage.

[cqlsh]: http://cassandra.apache.org/doc/latest/tools/cqlsh.html
[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[model.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/model.proto
[thriftrw]: https://www.npmjs.com/package/thriftrw
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/grpc/proto/storage.proto
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
