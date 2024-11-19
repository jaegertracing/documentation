---
title: Architecture
weight: 3
children:
- title: APIs
  url: apis
- title: Sampling
  url: sampling
- title: SPM
  url: SPM
- title: Terminology
  url: terminology
---

Jaeger can be deployed either as an **all-in-one** binary, where all Jaeger backend components
run in a single process, or as a scalable distributed system. There are two main deployment options discussed below.

## Direct to storage

In this deployment Jaeger receives the data from traced applications and writes it directly to storage. The storage must be able to handle both average and peak traffic. Collectors use an in-memory queue to smooth short-term traffic peaks, but a sustained traffic spike may result in dropped data if the storage is not able to keep up.

![Architecture](/img/architecture-v2-2024.png)

## Via Kafka

To prevent data loss between collectors and storage, Kafka can be used as an intermediary, persistent queue. Jaeger can be deployed with OpenTelemetry to handle writing the data to Kafka and pulling it off the queue and writing the data to the storage. Multiple Jaeger instances can be deployed to scale up ingestion; they will automatically partition the load across them.

![Architecture](/img/architecture-v2-kafka-2024.png)

## With OpenTelemetry Collector

You **do not need to use OpenTelemetry Collector**, because **Jaeger** is a customized distribution of the OpenTelemetry Collector with different roles. However, if you already use the OpenTelemetry Collectors, for gathering other types of telemetry or for pre-processing / enriching the tracing data, it __can be placed before__  **Jaeger**. The OpenTelemetry Collectors can be run as an application sidecar, as a host agent / daemon, or as a central cluster.

The OpenTelemetry Collector supports Jaeger's Remote Sampling protocol and can either serve static configurations from config files directly, or proxy the requests to the Jaeger backend (e.g., when using adaptive sampling).

![Architecture](/img/architecture-v2-otel.png)

### OpenTelemetry Collector as a sidecar / host agent

Benefits:

* The SDK configuration is simplified as both trace export endpoint and sampling config endpoint can point to a local host and not worry about discovering where those services run remotely.
* Collector may provide data enrichment by adding environment information, like k8s pod name.
* Resource usage for data enrichment can be distributed across all application hosts.

Downsides:

* An extra layer of marshaling/unmarshaling the data.

### OpenTelemetry Collector as a remote cluster

Benefits:
* Sharding capabilities, e.g., when using [tail-based sampling](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/tailsamplingprocessor/README.md).

Downsides:

* An extra layer of marshaling/unmarshaling the data.

## Jaeger binary components

The Jaeger binary consists of several components, some of which are derived from OpenTelemetry and some are internal. The following diagram has the major components.

![Architecture](/img/architecture-v2-binary.png)

Aside from these components there are sevral other components from OpenTelemetry you can use in the config of the Jaeger binary. Here is the full list of components:

### Jaeger Components

* [Adaptive Sampling Processor](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger/internal/processors/adaptivesampling) Used for [adaptive sampling](../sampling/#adaptive-sampling).

* [Jaeger Storage Exporter](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger/internal/extension/jaegerstorage) - Writes spans to storage.

* [Jaeger Query Extension](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger/internal/extension/jaegerquery) - Run the query API and the Jaeger UI.

* [Jaeger Remote Sampling Extension](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger/internal/extension/remotesampling) - Creates an endpoint for [Remote Sampling](../sampling/#remote-sampling)


### OpenTelemetry Components

#### Recievers
* [OTLP](https://github.com/open-telemetry/opentelemetry-collector/tree/main/receiver/otlpreceiver)	- Recieve spans sent via OpenTelemetry Line Protocol (OTLP)

* [Jaeger](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/jaegerreceiver) - Recieve Jaeger formatted traces transported via grpc or thrift protocols

* [Kafka](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/kafkareceiver) - Recieve spans from Kafka formatted with OpenTelemetry formatting

* [Zipkin](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/zipkinreceiver) - Recieve spans using Zipkin v1 or v2 protocol

#### Processors
* [Batch](https://github.com/open-telemetry/opentelemetry-collector/tree/main/processor/batchprocessor) - Batching spans for better efficiency

* [Tail Sampling](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/tailsamplingprocessor) - Sampling after traces is complete

* [Memory Limiter](https://github.com/open-telemetry/opentelemetry-collector/tree/main/processor/memorylimiterprocessor) - Control memory usage of collector

* [Attributes](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/attributesprocessor) - Filtering spans based on attributes to redact or reduce data volume
	
#### Exporters
* [OTLP HTTP](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/otlphttpexporter) - Send data via OLTP over HTTP

* [OTLP](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/otlpexporter) - Send data over OLTP via gRPC

* [Kafka](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/kafkaexporter/) - Send data to Kafka

* [Prometheus](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/prometheusexporter) - Send metrics to Prometheus

* [Debug](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/debugexporter)	- Debugging tool for pipelines

#### Connectors
* [Span Metrics](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/connector/spanmetricsconnector/) - Convert span data to metrics

* [Forward](https://github.com/open-telemetry/opentelemetry-collector/blob/main/connector/forwardconnector/) - Redirect telemetry between pipelines in the collector (ex: span to metric / span to log)

#### Extensions
* [Health Check v2](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/extension/healthcheckv2extension) - Check the health of the collector

* [zPages](https://github.com/open-telemetry/opentelemetry-collector/tree/main/extension/zpagesextension) - Debugging tool for the collector