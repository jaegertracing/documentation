---
title: Kafka
hasparent: true
---

* Supported in Jaeger since 1.6.0
* Supported Kafka versions: 0.9+

Kafka can be used as an intermediary buffer between collector and an actual storage.
**jaeger** can be configured to both act as the `collector` for Kafka data before adding it to a Kafka topic and also as a `ingester` to get data from Kafka and forward it to another storage backend.

Writing to Kafka is particularly useful for building post-processing data pipelines.

Kafka also has the following officially supported resources available from the community:
- [Docker container](https://hub.docker.com/r/apache/kafka) for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/bitnami/kafka) by Bitnami
- [Strimzi Kubernetes Operator](https://strimzi.io/)

#### Configuration
##### Collector
In order to collect tracing data and add it to a Kafka topic this [configuration](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-collector.yaml) is what should be used.

##### Ingester
In order to write tracing data which is added to a Kafka topic this [configuration](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester.yaml) is what should be used.

#### Topic & partitions
Unless your Kafka cluster is configured to automatically create topics, you will need to create it ahead of time. You can refer to [the Kafka quickstart documentation](https://kafka.apache.org/documentation/#quickstart_createtopic) to learn how.

You can find more information about topics and partitions in general in the [official documentation](https://kafka.apache.org/documentation/#intro_topics). [This article](https://www.confluent.io/blog/how-to-choose-the-number-of-topicspartitions-in-a-kafka-cluster/) provide more details about how to choose the number of partitions.
