---
title: Introduction
weight: 1
children:
- title: Getting Started
  url: getting-started
- title: Features
  url: features
- title: Migration
  url: migration
---

Welcome to Jaeger's documentation! Below, you'll find information for beginners and experienced Jaeger users. If you cannot find what you are looking for, or have an issue not covered here, we'd love to [hear from you](/get-in-touch).

## About

Jaeger is a distributed tracing platform released as open source by [Uber Technologies](http://uber.github.io) in 2016 and donated to [Cloud Native Computing Foundation](https://cncf.io/) where it is a graduated project.

With Jaeger you can:

* Monitor and troubleshoot distributed workflows
* Identify performance bottlenecks
* Track down root causes
* Analyze service dependencies

### Learn More

If you are new to distributed tracing, we recommend the following external resources:
  * [Mastering Distributed Tracing (2019)](https://shkuro.com/books/2019-mastering-distributed-tracing/) by [Yuri Shkuro](https://shkuro.com), creator of Jaeger. The book provides in-depth coverage of many aspects of Jaeger design and operations, as well as distributed tracing in general.
  * [Take Jaeger for a HotROD ride](https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2), a step-by-step tutorial that demonstrates how to use Jaeger to solve application performance problems.
  * [Introducing Jaeger](https://www.shkuro.com/talks/2018-01-16-introducing-jaeger-1.0/), an (old) webinar that introduces Jaeger and its capabilities.
  * [Evolving Distributed Tracing at Uber](https://eng.uber.com/distributed-tracing/), a blog post that explains the history and reasons for the architectural choices made in Jaeger.

## Features

  * [OpenTracing](https://opentracing.io/)-inspired data model
  * [OpenTelemetry](https://opentelemetry.io/) compatible
  * Multiple built-in storage backends:
    * [Cassandra 4+](./cassandra/)
    * [Elasticsearch 7.x, 8.x](./elasticsearch/)
    * [Badger](./badger/)
    * [Kafka](./kafka/) - as an intermediate buffer
    * [Memory storage](./memory/)
  * Extensibility with custom backends via [Remote Storage API](./storage/#remote-storage)
  * System topology / service dependencies graphs
  * Adaptive sampling
  * Service Performance Monitoring (SPM)
  * Post-collection data processing

See [Features](./features/) page for more details.

## Quick Start

See [Getting Started](./getting-started/).

## Screenshots

### Traces View
[![Traces View](/img/traces-ss.png)](/img/traces-ss.png)

### Trace Detail View
[![Detail View](/img/trace-detail-ss.png)](/img/trace-detail-ss.png)

### Service Performance Monitoring View
[![Service Performance Monitoring](/img/frontend-ui/spm.png)](/img/frontend-ui/spm.png)
