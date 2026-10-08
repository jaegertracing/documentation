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
  * **collector**: [config-kafka-collector.yaml](https://github.com/jaegertracing/jaeger/blob/v2.21.0/cmd/jaeger/config-kafka-collector.yaml)
  * **ingester**: [config-kafka-ingester.yaml](https://github.com/jaegertracing/jaeger/blob/v2.21.0/cmd/jaeger/config-kafka-ingester.yaml)

Jaeger uses Kafka exporter and receiver from `opentelemetry-collector-contrib` repository. Please refer to their respective README's for configuration details.
  * [Kafka exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/kafkaexporter/README.md)
  * [Kafka receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/kafkareceiver/README.md)

## Topic & partitions
Unless your Kafka cluster is configured to automatically create topics, you will need to create it ahead of time. You can refer to [the Kafka quickstart documentation](https://kafka.apache.org/documentation/#quickstart_createtopic) to learn how.

You can find more information about topics and partitions in general in the [official documentation](https://kafka.apache.org/documentation/#intro_topics). [This article](https://www.confluent.io/blog/how-to-choose-the-number-of-topicspartitions-in-a-kafka-cluster/) provide more details about how to choose the number of partitions.

## Securing the topic

The ingester writes whatever it reads from the topic into storage, so access to the topic is access to your trace data. A client that can produce to the topic can insert arbitrary spans without going through a collector, and can send record batches that are expensive to process, such as batches that are small on the wire but decompress to a very large size. The receiver's fetch settings limit compressed bytes, not the decompressed size.

* Enable authentication and TLS on the brokers, and configure the matching `auth` and `tls` settings on both the Kafka exporter and the Kafka receiver.
* Enable an authorizer on the brokers, otherwise the ACLs below are not enforced: set `authorizer.class.name` to `org.apache.kafka.metadata.authorizer.StandardAuthorizer` on KRaft clusters, or to `kafka.security.authorizer.AclAuthorizer` on ZooKeeper-based clusters. Keep `allow.everyone.if.no.acl.found` at its default of `false`, so that a resource without any ACL is denied rather than open to everyone, and list the brokers' own principals in `super.users`.
* Give the collectors' principal produce access to the span topic only, and the ingesters' principal consume access to that topic and their consumer group only. The receiver's consumer group is `otel-collector` unless `group_id` is set. With the Kafka ACL tool, for a topic named `jaeger-spans`:

  ```sh
  kafka-acls.sh --bootstrap-server <broker> --add \
    --allow-principal User:jaeger-collector --producer --topic jaeger-spans
  kafka-acls.sh --bootstrap-server <broker> --add \
    --allow-principal User:jaeger-ingester --consumer --topic jaeger-spans --group otel-collector
  ```

* Do not let other applications produce to the span topic. A post-processing pipeline should consume from it, as in the diagram above, not write to it.
