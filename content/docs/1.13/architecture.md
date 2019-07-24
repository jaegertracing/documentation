---
title: Architecture
weight: 3
children:
- title: APIs
  url: apis
- title: Sampling
  url: sampling
---

Jaeger's clients adhere to the data model described in the OpenTracing standard. Reading the [specification](https://github.com/opentracing/specification/blob/master/specification.md) will help you understand this section better.

## Terminology

Let's start with a quick refresher on the terminology defined by the [OpenTracing Specification](https://github.com/opentracing/specification/blob/master/specification.md).

### Span

{{< definition "span" >}}

![Traces And Spans](/img/spans-traces.png)

### Trace

{{< definition "trace" >}}

## Components

Jaeger can be deployed either as all-in-one binary, where all Jaeger backend components
run in a single process, or as a scalable distributed system, discussed below. 
There two main deployment options:

  1. Collectors are writing directly to storage.
  2. Collectors are writing to Kafka as a preliminary buffer.

![Architecture](/img/architecture-v1.png)
*Illustration of direct-to-storage architecture*

![Architecture](/img/architecture-v2.png)
*Illustration of architecture with Kafka as intermediate buffer*

This section details the constituent parts of Jaeger and how they relate to each other. It is arranged by the order in which spans from your application interact with them.

### Jaeger client libraries

Jaeger clients are language specific implementations of the [OpenTracing API](http://opentracing.io). They can be used to instrument applications for distributed tracing either manually or with a variety of existing open source frameworks, such as Flask, Dropwizard, gRPC, and many more, that are already integrated with OpenTracing.

An instrumented service creates {{< tip "spans" "span" >}} when receiving new requests and attaches context information ({{< tip "trace" >}} id, span id, and baggage) to outgoing requests. Only ids and baggage are propagated with requests; all other information that compose a span like operation name, logs, etc. are not propagated. Instead sampled spans are transmitted out of process asynchronously, in the background, to Jaeger Agents.

The instrumentation has very little overhead, and is designed to be always enabled in production.

Note that while all {{< tip "traces" "trace" >}} are generated, only a few are sampled. Sampling a trace marks the trace for further processing and storage.
By default, Jaeger client samples 0.1% of traces (1 in 1000), and has the ability to retrieve sampling strategies from the agent.

![Context propagation explained](/img/context-prop.png)
*Illustration of context propagation*

### Agent

{{< definition "agent" >}}

### Collector

{{< definition "collector" >}}

### Query

{{< definition "query" >}}

### Ingester

{{< definition "ingester" >}}
