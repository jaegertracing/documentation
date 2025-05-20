---
title: Roadmap
---

The following is a summary of the major features we plan to implement.
For more details, see the [Roadmap on GitHub](https://github.com/orgs/jaegertracing/projects/4/views/1?layout=table).

## Upgrade Storage Backends to V2 Storage API

This is a project proposed as part of LFX Mentorship term https://github.com/jaegertracing/jaeger/issues/6470 ⬅ **read this first**.

## Background
[Jaeger](https://www.jaegertracing.io/) is an open-source, distributed tracing platform designed to monitor and troubleshoot microservices-based systems. A critical component of Jaeger is its storage backends, where traces captured by Jaeger are persisted for querying.

Currently, Jaeger uses a **[v1 Storage API](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v1/api/spanstore/interface.go)**, which operates on a data model specific to Jaeger. Each storage backend implements this API, requiring transformations between Jaeger's proprietary model and the OpenTelemetry Protocol (OTLP) data model, which is now the industry standard.

As part of #5079, Jaeger has introduced the more efficient **[v2 Storage API](https://github.com/jaegertracing/jaeger/tree/main/internal/storage/v2/api/tracestore)**, which natively supports the OpenTelemetry data model (OTLP), allows batching of writes and streaming of results. This effort is part of a broader alignment with the [OpenTelemetry Collector framework](https://github.com/open-telemetry/opentelemetry-collector), tracked under #4843.

## Objective

Upgrade Jaeger storage backends to natively implement the v2 Storage API.
- [ ] Memory
- [ ] Elasticsearch / OpenSearch
- [ ] Badger
- [ ] Cassandra
- [x] gRPC / Remote

The chosen storage backend should be upgraded to fully implement the v2 Storage API in place. For a rough idea of how to upgrade from the v1 model to the OTLP data model, take a look at the PRs in the following issues that do a similar upgrade for other components of Jaeger: 
- https://github.com/jaegertracing/jaeger/issues/5545
- https://github.com/jaegertracing/jaeger/issues/6344

## Desired Outcomes

### Upgrade Memory and Elasticsearch backends

We prioritize these two backends as they are the mostly frequently used with Jaeger and upgrading them paves a path for upgrading other backends.

### Testing
- The storage implementations should be fully covered by unit tests 
- There are already integration tests for the storage backend so all of them should pass without needing to be modified

### Bonus: Upgrade Other Backends
If time permits, upgrade Badger and Cassandra storage backends.

## Risks / Open Questions
- The v2 storage API doesn't have a distinction between primary and archive storage but v1 does. The ultimate plan is to remove the archive storage from the v1 implementation as well. That work effort is being tracked in #6065. We may want to think about how to handle the upgrades for the storages that implement the archive storage in v1 while we work on removing it. We may want to simply ignore the archive part of the storage while we resolve the aforementioned issue if that is possible. 

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/6458).

## [Feature] Support ClickHouse as a core storage backend

Build first-class support for [ClickHouse ](https://github.com/ClickHouse/ClickHouse) as an official Jaeger backend. ClickHouse is an open-source column-oriented database for OLAP use cases. It is highly efficient and performant for high volumes of ingestion and search making it a good database for tracing and logging data specifically. It can also do aggregates very quickly which will come in handy for several features in Jaeger. 

Benefits to the users:

* Efficient backend
* Powerful search
* Analytics capability, e.g. the possibility to support the APM function (Monitoring tab in Jaeger) directly from ClickHouse

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/5058).

## [Feature]: Support Elasticsearch data stream

### Requirement

* https://www.elastic.co/guide/en/elasticsearch/reference/current/data-streams.html
* https://opensearch.org/docs/latest/dashboards/im-dashboards/datastream/

### Proposal

_No response_

### Related issues

* #7150

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/4708).

## Renovate Streaming Support

Bring streaming analytics support directly into Jaeger backend, instead of requiring separate Spark/Flink data pipelines.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/5910).

## Add the ability to store/retrieve incomplete/partial spans

Allow clients to export partial spans, to support two use cases:
  * Flush a long running span before it is finished, in case the process crashes before finishing it
  * Enrich existing span with information from other sources, e.g. to record log events not captured via tracing SDK

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/729).

## AI/ML platform for Jaeger

At the moment doing ML/AI analysis with Jaeger is hard. There is no direct integration with ML/AI platforms and we do not have much knowledge on what models we could build.

* Create Community/SIG for doing ML/AI with tracing/telemetry data.
* Build ML/AI integration with Jaeger to make it easy for data scientists write and evaluate models (e.g Jupyter notebooks).
* Create a registry of models/post-processing pipelines which derive useful information out of tracing data.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/1639).

## Dynamic configuration support

We need a dynamic configuration solution that comes in handy in various scenarios:
  * blacklisting services
  * overriding sampling probabilities
  * controlling server-side downsampling rate
  * black/whitelisting services for adaptive sampling
  * etc.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/355).

