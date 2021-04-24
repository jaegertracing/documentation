---
title: Roadmap
---

The following is only a selection of some of the major features we plan to implement, some of which are near term and some are longer term. We have tried to put these in rough priority as well as having a wishlist at the end. To get a more complete overview of planned features and current work, see the issue trackers for the various repositories, for example, the [Jaeger backend](https://github.com/jaegertracing/jaeger/issues/).

## Aggregated Trace Metrics (ATM)

Aggregated trace metrics can be exported from the OpenTelemetry Collector by [spanmetricsprocessor](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/spanmetricsprocessor) that allows metrics to be calculated from trace data. We are adapting Jaeger to be able to read metrics from a Prometheus compatible backend, but additional backends may be supported. For additional information see [jaeger/pull/2946](https://github.com/jaegertracing/jaeger/pull/2946). 

## Operational Monitoring HomePage

Enhancements to the Jaeger search and homepage to improve not only the user interface but introduce operational metrics including average response time, tansactions per minute, and error rate (R.E.D) to allow Jaeger to be used operationally. For more details see [jaeger/issues/2736](https://github.com/jaegertracing/jaeger/issues/2736).

## Support for OpenSearch

Backend storage support for [OpenSearch](https://opensearch.org/) as a backend database. Today this is fully compatible with ElasticSearch APIs, but these may diverge. OpenSearch is Apache 2.0 licensed and hopefully will be led by a community of contributors, but today is led by AWS. ElasticSearch is SSPL licensed and led by Elastic NV making it no longer an open source project.

## Adaptive Sampling

The most common way of using Jaeger client libraries is with probabilistic sampling which makes a determination
if a new trace should be sampled or not. Sampling is necessary to control the amount of tracing data reaching
the storage backend. There are two issues with the current approach:

  1. Individual microservices have little insight into what the appropriate sampling rate should be.
     For example, 0.001 probability (one trace per second per service instance) might seem reasonable,
     but if the fanout in some downstream services is very high it might flood the tracing backend.
  1. Sampling rates are defined on a per-service basis. If a service has two endpoints with vastly different
     throughputs, then its sampling rate will be driven on the high QPS endpoint, which may leave the low QPS
     endpoint never sampled. For example, if the QPS of the endpoints is different by a factor of 100, and the
     probability is set to 0.001, then the low QPS traffic will have only 1 in 100,000 chance to be sampled.

Currently Jaeger backend allows configuring per-endpoint sampling strategies in a centralized configuration file.
The auto-calculation of the sampling probabilities (the "adaptive" part) is still work in progress.

See issue tracker for more info: [jaeger/issues/365](https://github.com/jaegertracing/jaeger/issues/365). This is also being tracked in OpenTelemetry that has similar requirements: [open-telemetry/opentelemetry-specification/issues/691](https://github.com/open-telemetry/opentelemetry-specification/issues/691)

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

## Wishlist

* Multi-Tenancy ([mailgroup thread](https://groups.google.com/forum/#!topic/jaeger-tracing/PcxftflO4_o))
* Cloud and Multi-DC strategy
* Anomaly detection of flagging of traces
* Baselining of trace metrics
* Alerting
