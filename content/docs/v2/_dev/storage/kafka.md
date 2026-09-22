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
  * **collector**: [config-kafka-collector.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-collector.yaml)
  * **ingester**: [config-kafka-ingester.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester.yaml)

Jaeger uses Kafka exporter and receiver from `opentelemetry-collector-contrib` repository. Please refer to their respective README's for configuration details.
  * [Kafka exporter](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/kafkaexporter/README.md)
  * [Kafka receiver](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/receiver/kafkareceiver/README.md)

## Topic & partitions
Unless your Kafka cluster is configured to automatically create topics, you will need to create it ahead of time. You can refer to [the Kafka quickstart documentation](https://kafka.apache.org/documentation/#quickstart_createtopic) to learn how.

You can find more information about topics and partitions in general in the [official documentation](https://kafka.apache.org/documentation/#intro_topics). [This article](https://www.confluent.io/blog/how-to-choose-the-number-of-topicspartitions-in-a-kafka-cluster/) provide more details about how to choose the number of partitions.

## At-least-once delivery

With the default ingester configuration the Kafka receiver commits an offset as soon as the pipeline accepts the record, and the pipeline accepts it before the storage has written it, so a backend outage loses spans that Kafka considers delivered. The ingester can instead be configured so that an offset is committed only after the spans it covers are durable. The pipeline half of that configuration, no `batch` processor and an exporter queue with `wait_for_result: true`, is the same for every receiver and is described on the [Delivery Guarantees](../../deployment/delivery-guarantees/#kafka-ingester) page. The Kafka-specific half is:

```yaml
receivers:
  kafka:
    message_marking:
      after: true     # commit the offset only after the pipeline accepted the record
      on_error: false # a failed record is not skipped

exporters:
  jaeger_storage_exporter:
    trace_storage: some_storage
    retry_on_failure:
      enabled: true
      max_elapsed_time: 0 # never give up on a batch; giving up pauses the partition
    queue:
      wait_for_result: true
      block_on_overflow: true # a full queue waits instead of failing the record
```

The storage must return an error when a write fails. Cassandra and ClickHouse always do; Elasticsearch and OpenSearch need [`write_mode: sync`](../elasticsearch/#write-modes), and should run with `poison_pill_handling: drop` or the [dead-letter pipeline](../../deployment/delivery-guarantees/#dead-letter-pipeline-for-rejected-spans) so that a document the backend rejects on every attempt cannot hold the offset forever.

The complete examples are [config-kafka-ingester-sync.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester-sync.yaml) and, with the dead-letter pipeline, [config-kafka-ingester-dead-letter.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester-dead-letter.yaml).

### Sizing

Batch size is bounded by the number of partitions the ingester consumes. The receiver processes each partition serially and partitions concurrently, so at most one record per partition is waiting in the exporter's batcher at a time, and a topic with few partitions produces small storage writes. Add partitions or ingester replicas to increase write throughput; raising `queue.batch.max_size` alone does not help.

For Elasticsearch and OpenSearch, keep `queue.batch.max_size` well below the storage's `bulk_processing.max_bytes`. The collector measures a batch in OTLP protobuf bytes while the storage measures the encoded `_bulk` body, which is larger, so a batch at the limit is otherwise split across several `_bulk` requests. Both values must stay below the `http.max_content_length` limit of Elasticsearch, 100 MB by default.
