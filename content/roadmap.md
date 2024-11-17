---
title: Roadmap
---

The following is a summary of the major features we plan to implement.
For more details, see the [Roadmap on GitHub](https://github.com/orgs/jaegertracing/projects/4/views/1?layout=table).

## Implement Storage API v2 that operates on OTLP batches

In OTEL-based Jaeger-v2 we don't want to force OTLP trace data to go through unnecessary transformation into Jaeger's current data model. We want to define a V2 version of the storage API so that the OTLP data can be passed through the receiver-exporter pipeline without additional conversions, for better efficiency.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/5079).

## Helm Chart to support Jaeger-v2 

Develop a comprehensive Helm chart for Jaeger v2 that allows for easy deployment and management of Jaeger v2 components in Kubernetes environments. This chart should provide flexibility in configuration, support various deployment scenarios, and integrate well with the new architecture of Jaeger v2.

For more information see the [issue description](https://github.com/jaegertracing/helm-charts/issues/610).

## Kubernetes Operator to support Jaeger-v2 

Develop a new operator for [Jaeger-v2](https://github.com/jaegertracing/jaeger/issues/4843) that achieves feature parity with the v1 operator while introducing improvements and new capabilities. This new operator will leverage the [OpenTelemetry operator](https://github.com/open-telemetry/opentelemetry-operator) for Jaeger-v2 deployment while maintaining and enhancing the storage management features from the v1 operator.

For more information see the [issue description](https://github.com/jaegertracing/jaeger-operator/issues/2717).

## ClickHouse as a core storage backend

Build first-class support for [ClickHouse ](https://github.com/ClickHouse/ClickHouse) as an official Jaeger backend. ClickHouse is an open-source column-oriented database for OLAP use cases. It is highly efficient and performant for high volumes of ingestion and search making it a good database for tracing and logging data specifically. It can also do aggregates very quickly which will come in handy for several features in Jaeger. 

Benefits to the users:

* Efficient backend
* Powerful search
* Analytics capability, e.g. the possibility to support the APM function (Monitoring tab in Jaeger) directly from ClickHouse

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/4196).

## Add the ability to store/retrieve incomplete/partial spans

Allow clients to export partial spans, to support two use cases:
  * Flush a long running span before it is finished, in case the process crashes before finishing it
  * Enrich existing span with information from other sources, e.g. to record log events not captured via tracing SDK

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/729).

## Renovate Streaming Support

Bring streaming analytics support directly into Jaeger backend, instead of requiring separate Spark/Flink data pipelines.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/5910).

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

