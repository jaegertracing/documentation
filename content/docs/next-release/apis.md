---
title: APIs
hasparent: true
---

Jaeger components implement various APIs for saving or retrieving trace data.

The following labels are used to describe API compatibility guarantees.

* **stable** - the API guarantees backwards compatibility. If breaking changes are going to be made in the future, they will result in a new API version, e.g. `/api/v2` URL prefix or a different namespace in the IDL.
* **internal** - the APIs intended for internal communications between Jaeger components and not recommended for use by external components.
* **deprecated** - the APIs that are only maintained for legacy reasons and will be phased out in the future.

## Span reporting APIs

Agent and Collector are the two components of the Jaeger backend that can receive spans. At this time they support two sets of non-overlapping APIs.

### Thrift over UDP (stable)

The Agent can only receive spans over UDP in Thrift format. The primary API is a UDP packet that contains a Thrift-encoded `Batch` struct defined in [jaeger.thrift][jaeger.thrift] IDL file, located in the [jaeger-idl][jaeger-idl] repository. Most Jaeger Clients use Thrift's `compact` encoding, however some client libraries do not support it (notably, Node.js) and use Thrift's `binary` encoding (sent to  a different UDP port). The Agent's API is defined by [agent.thrift][agent.thrift] IDL file.

For legacy reasons, the Agent also accepts spans in Zipkin format, however, only very old versions of Jaeger clients can send data in that format and it is officially deprecated.

### Protobuf via gRPC (stable)

In a typical Jaeger deployment, Agents receive spans from Clients and forward them to Collectors. Since Jaeger version 1.11 the official and recommended protocol between Agents and Collectors is gRPC with Protobuf as defined in [collector.proto][collector.proto] IDL file.

### Thrift over HTTP (stable)

In some cases it is not feasible to deploy Jaeger Agent next to the application, for example, when the application code is running as AWS Lambda function. In these scenarios the Jaeger Clients can be configured to submit spans directly to the Collectors over HTTP/HTTPS.

The same [jaeger.thrift][jaeger.thrift] payload can be submitted in HTTP POST request to `/api/traces` endpoint, for example, `https://jaeger-collector:14268/api/traces`. The `Batch` struct needs to be encoded using Thrift's `binary` encoding, and the HTTP request should specify the content type header:

```
Content-Type: application/vnd.apache.thrift.binary
```

### JSON over HTTP (n/a)

There is no official Jaeger JSON format that can be accepted by the collector. In the future the Protobuf-generated JSON may be supported.

### Zipkin Formats (stable)

Jaeger Collector can also accept spans in several Zipkin data format, namely JSON v1/v2 and Thrift. The Collector needs to be configured to enable Zipkin HTTP server, e.g. on port 9411 used by Zipkin collectors. The server enables two endpoints that expect POST requests:

* `/api/v1/spans` for submitting spans in Zipkin JSON v1 or Zipkin Thrift format.
* `/api/v2/spans` for submitting spans in Zipkin JSON v2.

## Trace retrieval APIs

Traces saved in the storage can be retrieved by calling Jaeger Query Service.

### gRPC/Protobuf (stable)

The recommended way for programmatically retrieving traces and other data is via gRPC endpoint defined in [query.proto][query.proto] IDL file.

### HTTP JSON (internal)

Jaeger UI communicates with Jaeger Query Service via JSON API. For example, a trace can be retrieved via GET request to `https://jaeger-query:16686/api/traces/{trace-id-hex-string}`. This JSON API is intentionally undocumented and subject to change.

## Clients configuration (internal)

Client libraries not only submit finished spans to Jaeger backend, but also periodically poll the Agents for various configurations, such as sampling strategies. The schema for the payload is defined by [sampling.thrift][sampling.thrift], encoded as JSON using Thrift's built-in JSON generation capabilities.

## Service dependencies graph (internal)

Can be retrieved from Query Service at `/api/dependencies` endpoint. The GET request expects two parameters:

* `endTs` (number of milliseconds since epoch) - the end of the time interval
* `lookback` (in milliseconds) - the length the time interval (i.e. start-time + lookback = end-time).

The returned JSON is a list of edges represented as tuples `(caller, callee, count)`.

For programmatic access to service graph, the recommended API is gRPC/Protobuf described above.

[jaeger-idl]: https://github.com/jaegertracing/jaeger-idl/
[jaeger.thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[agent.thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/agent.thrift
[sampling.thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/sampling.thrift
[collector.proto]: https://github.com/jaegertracing/jaeger-idl/blob/master/proto/api_v2/collector.proto
[query.proto]: https://github.com/jaegertracing/jaeger-idl/blob/master/proto/api_v2/query.proto
