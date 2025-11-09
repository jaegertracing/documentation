---
title: APIs
aliases: [../apis]
hasparent: true
---

Jaeger supports various APIs for saving or retrieving trace data.

The following labels are used to describe API compatibility guarantees.

* **stable** - the API guarantees backwards compatibility. If breaking changes are going to be made in the future, they will result in a new API version, e.g. `/api/v2` URL prefix or a different namespace in the IDL.
* **internal** - the APIs are intended for internal communications between Jaeger components and are not recommended for use by external components.
* **deprecated** - the APIs that are only maintained for legacy reasons and will be phased out in the future.

## Default Ports

The following tables list the default ports used by Jaeger components. They can be overwritten by user via configuration.

### Write APIs

| Port  | Protocol | Endpoint        | Format
| ----- | -------  | --------------- | ----
| 4317  | gRPC     | 'ExportTraceServiceRequest' | [OTLP Protobuf][otlp.grpc]
| 4318  | HTTP     | `/v1/traces`    | [OTLP Protobuf or OTLP JSON][otlp.http]
| 9411  | HTTP     | `/api/v1/spans` | Zipkin v1 JSON or Thrift
|       | HTT      | `/api/v2/spans` | Zipkin v2 JSON or Protobuf
| 14250 | gRPC     | `jaeger.api_v2.CollectorService` | [Legacy Protobuf][collector.proto]
| 14268 | HTTP     | `/api/traces`   | [Legacy Thrift][jaeger.thrift]

### Read APIs
| Port  | Protocol | Endpoint        | Format
| ----- | -------  | --------------- | ----
| 16685 | gRPC     | `jaeger.api_v2.QueryService` | Legacy Protobuf
|       | gRPC     | `jaeger.api_v3.QueryService` | OTLP-based Protobuf
| 16686 | HTTP     | `/api/*`        | Internal (unofficial) JSON API


### Remote Sampling APIs

| Port  | Protocol | Endpoint        | Format
| ----- | -------  | --------------- | ----
| 5778  | HTTP     | `/sampling`     | [sampling.proto] via [Protobuf-to-JSON mapping](https://developers.google.com/protocol-buffers/docs/proto3#json)
| 5779  | gRPC     | `jaeger.api_v2.SamplingManager` | Protobuf

## Trace receiving APIs

Jaeger can receive trace data in multiple formats on different ports.

### OpenTelemetry Protocol (stable)

Jaeger can receive trace data from the OpenTelemetry SDKs in their native [OpenTelemetry Protocol (OTLP)][otlp]. The OTLP data is accepted in these formats:
  * binary gRPC
  * Protobuf over HTTP
  * JSON over HTTP

Only tracing data is accepted, since Jaeger does not store other telemetry types. For more details on the OTLP receiver see the [official documentation][otlp-rcvr].

[otlp-rcvr]: https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/otlpreceiver/README.md
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md

### Legacy Protobuf via gRPC (stable)

Jaeger's legacy Protobuf format is defined in [collector.proto] IDL file. Support for this format has been removed from OpenTelemetry SDKs, it's only maintained for backwards compatibility.

### Legacy Thrift over HTTP (stable)

Jaeger's legacy Thrift format is defined in [jaeger.thrift] IDL file, and is only maintained for backwards compatibility. The Thrift payload can be submitted in an HTTP POST request to the  `/api/traces` endpoint, for example, `https://jaeger-collector:14268/api/traces`. The `Batch` struct needs to be encoded using Thrift's `binary` encoding, and the HTTP request should specify the content type header:

```http
Content-Type: application/vnd.apache.thrift.binary
```

### Zipkin Formats (stable)

Jaeger can accept spans in several Zipkin data formats, namely JSON v1/v2 and Thrift. **jaeger-collector** needs to be configured to enable Zipkin HTTP server, e.g. on port 9411 used by Zipkin collectors. The server enables two endpoints that expect POST requests:

* `/api/v1/spans` for submitting spans in Zipkin v1 JSON or Thrift formats.
* `/api/v2/spans` for submitting spans in Zipkin v2 JSON or Protobuf formats.

## Trace retrieval APIs

Traces saved in the storage can be retrieved by calling **jaeger-query** Service.

### gRPC/Protobuf (stable)

The recommended way for programmatically retrieving traces and other data is via the `jaeger.api_v3.QueryService` gRPC endpoint defined in [api_v3/query_service.proto](https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v3/query_service.proto) IDL file. In the default configuration this endpoint is accessible on port `:16685`. The legacy [api_v2](https://github.com/jaegertracing/jaeger-idl/tree/main/proto/api_v2) is also supported.

### HTTP JSON (internal)

Jaeger UI communicates with **jaeger-query** Service via JSON API. For example, a trace can be retrieved via a GET request to `https://jaeger-query:16686/api/traces/{trace-id-hex-string}`. This JSON API is intentionally undocumented and subject to change.

## Remote Storage API (stable)

When using the `grpc` storage type (a.k.a. [remote storage](../../storage/#remote-storage)), Jaeger components can use custom storage backends as long as those backends implement the gRPC [Remote Storage API][storage.proto].

## Remote Sampling Configuration (stable)

This API supports Jaeger's [Remote Sampling](../sampling/#remote-sampling) protocol, defined in the [sampling.proto] IDL file. See [Remote Sampling](../sampling/#remote-sampling) for details on how to configure Jaeger  with sampling strategies.

## Service dependencies graph (internal)

Can be retrieved from `/api/dependencies` endpoint. The GET request expects two parameters:

* `endTs` (number of milliseconds since epoch) - the end of the time interval
* `lookback` (in milliseconds) - the length the time interval (i.e. start-time + lookback = end-time).

The returned JSON is a list of edges represented as tuples `(caller, callee, count)`.

For programmatic access to the service graph, the recommended API is gRPC/Protobuf described above.

## Service Performance Monitoring (internal)

Please refer to the [SPM Documentation](../spm/#api)

## gRPC Server Introspection

Service ports that serve gRPC endpoints enable [gRPC reflection][grpc-reflection]. Unfortunately, the internally used `gogo/protobuf` has a [compatibility issue][gogo-reflection] with the official `golang/protobuf`, and as a result only the `list` reflection command is currently working properly, for example:

```shell
$ grpc_cli ls localhost:16685
grpc.health.v1.Health
grpc.reflection.v1.ServerReflection
grpc.reflection.v1alpha.ServerReflection
jaeger.api_v2.QueryService
jaeger.api_v2.metrics.MetricsQueryService
jaeger.api_v3.QueryService
```

[otlp.grpc]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md#otlpgrpc
[otlp.http]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md#otlphttp
[jaeger.thrift]: https://github.com/jaegertracing/jaeger-idl/blob/main/thrift/jaeger.thrift
[collector.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/collector.proto
[sampling.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/sampling.proto
[grpc-reflection]: https://github.com/grpc/grpc-go/blob/master/Documentation/server-reflection-tutorial.md#enable-server-reflection
[gogo-reflection]: https://jbrandhorst.com/post/gogoproto/#reflection
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/v2.0.0/plugin/storage/grpc/proto/
storage.proto
