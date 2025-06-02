---
title: Introduction
linkTitle: '2.0'
weight: -200
children:
- title: Getting Started
  url: getting-started
- title: Features
  url: features
- title: Migration
  url: migration
---

Welcome to Jaeger's documentation! Below, you'll find information for beginners and experienced Jaeger users. If you cannot find what you are looking for, or have an issue not covered here, we'd love to [hear from you](/get-in-touch/).

If you are new to distributed tracing, please take a look at the [Related Links](#related-links) section below.

## About

Jaeger is a distributed tracing platform released as open source by [Uber Technologies][ubeross] and donated to [Cloud Native Computing Foundation](https://cncf.io/) where it is a graduated project.

With Jaeger you can:

* Monitor and troubleshoot distributed workflows
* Identify performance bottlenecks
* Track down root causes
* Analyze service dependencies

Uber published a blog post, [Evolving Distributed Tracing at Uber](https://eng.uber.com/distributed-tracing/), where they explain the history and reasons for the architectural choices made in Jaeger. [Yuri Shkuro](https://shkuro.com), creator of Jaeger, also published a book [Mastering Distributed Tracing](https://shkuro.com/books/2019-mastering-distributed-tracing/) that covers in-depth many aspects of Jaeger design and operation, as well as distributed tracing in general.

## Features

  * [OpenTracing](https://opentracing.io/)-inspired data model
  * [OpenTelemetry](https://opentelemetry.io/) compatible
  * Multiple built-in storage backends: Cassandra, Elasticsearch, OpenSearch, and in-memory
  * Community supported external storage backends via the gRPC plugin: [ClickHouse](https://github.com/jaegertracing/jaeger-clickhouse)
  * System topology graphs
  * Adaptive sampling
  * Service Performance Monitoring (SPM)
  * Post-collection data processing

See [Features](./features/) page for more details.

## Technical Specs

  * Backend components implemented in Go
  * React/Javascript UI
  * Supported storage backends:
    * [Cassandra 4+](./cassandra/)
    * [Elasticsearch 7.x, 8.x](./elasticsearch/)
    * [Badger](./badger/)
    * [Kafka](./kafka/) - as an intermediate buffer
    * [Memory storage](./memory/)
    * Custom backends via [Remote Storage API](./storage/#remote-storage)

## Quick Start

See [Getting Started](./getting-started/).

## Screenshots

### Traces View
[![Traces View](/img/traces-ss.png)](/img/traces-ss.png)

### Trace Detail View
[![Detail View](/img/trace-detail-ss.png)](/img/trace-detail-ss.png)

### Service Performance Monitoring View
![Service Performance Monitoring](/img/frontend-ui/spm.png)

## Related links
- [Take Jaeger for a HotROD ride](https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2) (blog)
- [Evolving Distributed tracing At Uber Engineering](https://eng.uber.com/distributed-tracing/) (blog)
- [Mastering Distributed Tracing](https://shkuro.com/books/2019-mastering-distributed-tracing/) (book)

[ubeross]: http://uber.github.io
