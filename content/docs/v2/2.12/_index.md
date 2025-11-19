---
title: Introduction
linkTitle: 2.12 (latest)
weight: -212
children:
- title: Getting Started
  url: getting-started
- title: Features
  url: features
sidebar_root_for: self
aliases: [next-release-v2]
cascade: { robots: true }
---

Welcome to Jaeger's documentation! Below, you'll find information for beginners and experienced Jaeger users. If you cannot find what you are looking for, or have an issue not covered here, we'd love to [hear from you](/get-in-touch/).

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

### Jaeger v2

(2024-11-12) Jaeger has had a successful 9 year history as the leading open source distributed tracing platform strongly aligned with industry standardization efforts such as OpenTracing and OpenTelemetry. Jaeger is one of the first graduated projects in the Cloud Native Computing Foundation (CNCF). After over 60 releases, Jaeger is celebrating a major milestone with the release of **Jaeger v2**. This is a new architecture that utilizes OpenTelemetry Collector framework as the base and extends it to implement Jaeger’s unique features. It brings significant improvements and changes, making Jaeger more flexible, extensible, and better aligned with the OpenTelemetry project. Read [full post here](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10).

Please refer to [Migration guide](./external-guides/migration/) for details on migrating from Jaeger v1.

## Features

  * [OpenTracing](https://opentracing.io/)-inspired data model
  * [OpenTelemetry](https://opentelemetry.io/) compatible
  * Multiple built-in storage backends:
    * [Elasticsearch](./storage/elasticsearch/) and [OpenSearch](./storage/opensearch/)
    * [Cassandra](./storage/cassandra/)
    * [Badger](./storage/badger/) (single node, local file storage)
    * [Kafka](./storage/kafka/) (as an intermediate buffer)
    * [Memory storage](./storage/memory/)
  * Extensibility with custom backends via [Remote Storage API](./storage/#remote-storage)
  * System topology / service dependencies graphs
  * Adaptive sampling
  * Service Performance Monitoring (SPM)
  * Post-collection data processing

See [Features](./features/) page for more details.

### Relationship with OpenTelemetry

The Jaeger and [OpenTelemetry](https://opentelemetry.io) projects have different goals. OpenTelemetry aims to provide APIs and SDKs in multiple languages to allow applications to export various telemetry data out of the process, to any number of metrics and tracing backends. The Jaeger project is primarily the tracing backend that receives tracing telemetry data and provides processing, aggregation, data mining, and visualizations of that data. For more information please refer to a blog post [Jaeger and OpenTelemetry](https://medium.com/jaegertracing/jaeger-and-opentelemetry-1846f701d9f2).

Jaeger was originally designed to support the [OpenTracing standard](https://opentracing.io/specification/). The terminology is still used in Jaeger UI, but the concepts have direct mapping to the OpenTelemetry data model of traces.

| Capability    | OpenTracing concept | OpenTelemetry concept |
| ------------- | ------------------- | --------------------- |
| Represent traces as directed acyclic graphs (not just trees)  | [span references](https://github.com/opentracing/specification/blob/master/specification.md#references-between-spans) | [span links](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/trace/api.md#span) |
| Strongly typed span attributes  | span tags | span attributes |
| Strongly typed events/logs  | span logs | span events |

## Quick Start

See [Getting Started](./getting-started/).

## Screenshots

### Traces View
[![Traces View](/img/traces-ss.png)](/img/traces-ss.png)

### Trace Detail View
[![Detail View](/img/trace-detail-ss.png)](/img/trace-detail-ss.png)

### Service Performance Monitoring View
[![Service Performance Monitoring](/img/frontend-ui/spm.png)](/img/frontend-ui/spm.png)
