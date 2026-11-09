---
title: Introduction
linkTitle: 2.dev (preview)
weight: -200 # == -200 - MINOR
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

Jaeger is a distributed tracing platform released as open source by [Uber Technologies](http://uber.github.io) in 2016 and donated to the [Cloud Native Computing Foundation (CNCF)](https://cncf.io/), where it became one of the first graduated projects.

With Jaeger you can:

* Monitor and troubleshoot distributed workflows
* Identify performance bottlenecks
* Track down root causes
* Analyze service dependencies

Jaeger v2, [released in November 2024](https://medium.com/jaegertracing/jaeger-v2-released-09a6033d1b10), is built on the OpenTelemetry Collector framework. The [migration guide](./external-guides/migration/) covers the move from Jaeger v1.

### Relationship with OpenTelemetry

The Jaeger and [OpenTelemetry](https://opentelemetry.io) projects have different goals. OpenTelemetry provides APIs and SDKs in many languages that let applications export telemetry to any number of metrics and tracing backends. Jaeger is such a backend: it receives tracing telemetry and provides processing, aggregation, data mining and visualization of that data. The blog post [Jaeger and OpenTelemetry](https://medium.com/jaegertracing/jaeger-and-opentelemetry-1846f701d9f2) explains the relationship in more detail, and the [Features](./features/#opentelemetry) page describes how Jaeger works with OpenTelemetry data.

### Learn More

If you are new to distributed tracing, we recommend the following external resources:
  * [Mastering Distributed Tracing (2019)](https://shkuro.com/books/2019-mastering-distributed-tracing/) by [Yuri Shkuro](https://shkuro.com), creator of Jaeger. The book provides in-depth coverage of many aspects of Jaeger design and operations, as well as distributed tracing in general.
  * [Take Jaeger for a HotROD ride](https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2), a step-by-step tutorial that demonstrates how to use Jaeger to solve application performance problems.
  * [Introducing Jaeger](https://www.shkuro.com/talks/2018-01-16-introducing-jaeger-1.0/), an (old) webinar that introduces Jaeger and its capabilities.
  * [Evolving Distributed Tracing at Uber](https://eng.uber.com/distributed-tracing/), a blog post that explains the history and reasons for the architectural choices made in Jaeger.

## Where to Go Next
