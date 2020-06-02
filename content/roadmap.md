---
title: Roadmap
---

The following is only a selection of some of the major features we plan to implement in the near future (6-12 months). To get a more complete overview of planned features and current work, see the issue trackers for the various repositories, for example, the [Jaeger backend](https://github.com/jaegertracing/jaeger/issues/).

## Integration with OpenTelemetry collector

[OpenTelemetry collector](https://opentelemetry.io/docs/collector/about) is a vendor-agnostic service for receiving, processing and exporting telemetry data. We have decided to deprecate the Jaeger backed components (agent, collector, ingester, all-in-one) and migrate its functionality to an implementation based on OpenTelemetry collector which has several benefits:

* forward compatibility with OpenTelemetry native data model
* tail-based sampling
* attribute processors
* [standardized collection pipeline](https://opentelemetry.io/)
* less code to maintain

More can be found in the blog post [Jaeger embraces OpenTelemetry collector](https://medium.com/jaegertracing/jaeger-embraces-opentelemetry-collector-90a545cbc24)

The current progress can be tracked at [jaeger/issues?area/otel](https://github.com/jaegertracing/jaeger/issues?q=is%3Aissue+is%3Aopen+label%3Aarea%2Fotel).

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

See issue tracker for more info: [jaeger/issues/365](https://github.com/jaegertracing/jaeger/issues/365).

## Data Pipeline

Post-collection data pipeline for trace aggregation and data mining based on Apache Flink.

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

## Tail-based Sampling

Jaeger clients implement so-called _head-based sampling_, where a sampling decision is made at the root of the call tree and propagated down the tree along with the trace context. This is done to guarantee consistent sampling of all spans of a given trace (or none of them), because we don't want to make the coin flip at every node and end up with partial/broken traces. However, if 99% of all requests in the system are normal, then 99% of all traces we collect are not very interesting, and the probability of capturing really unusual traces is quite low, because at the start of the trace the platform has very little information for making a sampling decision.

The alternative way to implement sampling is with _tail-based sampling_, a technique employed by some of the commercial vendors today, such as Lightstep, DataDog. With tail-based sampling, 100% of spans are captured from the application, but only stored in memory in a collection tier, until the full trace is gathered and a sampling decision is made. The decision making code has a lot more information now, including errors, unusual latencies, etc. If we decide to sample the trace, only then it goes to disk storage, otherwise we evict it from memory, so that we only need to keep spans in memory for a few seconds on average. Tail-based sampling imposes heavier performance penalty on the traced applications because 100% of traffic needs to be profiled by tracing instrumentation.

You can read more about head-based and tail-based sampling either in Chapter 3 of Yuri Shkuro's book [Mastering Distributed Tracing](https://www.shkuro.com/books/2019-mastering-distributed-tracing/) or in the awesome paper ["So, you want to trace your distributed system? Key design insights from years of practical experience"](http://www.pdl.cmu.edu/PDL-FTP/SelfStar/CMU-PDL-14-102.pdf) by Raja R. Sambasivan, Rodrigo Fonseca, Ilari Shafer, Gregory R. Ganger.

See issue tracker for more info: [jaeger/issues/425](https://github.com/jaegertracing/jaeger/issues/425).

## Long Term Roadmap

* Multi-Tenancy ([mailgroup thread](https://groups.google.com/forum/#!topic/jaeger-tracing/PcxftflO4_o))
* Cloud and Multi-DC strategy
