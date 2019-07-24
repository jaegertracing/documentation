---
title: APIs
hasparent: true
---

Jaeger components implement various APIs for saving or retrieving trace data.

TODO

  * stable
  * restricted
  * deprecated

## Span reporting APIs

Agent and Collector are the two components of the Jaeger backend that can receive spans and forward them to storage.

### Thrift over UDP (stable)

The Agent can only receive spans over UDP in Thrift format. The primary API is a UDP packet that contains a Thrift-encoded `Batch` struct defined in [jaeger.thrift][jaeger.thrift] IDL file, located in the [jaeger-idl][jaeger-idl] repository. Most Jaeger Clients use Thrift's `compact` encoding, however some client libraries do not support it (notably, Node.js) and use Thrift's `binary` encoding (sent to  a different UDP port). The Agent's API is defined by [agent.thrift][agent.thrift] IDL file.

For legacy reasons, the Agent also accepts spans in Zipkin format, however, only very old versions of Jaeger clients can send data in that format and it is officially deprecated.

### Protobuf via gRPC (stable)

In a typical Jaeger deployment, Agents receive spans from Clients and forward them to Collectors. Since Jaeger version 1.11 the official and recommended protocol between Agents and Collectors is gRPC with Protobuf. The Protobuf IDL [collector.proto][collector.proto] is currently located in the main Jaeger repository, under [model/proto/api_v2][collector.proto]. In the future it will be moved to [jaeger-idl][jaeger-idl] repository ([jaeger-idl/issues/1234](TODO-link)).

### Thrift over HTTP (stable)

In some cases it is not feasible to deploy Jaeger Agent next to the application, for example, when the application code is running as AWS Lambda function. In these scenarios the Jaeger Clients can be configured to submit spans directly to the Collectors over HTTP/HTTPS.

The same [jaeger.thrift][jaeger.thrift] payload can be submitted in HTTP POST request to `/api/traces` endpoint, e.g. https://jaeger-collector:14268/api/traces. The `Batch` struct needs to be encoded using Thrift's `binary` encoding, and the HTTP request should specify the content type header:

```
Content-Type: application/vnd.apache.thrift.binary
```

### JSON over HTTP (n/a)

There is no official Jaeger JSON format that can be accepted by the collector. In the future the Protobuf-generated JSON may be supported.

### Thrift via TChannel (deprecated)

Agent and Collector can communicate using TChannel protocol. This protocol is generally not supported by  the routing infrastructure and has been deprecated. It will be eventually removed from Jaeger.

### Zipkin Formats (stable)

Jaeger Collector can also accept spans in several Zipkin data format, namely JSON v1/v2 and Thrift. The Collector needs to be configured to enable Zipkin HTTP server, e.g. on port 9411 used by Zipkin collectors. The server enables two endpoints that expect POST requests:

* `/api/v1/spans` for submitting spans in Zipkin JSON v1 or Zipkin Thrift format.
* `/api/v2/spans` for submitting spans in Zipkin JSON v2 or format.

## Trace retrieval APIs

Traves saved in the storage can be retrieved by calling Jaeger Query Service.

### gRPC/Protobuf (stable)

The recommended way for programmatically retrieving traces is via gRPC endpoint defined in [query.proto][query.proto] IDL file (located in the main Jaeger repository, similar to [collector.proto][collector.proto]).

### HTTP JSON (restricted)

Jaeger UI communicates with Jaeger Query Service via JSON API. For example, a trace can be retrieved via GET request to https://jaeger-query:16686/api/traces/{trace-id-hex-string}. This JSON API is intentionally undocumented and subject to change (see [jaeger/issues/1234](TODO-link)).

## Clients configuration

Client libraries not only submit finished spans to Jaeger backend, but also periodically poll the Agents for various configurations, such as sampling strategies. The schema for the payload is defined by [sampling.thrift][sampling.thrift], encoded as JSON using Thrift's built-in JSON generation capabilities.

## Service dependencies graph

Can be retrieved from Query Service at `/api/dependencies` endpoint. The GET request expects two parameters:

* `endTs` (number of milliseconds since epoch) - the end of the time interval
* `lookback` (in milliseconds) - the length the time interval (i.e. start-time + lookback = end-time).

[jaeger.thrift]: TODO-link
[agent.thrift]: TODO-link
[sampling.thrift]: TODO-link
[collector.proto]: TODO-model/proto/api_v2/collector.proto
[query.proto]: TODO-model/proto/api_v2/query.proto
[jaeger-idl]: https://github/com/jaegertracing/jaeger-idl/
