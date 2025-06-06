---
title: Features
hasparent: true
weight: 2
---

Jaeger is used for monitoring and troubleshooting microservices-based distributed systems, including:

* Distributed context propagation
* Distributed transaction monitoring
* Root cause analysis
* Service dependency analysis
* Performance / latency optimization

## High Scalability

Jaeger backend is designed to have no single points of failure and to scale with the business needs.
For example, any given Jaeger installation at Uber is typically processing several billion spans per day.

## Native support for OpenTracing and OpenTelemetry

Jaeger backend, Web UI, and instrumentation libraries have been designed from ground up to support the OpenTracing standard.

* Represent traces as directed acyclic graphs (not just trees) via [span references](https://github.com/opentracing/specification/blob/master/specification.md#references-between-spans)
* Support strongly typed span _tags_ and _structured logs_
* Support general distributed context propagation mechanism via _baggage_

Since v1.35, the Jaeger backend can receive trace data from the OpenTelemetry SDKs in their native [OpenTelemetry Protocol (OTLP)][otlp]. However, the internal data representation and the UI still follow the OpenTracing specification's model.

## Multiple storage backends

Jaeger can be used with a growing a number of storage backends:
* It natively supports popular open source NoSQL databases as trace storage backends: Cassandra 3.4+, Elasticsearch 5.x/6.x/7.x, and OpenSearch 1.0+.
* It integrates via a gRPC API with other well known databases that have been certified to be Jaeger compliant: [ClickHouse](https://github.com/jaegertracing/jaeger-clickhouse).
* There is embedded database support using [Badger](https://github.com/dgraph-io/badger) and simple in-memory storage for testing setups.
* There are ongoing community experiments using other databases you can find more by following [this issue](https://github.com/jaegertracing/jaeger/issues/638).

## Modern Web UI

Jaeger Web UI is implemented in Javascript using popular open source frameworks like React. Several performance improvements have been released in v1.0 to allow the UI to efficiently deal with large volumes of data and display traces with tens of thousands of spans (e.g. we tried a trace with 80,000 spans).

## Cloud Native Deployment

Jaeger backend is distributed as a collection of Docker images. The binaries support various configuration methods,
including command line options, environment variables, and configuration files in multiple formats (yaml, toml, etc.).
Deployment to Kubernetes clusters is assisted by a [Kubernetes operator](https://github.com/jaegertracing/jaeger-operator), [Kubernetes templates](https://github.com/jaegertracing/jaeger-kubernetes)
and a [Helm chart](https://github.com/kubernetes/charts/tree/master/incubator/jaeger).

## Observability

All Jaeger backend components expose [Prometheus](https://prometheus.io/) metrics by default (other metrics backends are
also supported). Logs are written to stdout using the structured logging library [zap](https://github.com/uber-go/zap).

## Backwards compatibility with Zipkin

Although we recommend instrumenting applications with OpenTelemetry, if your organization has already invested in the instrumentation using Zipkin libraries, you do not have to rewrite all that code. Jaeger provides backwards compatibility with Zipkin by accepting spans in Zipkin formats (Thrift, JSON v1/v2 and Protobuf) over HTTP. Switching from a Zipkin backend is just a matter of routing the traffic from Zipkin libraries to the Jaeger backend.

## Topology Graphs

Jaeger UI supports two types of service graphs: **System Architecture** and **Deep Dependency Graph**.

### System Architecture

The "classic" service dependency graph for all services observed in the architecture. The graph represents only one-hop dependencies between services, similar to what one could get from telemetry produced by service meshes. For example, a graph `A - B - C` means that there are some traces that contain network calls between `A` and `B`, and some traces with calls between `B` and `C`. However, it does not mean there are any traces that contain the full chain `A - B - C`, i.e. we cannot say that `A` depends on `C`.

The node granularity of this graph is services only, not service endpoints.

The System Architecture graph can be built on the fly from in-memory storage, or by using Spark or Flink jobs when using distributed storage.

### Deep Dependency Graph

Also known as "Transitive Dependency Graph", where a chain `A -> B -> C` means that `A` has a transitive dependency on `C`. A single graph requires a "focal" service (shown in pink) and only displays the paths passing through that service. Typically, this type of graph does not represent the full architecture of the system, unless there is a service that is connected to everything, e.g. an API gateway, and it is selected as a focal service.

The node granularity of this graph can be changed between services and service endpoints. In the latter mode, different endpoints in the same service will be displayed as separate nodes, e.g. `A::op1` and `A::op2`.

At this time the transitive graph can only be constructed from traces in the search results. In the future there will be a Flink job that will compute the graphs by aggregating all traces.

## Service Performance Monitoring (SPM)

Visualizes aggregated span data in the form of RED (Requests, Errors, Duration) metrics
to highlight services and/or operations with statistically significant request/error rates or
latencies, then leveraging Jaeger's Trace Search capabilities to pinpoint specific
traces belonging to these services/operations.

See [Service Performance Monitoring (SPM)](../deployment/spm/) for more details.

[otlp]: https://opentelemetry.io/docs/reference/specification/protocol/
