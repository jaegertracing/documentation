---
title: Kafka
aliases: [../kafka]
hasparent: true
---

* Supported Kafka versions: 3.x

Kafka can be used as an intermediary buffer between **collector** and an actual storage.
Jaeger can be configured to act both as the **collector** that exports trace data into a Kafka topic as well as the **ingester** to read data from Kafka and write it to a storage backend.

{{<mermaid align="center">}}
flowchart LR
    A(Application) --> C@{ shape: procs, label: "Jaeger
      collectors"}
    C --> K@{ img: "/img/kafka.png", w: 120, h: 60 }
    K --> I@{ shape: procs, label: "Jaeger
      ingesters"}
    I --> S[(Storage)]

    style C fill:#9AEBFE,color:black
    style I fill:#9AEBFE,color:black
{{< /mermaid >}}

Writing to Kafka is particularly useful for building post-processing data pipelines.

{{<mermaid align="center">}}
flowchart LR
    A(Application) --> C@{ shape: procs, label: "Jaeger
      collectors"}
    C --> K@{ img: "/img/kafka.png", w: 120, h: 60 }
    K --> I@{ shape: procs, label: "Jaeger
      ingesters"}
    I --> S[(Storage)]
    K --> P@{ shape: stadium, label: "Post-processing" }

    style C fill:#9AEBFE,color:black
    style I fill:#9AEBFE,color:black
{{< /mermaid >}}

Kafka also has the following officially supported resources available from the community:
- [Docker container](https://hub.docker.com/r/apache/kafka) for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/bitnami/kafka) by Bitnami
- [Strimzi Kubernetes Operator](https://strimzi.io/)

## Configuration

Please refer to these sample configuration files:
  * **collector**: [config-kafka-collector.yaml](https://github.com/jaegertracing/jaeger/blob/v2.2.0/cmd/jaeger/config-kafka-collector.yaml)
  * **ingester**: [config-kafka-ingester.yaml](https://github.com/jaegertracing/jaeger/blob/v2.2.0/cmd/jaeger/config-kafka-ingester.yaml)

Jaeger uses Kafka exporter and receiver from `opentelemetry-collector-contrib` repository. Please refer to their respective README's for configuration details.
  * [Kafka exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/kafkaexporter/README.md)
  * [Kafka receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/kafkareceiver/README.md)

## Topic & partitions
Unless your Kafka cluster is configured to automatically create topics, you will need to create it ahead of time. You can refer to [the Kafka quickstart documentation](https://kafka.apache.org/documentation/#quickstart_createtopic) to learn how.

You can find more information about topics and partitions in general in the [official documentation](https://kafka.apache.org/documentation/#intro_topics). [This article](https://www.confluent.io/blog/how-to-choose-the-number-of-topicspartitions-in-a-kafka-cluster/) provide more details about how to choose the number of partitions.
