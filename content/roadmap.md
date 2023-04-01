---
title: Roadmap
---

The following is only a selection of some of the major features we plan to implement, some of which are near term and some are longer term. We have tried to put these in rough priority as well as having a wishlist at the end. To get a more complete overview of planned features and current work, see the issue trackers for the various repositories, for example, the [Jaeger backend](https://github.com/jaegertracing/jaeger/issues/).

## Support for ClickHouse as a native datasource

Backend storage support for [Clickhouse](https://github.com/ClickHouse/ClickHouse) which is an open-source column-oriented database for OLAP use cases. It is highly efficient and performant for high volumes of ingestion and search making it a good database for tracing and logging data specifically. It can also do aggregates very quickly which will come in handy for several features in Jaeger. [[[Feature]]: ClickHouse as a core storage backend](https://github.com/jaegertracing/jaeger/issues/4196)

## Integration with OpenTelemetry collector

[OpenTelemetry collector](https://opentelemetry.io/docs/collector/getting-started/) is a vendor-agnostic service for receiving, processing and exporting telemetry data. We have decided to rebuild the Jaeger backed components (agent, collector, ingester, all-in-one) on top of OpenTelemetry collector which has several benefits:

* automatic compatibility with OpenTelemetry SDKs
* forward compatibility with OpenTelemetry native data model
* tail-based sampling
* attribute processors
* leverage a larger community

More can be found in the blog post [Jaeger embraces OpenTelemetry collector](https://medium.com/jaegertracing/jaeger-embraces-opentelemetry-collector-90a545cbc24), and the earlier post [Jaeger and OpenTelemetry](https://medium.com/jaegertracing/jaeger-and-opentelemetry-1846f701d9f2) that laid out the project strategy. This work will occur after the Collector and associated APIs are more stable, towards the end of 2021.

The current progress can be tracked via [issues tagged as `area/otel`](https://github.com/jaegertracing/jaeger/issues?q=is%3Aissue+is%3Aopen+label%3Aarea%2Fotel).

# Wish List or Longer Term Goals
## Data Pipeline

Post-collection data pipeline for trace aggregation and data mining based on Apache Flink. Some of this work has been done and can be found in [jaeger-analytics-flink/](https://github.com/jaegertracing/jaeger-analytics-flink)

## AI/ML platform for Jaeger

* Community/SIG for doing ML/AI with tracing/telemetry data.
* ML/AI integration with Jaeger to make it easy for data scientists write and evaluate models
  (e.g Jupyter notebooks).
* A registry of models/post-processing pipelines which derive useful information out of tracing data.

See issue tracker for more info: [jaeger/issues/1639](https://github.com/jaegertracing/jaeger/issues/1639).

## Trace Quality Metrics

When deploying a distributed tracing solution like Jaeger in large organizations
that utilize many different technologies and programming languages,
there are always questions about how much of the architecture is integrated
with tracing, what is the quality of the instrumentation, are there microservices
that are using stale versions of instrumentation libraries, etc.

Trace Quality engine ([jaeger/issues/367](https://github.com/jaegertracing/jaeger/issues/367))
runs analysis on all traces collected in the backend, inspects them for known completeness
and quality problems, and provides summary reports to service owners with suggestions on
improving the quality metrics and links to sample traces that exhibit the issues.

## Dynamic Configuration

We need a dynamic configuration solution ([jaeger/issues/355](https://github.com/jaegertracing/jaeger/issues/355))
that comes in handy in various scenarios:

  * Blacklisting services,
  * Overriding sampling probabilities,
  * Controlling server-side downsampling rate,
  * Black/whitelisting services for adaptive sampling,
  * etc.

## Ideation

* Multi-Tenancy ([mailgroup thread](https://groups.google.com/forum/#!topic/jaeger-tracing/PcxftflO4_o))
* Cloud and Multi-DC strategy
* Flagging of anomalous traces
* Alerting capabilities to complement operational use cases
