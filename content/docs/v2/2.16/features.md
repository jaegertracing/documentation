---
title: Features
hasparent: true
weight: 2
---

## High Scalability

Jaeger backend is designed to have no single points of failure and to scale with the business needs. For example, Jaeger installation at Uber is typically processing several billion spans per day.

## Cloud Native

Jaeger backend is distributed as a container image or a raw binary, available for multiple platforms. The behavior of the binary can be customized via YAML configuration file. Deployment to Kubernetes clusters is assisted by a [Kubernetes operator](https://github.com/jaegertracing/jaeger-operator) and a [Helm chart](https://github.com/kubernetes/charts/tree/master/incubator/jaeger).

##  OpenTelemetry

Jaeger backend and Web UI have been designed from ground up to support the OpenTracing standard.

* Represent traces as directed acyclic graphs (not just trees) via [span references](https://github.com/opentracing/specification/blob/master/specification.md#references-between-spans)
* Support strongly typed span _tags_ and _structured logs_

Jaeger can receive trace data in the standard [OpenTelemetry Protocol (OTLP)](https://opentelemetry.io/docs/specs/otel/protocol/). However, the internal data representation and the UI still follow the OpenTracing specification's model.

## Multiple storage backends

Jaeger can be used with a growing number of storage backends:
* It natively supports popular open source NoSQL databases as trace storage backends: Cassandra 4.0+, Elasticsearch 7.x/8.x, and OpenSearch 1.0+.
* It is extensible via the [Remote Storage API](../architecture/apis/#remote-storage-api) with other well known databases that have been certified to be Jaeger compliant: [ClickHouse](https://github.com/jaegertracing/jaeger-clickhouse).
* There is embedded database support using [Badger](https://github.com/dgraph-io/badger) and simple in-memory storage for testing setups.
* There are ongoing community experiments using other databases; you can find more in [this issue](https://github.com/jaegertracing/jaeger/issues/638).

## Sampling

To control the overhead on the applications and the storage costs, Jaeger supports multiple forms of sampling: head-based with centralized remote configuration (static or adaptive) and tail-based sampling. For more information, please refer to the [Sampling](../architecture/sampling/) page.

## Modern Web UI

Jaeger Web UI is implemented in Javascript as a React application. Several performance improvements have been released in v1.0 to allow the UI to efficiently deal with large volumes of data and display traces with tens of thousands of spans (e.g. we tried a trace with 80,000 spans).

## Observability

All Jaeger backend components expose [Prometheus](https://prometheus.io/) metrics by default.
Logs are written to stdout using the structured logging library [zap](https://github.com/uber-go/zap).

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

SPM allows monitoring and investigating trends in the performance of the services by computing aggregate metrics from traces and visualizing them as time series charts. It is a powerful tool to identify and investigate performance issues,

See [Service Performance Monitoring (SPM)](../architecture/spm/) for more details.

## Zipkin Compatibility

Although we recommend instrumenting applications with OpenTelemetry, if your organization has already invested in the instrumentation using Zipkin libraries, you do not have to rewrite all that code. Jaeger provides backwards compatibility with Zipkin by accepting spans in Zipkin formats (Thrift, JSON v1/v2 and Protobuf) over HTTP. Switching from a Zipkin backend is just a matter of routing the traffic from Zipkin libraries to the Jaeger backend.

