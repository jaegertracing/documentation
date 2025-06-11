---
title: APIs
aliases: [../apis]
hasparent: true
---

Jaeger components implement various APIs for saving or retrieving trace data.

The following labels are used to describe API compatibility guarantees.

* **stable** - the API guarantees backwards compatibility. If breaking changes are going to be made in the future, they will result in a new API version, e.g. `/api/v2` URL prefix or a different namespace in the IDL.
* **internal** - the APIs are intended for internal communications between Jaeger components and are not recommended for use by external components.
* **deprecated** - the APIs that are only maintained for legacy reasons and will be phased out in the future.

Since Jaeger v1.32, **jaeger-collector** and **jaeger-query** Service ports that serve gRPC endpoints enable [gRPC reflection][grpc-reflection]. Unfortunately, the internally used `gogo/protobuf` has a [compatibility issue][gogo-reflection] with the official `golang/protobuf`, and as a result only the `list` reflection command is currently working properly.

## Span reporting APIs

**jaeger-collector** is the component of the Jaeger backend that can receive spans. At this time it supports two sets of non-overlapping APIs.

### OpenTelemetry Protocol (stable)

Since v1.35, the Jaeger backend can receive trace data from the OpenTelemetry SDKs in their native [OpenTelemetry Protocol (OTLP)][otlp]. It is no longer necessary to configure the OpenTelemetry SDKs with Jaeger exporters, nor deploy the OpenTelemetry Collector between the OpenTelemetry SDKs and the Jaeger backend.

The OTLP data is accepted in these formats: (1) binary gRPC, (2) Protobuf over HTTP, (3) JSON over HTTP. For more details on the OTLP receiver see the [official documentation][otlp-rcvr]. Note that not all configuration options are supported in **jaeger-collector** (see `--collector.otlp.*` [CLI Flags](../../deployment/cli/#jaeger-collector)), and only tracing data is accepted, since Jaeger does not store other telemetry types.

| Port  | Protocol | Endpoint     | Format
| ----- | -------  | ------------ | ----
| 4317  | gRPC     | n/a          | Protobuf
| 4318  | HTTP     | `/v1/traces` | Protobuf or JSON

[otlp-rcvr]: https://github.com/open-telemetry/opentelemetry-collector/blob/main/receiver/otlpreceiver/README.md
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md

### Protobuf via gRPC (stable)

**Deprecated**: we recommend the OpenTelemetry protocol.

Since Jaeger v1.11, the official protocol between user applications and **jaeger-collector**s is `jaeger.api_v2.CollectorService` gRPC endpoint defined in [collector.proto] IDL file. The same endpoint can be used to submit trace data from SDKs directly to **jaeger-collector**.

### Thrift over HTTP (stable)

**Deprecated**: we recommend the OpenTelemetry protocol.

The payload in [jaeger.thrift] format can be submitted in an HTTP POST request to the  `/api/traces` endpoint, for example, `https://jaeger-collector:14268/api/traces`. The `Batch` struct needs to be encoded using Thrift's `binary` encoding, and the HTTP request should specify the content type header:

```
Content-Type: application/vnd.apache.thrift.binary
```

### JSON over HTTP (n/a)

There is no official Jaeger JSON format that can be accepted by **jaeger-collector**.
Jaeger does accept the OpenTelemetry protocol via JSON (see [above](#opentelemetry-protocol-stable)).

### Zipkin Formats (stable)

**jaeger-collector** can also accept spans in several Zipkin data formats, namely JSON v1/v2 and Thrift. **jaeger-collector** needs to be configured to enable Zipkin HTTP server, e.g. on port 9411 used by Zipkin collectors. The server enables two endpoints that expect POST requests:

* `/api/v1/spans` for submitting spans in Zipkin JSON v1 or Zipkin Thrift format.
* `/api/v2/spans` for submitting spans in Zipkin JSON v2.

## Trace retrieval APIs

Traces saved in the storage can be retrieved by calling **jaeger-query** Service.

### gRPC/Protobuf (stable)

The recommended way for programmatically retrieving traces and other data is via the `jaeger.api_v2.QueryService` gRPC endpoint defined in [query.proto] IDL file. In the default configuration this endpoint is accessible from `jaeger-query:16685`.

### HTTP JSON (internal)

Jaeger UI communicates with **jaeger-query** Service via JSON API. For example, a trace can be retrieved via a GET request to `https://jaeger-query:16686/api/traces/{trace-id-hex-string}`. This JSON API is intentionally undocumented and subject to change.

## Remote Storage API (stable)

When using the `grpc` storage type (a.k.a. [remote storage](../../deployment/#remote-storage)), Jaeger components can use custom storage backends as long as those backends implement the gRPC [Remote Storage API][storage.proto].

## Remote Sampling Configuration (stable)

This API supports Jaeger's [Remote Sampling](../sampling/#remote-sampling) protocol, defined in the [sampling.proto] IDL file.

**jaeger-collector** implements this API. See [Remote Sampling](../sampling/#remote-sampling) for details on how to configure the Collector with sampling strategies.

The following table lists different endpoints and formats that can be used to query for sampling strategies. The official HTTP/JSON endpoints use standard [Protobuf-to-JSON mapping](https://developers.google.com/protocol-buffers/docs/proto3#json).

Component | Port  | Endpoint          | Format    | Notes
--------- | ----- | ----------------- | --------- | -----
Collector | 14268 | `/api/sampling`   | HTTP/JSON | Recommended for most SDKs
Collector | 14250 | [sampling.proto]  | gRPC      | For SDKs that want to use gRPC (e.g. OpenTelemetry Java SDK)

**Examples**

Run all-in-one in one terminal:
```shell
$ go run ./cmd/all-in-one \
  --sampling.strategies-file=cmd/all-in-one/sampling_strategies.json
```

Query the endpoint in another terminal:
```shell
$ curl "http://localhost:14268/api/sampling?service=foo"
{"strategyType":"PROBABILISTIC","probabilisticSampling":{"samplingRate":1}}
```

## Service dependencies graph (internal)

Can be retrieved from**jaeger-query** Service at `/api/dependencies` endpoint. The GET request expects two parameters:

* `endTs` (number of milliseconds since epoch) - the end of the time interval
* `lookback` (in milliseconds) - the length the time interval (i.e. start-time + lookback = end-time).

The returned JSON is a list of edges represented as tuples `(caller, callee, count)`.

For programmatic access to the service graph, the recommended API is gRPC/Protobuf described above.

## Service Performance Monitoring (internal)

Please refer to the [SPM Documentation](../../deployment/spm/#api)

[jaeger-idl]: https://github.com/jaegertracing/jaeger-idl/
[jaeger.thrift]: https://github.com/jaegertracing/jaeger-idl/blob/main/thrift/jaeger.thrift
[sampling.thrift]: https://github.com/jaegertracing/jaeger-idl/blob/main/thrift/sampling.thrift
[collector.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/collector.proto
[query.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/query.proto
[sampling.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/sampling.proto
[grpc-reflection]: https://github.com/grpc/grpc-go/blob/master/Documentation/server-reflection-tutorial.md#enable-server-reflection
[gogo-reflection]: https://jbrandhorst.com/post/gogoproto/#reflection
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/v1.70.0/internal/storage/v1/grpc/proto/storage.proto
