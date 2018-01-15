# Features

Jaeger is used for monitoring and troubleshooting microservices-based distributed systems, including:

* Distributed context propagation
* Distributed transaction monitoring
* Root cause analysis
* Service dependency analysis
* Performance / latency optimization

## High Scalability

Jaeger backend is designed to have no single points of failure and to scale with the business needs.
For example, any given Jaeger installation at Uber is typically processing several billions of spans per day.

## Native support for OpenTracing

Jaeger backend, Web UI, and instrumentation libraries have been designed from ground up to support the OpenTracing standard.
  * Represent traces as directed acyclic graphs (not just trees) via [span references](https://github.com/opentracing/specification/blob/master/specification.md#references-between-spans)
  * Support strongly typed span _tags_ and _structured logs_
  * Support general distributed context propagation mechanism via _baggage_

## Multiple storage backends

Jaeger supports two popular open source NoSQL databases as trace storage backends: Cassandra 3.4+ and Elasticsearch 5.x/6.x.
There are ongoing community experiments using other databases, such as ScyllaDB, InfluxDB, Amazon DynamoDB. Jaeger also ships
with a simple in-memory storage for testing setups.

## Modern Web UI

Jaeger Web UI is implemented in Javascript using popular open source frameworks like React. Several performance
improvements have been released in v1.0 to allow the UI to efficiently deal with large volumes of data, and to display
traces with tens of thousands of spans (e.g. we tried a trace with 80,000 spans).

## Cloud Native Deployment

Jaeger backend is distributed as a collection of Docker images. The binaries support various configuration methods,
including command line options, environment variables, and configuration files in multiple formats (yaml, toml, etc.)
Deployment to Kubernetes clusters is assisted by [Kubernetes templates](https://github.com/jaegertracing/jaeger-kubernetes)
and a [Helm chart](https://github.com/kubernetes/charts/tree/master/incubator/jaeger).

## Observability

All Jaeger backend components expose [Prometheus](https://prometheus.io/) metrics by default (other metrics backends are
also supported). Logs are written to standard out using the structured logging library [zap](https://github.com/uber-go/zap).

## Backwards compatibility with Zipkin

Although we recommend instrumenting applications with OpenTracing API and binding to Jaeger client libraries to benefit
from advanced features not available elsewhere, if your organization has already invested in the instrumentation
using Zipkin libraries, you do not have to rewrite all that code. Jaeger provides backwards compatibility with Zipkin
by accepting spans in Zipkin formats (Thrift or JSON v1/v2) over HTTP. Switching from Zipkin backend is just a matter
of routing the traffic from Zipkin libraries to the Jaeger backend.
