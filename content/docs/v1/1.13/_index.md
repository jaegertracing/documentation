---
title: Introduction
linkTitle: '1.13'
weight: -113
children:
- title: Features
  url: features
---

Welcome to Jaeger's documentation portal! Below, you'll find information for beginners and experienced Jaeger users.

If you can't find what you are looking for, or have an issue not covered here, we'd love to [hear from you](/get-in-touch/).

## About

Jaeger, inspired by [Dapper][dapper] and [OpenZipkin](http://zipkin.io),
is a distributed tracing system released as open source by [Uber Technologies][ubeross].
It is used for monitoring and troubleshooting microservices-based distributed systems, including:

* Distributed context propagation
* Distributed transaction monitoring
* Root cause analysis
* Service dependency analysis
* Performance / latency optimization

Uber published a blog post, [Evolving Distributed Tracing at Uber](https://eng.uber.com/distributed-tracing/), where they explain the history and reasons for the architectural choices made in Jaeger. [Yuri Shkuro](https://shkuro.com), creator of Jaeger, also published a book [Mastering Distributed Tracing](https://shkuro.com/books/2019-mastering-distributed-tracing/) that covers in-depth many aspects of Jaeger design and operation, as well as distributed tracing in general.

## Features

  * [OpenTracing](http://opentracing.io/) compatible data model and instrumentation libraries
    * in [Go](https://github.com/jaegertracing/jaeger-client-go), [Java](https://github.com/jaegertracing/jaeger-client-java), [Node](https://github.com/jaegertracing/jaeger-client-node), [Python](https://github.com/jaegertracing/jaeger-client-python)
    and [C++](https://github.com/jaegertracing/cpp-client)
  * Uses consistent upfront sampling with individual per service/endpoint probabilities
  * Multiple storage backends: Cassandra, Elasticsearch, memory.
  * Adaptive sampling (coming soon)
  * Post-collection data processing pipeline (coming soon)

See [Features](./features/) page for more details.

## Technical Specs

  * Backend components implemented in Go
  * React/Javascript UI
  * Supported storage backends:
    * [Cassandra 3.4+](./deployment/#cassandra)
    * [Elasticsearch 5.x, 6.x](./deployment/#elasticsearch)
    * [Kafka](./deployment/#kafka)
    * memory storage

## Quick Start
See [running a docker all in one image](getting-started/#all-in-one).

## Screenshots

### Traces View
[![Traces View](/img/traces-ss.png)](/img/traces-ss.png)

### Trace Detail View
[![Detail View](/img/trace-detail-ss.png)](/img/trace-detail-ss.png)

## Related links

- [Evolving Distributed tracing At Uber Engineering](https://eng.uber.com/distributed-tracing/)
- [Mastering Distributed Tracing](https://shkuro.com/books/2019-mastering-distributed-tracing/)
- [Tracing HTTP request latency in Go with OpenTracing](https://medium.com/opentracing/tracing-http-request-latency-in-go-with-opentracing-7cc1282a100a)
- [Distributed Tracing with Jaeger & Prometheus on Kubernetes](https://blog.openshift.com/openshift-commons-briefing-82-distributed-tracing-with-jaeger-prometheus-on-kubernetes/)
- [Using Jaeger with Istio](https://istio.io/latest/docs/tasks/observability/distributed-tracing/jaeger/)

[dapper]: https://research.google.com/pubs/pub36356.html
[ubeross]: http://uber.github.io

