---
title: Roadmap
type: docs
weight: 70
---

The following is a summary of the major features we plan to implement.
For more details, see the [Roadmap on GitHub](https://github.com/orgs/jaegertracing/projects/4/views/1?layout=table).

## Upgrade Storage Backends to V2 Storage API

Currently, Jaeger uses a **[v1 Storage API](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v1/api/spanstore/interface.go)**, which operates on a data model specific to Jaeger. Each storage backend implements this API, requiring transformations between Jaeger's proprietary model and the OpenTelemetry Protocol (OTLP) data model, which is now the industry standard.

As part of #5079, Jaeger has introduced the more efficient **[v2 Storage API](https://github.com/jaegertracing/jaeger/tree/main/internal/storage/v2/api/tracestore)**, which natively supports the OpenTelemetry data model (OTLP), allows batching of writes and streaming of results. This effort is part of a broader alignment with the [OpenTelemetry Collector framework](https://github.com/open-telemetry/opentelemetry-collector), tracked under #4843.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/6458).

## GenAI integration with Jaeger

GenAI can provide powerful capabilities for automatic analysis of tracing data.

There can be multiple product functions, with increasing order of complexity:
  1. Free form question about a single trace. Easiest, needs chat infra in the UI.
    - Ability to use user-provided skills (nice to have). Requires agentic loop.
  1. Automated analysis of a trace. Needs agentic loop & prompt tuning on our side
  1. Free form search query. Needs ability act on the UI elements from agentic loop, and prompt tuning.
  1. Free form investigation. Ultimate, investigation agent, needs lots of prompting.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/7827).

## GenAI Observability

Jaeger will evolve beyond traditional distributed tracing to become the observability backbone for GenAI applications. This means natively handling large, multi-modal payloads with tiered storage and PII sanitization; serving as a registry for evaluation outcomes so quality metrics are traceable to specific agentic steps; enabling dataset curation and prompt/model version analytics directly from trace data; extending the query language to filter on quality scores and user feedback; and optimizing the UI for non-linear agentic workflows with DAG rendering and A/B trace comparison.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/8416).

## Support Elasticsearch/OpenSearch data stream

Data streams are the new hotness in Elasticsearch & OpenSearch to store append-only observability data. Data streams are well-suited for logs, events, metrics, and other continuously generated data.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/4708).

## Renovate Streaming Support

Bring streaming analytics support directly into Jaeger backend, instead of requiring separate Spark/Flink data pipelines.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/5910).

## Add the ability to store/retrieve incomplete/partial spans

Allow clients to export partial spans, to support two use cases:
  * Flush a long running span before it is finished, in case the process crashes before finishing it
  * Enrich existing span with information from other sources, e.g. to record log events not captured via tracing SDK

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/729).

## Dynamic configuration support

We need a dynamic configuration solution that comes in handy in various scenarios:
  * blacklisting services
  * overriding sampling probabilities
  * controlling server-side downsampling rate
  * black/whitelisting services for adaptive sampling
  * etc.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/355).
