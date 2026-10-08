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
      sizer: bytes
      num_consumers: 1
      queue_size: 104857600
      batch:
        sizer: bytes
        flush_timeout: 200ms
        min_size: 1048576
        max_size: 4194304
```

The storage must return an error when a write fails. Cassandra and ClickHouse always do; Elasticsearch and OpenSearch need [`write_mode: sync`](../elasticsearch/#write-modes), and should run with `poison_pill_handling: drop` or the [dead-letter pipeline](../../deployment/delivery-guarantees/#dead-letter-pipeline-for-rejected-spans) so that a document the backend rejects on every attempt cannot hold the offset forever.

The configurations the Kafka end-to-end tests run against are [config-kafka-ingester-sync.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester-sync.yaml) and, with the dead-letter pipeline, [config-kafka-ingester-dead-letter.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester-dead-letter.yaml). Both follow the recommended shape.

### Sizing

With `wait_for_result` set, batch size is bounded by the number of partitions the ingester consumes. The receiver processes each partition serially and partitions concurrently, so at most one record per partition is waiting in the exporter's batcher at a time, and a topic with few partitions produces small storage writes. Add partitions to increase write throughput; raising `queue.batch.max_size` alone does not help. Adding ingester replicas adds processing capacity, up to one replica per partition, but does not enlarge batches: the replicas share the same partitions, so each one owns fewer of them and produces smaller batches.

The receiver's fetch settings (`max_fetch_size`, `max_partition_fetch_size`, `min_fetch_size`, `max_fetch_wait`) control how many bytes a broker returns per fetch and how long it waits to accumulate them, not how many records reach the exporter at once. The receiver makes one pipeline call per fetched record, so a larger fetch only fills the receiver's buffer and does not enlarge the storage write.

For Elasticsearch and OpenSearch, keep `queue.batch.max_size` well below the storage's `bulk_processing.max_bytes`. The collector measures a batch in OTLP protobuf bytes while the storage measures the encoded `_bulk` body, which is larger, so a batch at the limit is otherwise split across several `_bulk` requests. Both values must stay below the `http.max_content_length` limit of Elasticsearch, 100 MB by default.

## Recovering a stalled partition

A partition can stop advancing while the others keep draining. With `message_marking.after: true`, as in the [at-least-once configuration](#at-least-once-delivery), a record that fails with a permanent error is not committed, and its partition stays at that record. Running Elasticsearch or OpenSearch with `poison_pill_handling: drop` or the dead-letter pipeline, as described above, avoids the most common cause.

Restarting the ingester does not help, because it resumes from the committed offset and reads the same data again.

The receiver stops reporting `otelcol_kafka_receiver_offset_lag` for a paused partition, so watch consumer-group lag from the broker side instead, or describe the group:

```sh
kafka-consumer-groups.sh --bootstrap-server <broker> --describe --group otel-collector
```

The ingester's error log names the topic, partition and offset. To skip past the data, stop every ingester in the consumer group, because Kafka resets offsets only for an inactive group. Then move the group's offset for that partition and start the ingesters again:

```sh
# skip one record
kafka-consumer-groups.sh --bootstrap-server <broker> --group otel-collector \
  --topic jaeger-spans:<partition> --reset-offsets --shift-by 1 --execute

# skip several records: move to a given offset
kafka-consumer-groups.sh --bootstrap-server <broker> --group otel-collector \
  --topic jaeger-spans:<partition> --reset-offsets --to-offset <offset> --execute
```

Run the command with `--dry-run` in place of `--execute` first to check the new offset. Spans in the skipped data are not written to storage.
