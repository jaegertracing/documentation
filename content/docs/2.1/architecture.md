---
title: Architecture
weight: 3
children:
- title: APIs
  url: apis
- title: Sampling
  url: sampling
- title: SPM
  url: spm
- title: Terminology
  url: terminology
---

Jaeger v2 is designed to be a versatile and flexible tracing platform. It can be deployed as a single binary that can be configured to perform different roles within the Jaeger architecture, such as:
  * **collector**: Receives incoming trace data from applications and writes it into a storage backend.
  * **query**: Serves the APIs and the user interface for querying and visualizing traces.
  * **ingester**: Ingests spans from Kafka and writes them into a storage backend; useful when running in a [split collector-Kafka-ingester configuration](./#via-kafka).
  * **all-in-one**: Collector and query roles in a single process.
  * **agent**: A host agent or a sidecar that runs next to the application and forwards trace data to the collector. While Jaeger can be configured for this role, we recommend using the standard [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) instead because you may likely need it to process other types of telemetry (metrics & logs).

Choosing between the **all-in-one** and the **collector**/**query** configurations is a matter of preference. When using external storage backend, both configurations are horizontally scalable, but the **collector**/**query** configuration allows to separate the read and write traffic and to scale them independently, as well as to apply different access and security policies.

The **all-in-one** configuration with in-memory storage is most suitable for development and testing, but it is not recommended for production since the data is lost on restarts. **all-in-one** with the [Badger](../badger/) backend _can_ be used in production, but only for modest data volumes since it is limited to a single instance and cannot be scaled horizontally.

## Architecture choices

The two most common deployment options for a scalable Jaeger backend are direct-to-storage and using Kafka as a buffer.

### Direct to storage

In this deployment the **collector**s receive the data from traced applications and write it directly to storage. The storage must be able to handle both average and peak traffic. The **collector**s may use an in-memory queue to smooth short-term traffic peaks, but a sustained traffic spike may result in dropped data if the storage is not able to keep up.

[![Architecture](/img/architecture-v2-2024.png)](/img/architecture-v2-2024.png)

### Via Kafka

To prevent data loss between **collector**s and storage, Kafka can be used as an intermediary, persistent queue. The **collector**s are configured with Kafka exporters. An additional component, **ingester**, needs to be deployed to read data from Kafka and save it to storage. Multiple **ingester**s can be deployed to scale up ingestion; they will automatically partition the load across them. In practice, an **ingester** is very similar to a **collector**, only configured with a Kafka receiver instead of RPC-based receivers.

[![Architecture](/img/architecture-v2-kafka-2024.png)](/img/architecture-v2-kafka-2024.png)

## With OpenTelemetry Collector

You **do not need** to use the OpenTelemetry Collector to operate Jaeger, because Jaeger is a customized distribution of the OpenTelemetry Collector with different roles. However, if you already use the OpenTelemetry Collectors, for gathering other types of telemetry or for pre-processing / enriching the tracing data, it can be placed _in front of_ Jaeger in the collection pipeline. The OpenTelemetry Collectors can be run as an application sidecar, as a host agent / daemon, or as a central cluster.

The OpenTelemetry Collector supports Jaeger's Remote Sampling protocol and can either serve static configurations from config files directly, or proxy the requests to the Jaeger backend (e.g., when using adaptive sampling).

[![Architecture](/img/architecture-v2-otel.png)](/img/architecture-v2-otel.png)

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

## Jaeger Binary

The Jaeger binary is build on top of the OpenTelemetry Collector framework and includes:
  * Official upstream components, such as OTLP Receiver, Batch and Attribute Processor, etc.
  * Upstream components from `opentelemetry-collector-contrib`, such as Kafka Exporter and Receiver, Tail Sampling Processor, etc.
  * Jaeger own components, such as Jaeger Storage Exporter, Jaeger Query Extension, etc.

[![Architecture](/img/architecture-v2-binary.png)](/img/architecture-v2-binary.png)

### Jaeger Components

* [Jaeger Storage Extension](https://github.com/jaegertracing/jaeger/tree/v2.1.0/cmd/jaeger/internal/extension/jaegerstorage) - Extensible hub for storage backends supported in Jaeger. It provides all other Jaeger components access to Jaeger storage implementations.

* [Jaeger Storage Exporter](https://github.com/jaegertracing/jaeger/tree/v2.1.0/cmd/jaeger/internal/extension/jaegerstorage) - Writes spans to storage backend configured in the Jaeger Storage Extension.

* [Jaeger Query Extension](https://github.com/jaegertracing/jaeger/tree/v2.1.0/cmd/jaeger/internal/extension/jaegerquery) - Run the query APIs and the Jaeger UI.

* [Adaptive Sampling Processor](https://github.com/jaegertracing/jaeger/tree/v2.1.0/cmd/jaeger/internal/processors/adaptivesampling) - Performs probabilities calculations for [adaptive sampling](../sampling/#adaptive-sampling).

* [Remote Sampling Extension](https://github.com/jaegertracing/jaeger/tree/v2.1.0/cmd/jaeger/internal/extension/remotesampling) - Serves the endpoints for [Remote Sampling](../sampling/#remote-sampling), based on static configuration file or [adaptive sampling](../sampling/#adaptive-sampling).

### OpenTelemetry Components

#### Receivers

* [OTLP](https://github.com/open-telemetry/opentelemetry-collector/tree/main/receiver/otlpreceiver)	- Accepts spans sent via OpenTelemetry Line Protocol (OTLP).

* [Jaeger](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/jaegerreceiver) - Accepts Jaeger formatted traces transported via gRPC or Thrift protocols.

* [Kafka](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/kafkareceiver) - Accepts spans from Kafka in various formats (OTLP, Jaeger, Zipkin).

* [Zipkin](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/zipkinreceiver) - Accepts spans using Zipkin v1 and v2 protocols.

#### Processors
* [Batch](https://github.com/open-telemetry/opentelemetry-collector/tree/main/processor/batchprocessor) - Batches spans for better efficiency.

* [Tail Sampling](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/tailsamplingprocessor) - Supports advanced post-collection sampling.

* [Memory Limiter](https://github.com/open-telemetry/opentelemetry-collector/tree/main/processor/memorylimiterprocessor) - Supports back-pressure when the collector is overloaded.

* [Attributes](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/attributesprocessor) - Allows filtering, rewriting, and enriching spans with attributes. Can be used to redact sensitive data, reduce data volume, or attach environment information.

#### Exporters
* [OTLP](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/otlpexporter) - Send data in OTLP format via gRPC.

* [OTLP HTTP](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/otlphttpexporter) - Sends data in OTLP format over HTTP.

* [Kafka](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/exporter/kafkaexporter/) - Sends data to Kafka in various formats (OTLP, Jaeger, Zipkin).

* [Prometheus](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/prometheusexporter) - Sends metrics to Prometheus.

* [Debug](https://github.com/open-telemetry/opentelemetry-collector/tree/main/exporter/debugexporter)	- Debugging tool for pipelines.

#### Connectors
* [Span Metrics](https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/connector/spanmetricsconnector/) - Generates metrics from span data.

* [Forward](https://github.com/open-telemetry/opentelemetry-collector/blob/main/connector/forwardconnector/) - Redirects telemetry between pipelines in the collector (ex: span to metric / span to log)

#### Extensions
* [Health Check v2](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/extension/healthcheckv2extension) - Supports health checks.

* [zPages](https://github.com/open-telemetry/opentelemetry-collector/tree/main/extension/zpagesextension) - Exposes internal state of the collector for debugging.
