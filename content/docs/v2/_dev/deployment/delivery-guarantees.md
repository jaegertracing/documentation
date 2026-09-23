---
title: Delivery Guarantees
hasparent: true
---

This page explains when Jaeger can lose spans between a receiver and the storage backend, and how to configure a pipeline so that it does not. The guarantee is a property of the whole pipeline: the storage must return a truthful result for every write, and every component between the receiver and the storage must wait for that result before it acknowledges the spans. Either half alone is not enough. [ADR-014](https://github.com/jaegertracing/jaeger/blob/main/docs/adr/014-synchronous-elasticsearch-writes.md) records the collector behavior behind this page and the reasoning for its recommendations.

## The storage must report failures

`jaeger_storage_exporter` writes a batch by calling the storage backend and returns whatever the backend returns. Cassandra and ClickHouse write synchronously and return an error when a write fails. Elasticsearch and OpenSearch do so only with `write_mode: sync`; their default `async` mode buffers spans client-side and reports success before anything reached the backend, so a failed flush is logged and lost. Their acknowledgement means the document is durable only while the index keeps the default `index.translog.durability: request`. See [Write Modes](../../storage/elasticsearch/#write-modes) on the Elasticsearch page.

## The pipeline must wait for the result

Two components acknowledge spans before the storage has written them, and either one makes the storage's error irrelevant because nothing upstream ever sees it:

- **The `batch` processor.** It hands each incoming batch to a background goroutine and returns success immediately. When the export of a batch later fails, the processor logs `Sender failed` and discards the batch; the error never reaches the receiver. Jaeger's sample configurations, such as `config.yaml` and `config-elasticsearch.yaml`, include the `batch` processor in their traces pipeline and are therefore not lossless.
- **The exporter's `queue` without `wait_for_result`.** With a `queue` block configured, `jaeger_storage_exporter` enqueues the batch and returns success. Only `wait_for_result: true` makes it block until the batch has been written and return the write's result. Without a `queue` block the exporter writes synchronously, one storage write per incoming batch, and returns the result directly.

The exporter's queue with `wait_for_result: true` and a `batch` block is also the recommended way to batch. It merges the requests that arrive from many clients or many Kafka partitions into one storage write of up to `batch.max_size`, performs that write once, and returns its result to every request that contributed, so the backend sees large writes and every caller still learns whether its spans were stored. `batch.min_size` must be positive, because at its zero value the batcher flushes every request as it arrives and merges nothing; `batch.flush_timeout` bounds the latency that batching adds when traffic is low.

```yaml
exporters:
  jaeger_storage_exporter:
    trace_storage: some_storage
    queue:
      wait_for_result: true
      sizer: bytes
      num_consumers: 4
      queue_size: 104857600
      batch:
        sizer: bytes
        flush_timeout: 200ms
        min_size: 1048576
        max_size: 4194304
```

## What the receiver does with the error

Once the error reaches the receiver, the receiver decides what the guarantee means.

### Direct ingest over OTLP

The OTLP receiver converts the error into an OTLP failure response, gRPC `Unavailable` or HTTP `503`, both of which the OTLP specification marks as retryable. An OpenTelemetry SDK or agent then keeps the batch in its own buffer, backs off, and retries for as long as its own retry budget allows. That budget is finite by default: the OpenTelemetry Go SDK's batch span processor gives an export 30 seconds and its OTLP exporter retries for one minute. The guarantee for direct ingest is therefore that a storage failure is reported to the client instead of being absorbed by the collector; how much of an outage the client rides through is the client's configuration.

Jaeger reports every storage error as retryable, including a document the storage rejects on every attempt. Under Elasticsearch's `poison_pill_handling: fail` a client would keep retrying such a span until its budget ran out, with everything queued behind it waiting, so direct ingest pairs `write_mode: sync` with `poison_pill_handling: drop` or with the [dead-letter pipeline](#dead-letter-pipeline-for-rejected-spans).

`retry_on_failure` stays disabled on the exporter for direct ingest. The client already retries, and a collector-side retry would only hold the client's request open for the whole retry period.

```yaml
service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: []
      exporters: [jaeger_storage_exporter]

exporters:
  jaeger_storage_exporter:
    trace_storage: some_storage
    queue:
      wait_for_result: true
      sizer: bytes
      num_consumers: 4
      queue_size: 104857600
      batch:
        sizer: bytes
        flush_timeout: 200ms
        min_size: 1048576
        max_size: 4194304

extensions:
  jaeger_storage:
    backends:
      some_storage:
        elasticsearch:
          write_mode: sync
          poison_pill_handling: drop
```

Leaving `queue` out entirely is also lossless, with one storage write per client export request. That is adequate when the clients batch well on their own and there are few of them.

### Kafka ingester

The Kafka receiver has a durable buffer behind it, so a returned error can hold the record's offset and the record is redelivered later. One receiver-side setting and two exporter-side settings make that happen:

- **`message_marking.after: true`** makes the receiver mark a record's offset only after the pipeline has processed it. With the default `after: false` the offset is committed before the write, whatever the rest of the pipeline does. `on_error: false`, the default, makes the receiver hold the offset of a record whose processing failed instead of skipping it.
- **`retry_on_failure` with `max_elapsed_time: 0`** on the exporter. `jaeger_storage_exporter` ships with retries disabled, so a failed write would otherwise reach the receiver, which pauses the partition until the next consumer-group rebalance; a single ingester replica never sees that rebalance and the partition stalls for good. The receiver's own `error_backoff` is an alternative: when enabled it retries the failed record in place until its `max_elapsed_time` (unbounded at `0`) and then rewinds the partition to that record without pausing. Retrying in the exporter keeps the retry with the component that saw the failure and re-sends the merged batch instead of re-driving each record through the pipeline. The retry is safe because span writes to Elasticsearch are [idempotent](../../storage/elasticsearch/#idempotent-writes).
- **`queue.block_on_overflow: true`** on the exporter. When the records in flight exceed `queue_size`, the queue otherwise rejects the request with `sending queue is full` before any retry, and the receiver pauses the partition as for any other error. Blocking makes the enqueue wait for room, which is the right behavior for a record Kafka has already handed over. For direct ingest the default `false` is right: a full queue then answers the client with a retryable error, which is the back-pressure signal.

The exporter acknowledges a batch as a whole. By the time the storage write happens, the spans of several Kafka records have been merged into one batch, and the only failures that occur in practice are either the whole backend being unavailable, where retrying the batch is the right response anyway, or a document that fails on every retry. The latter is a poison pill, which under `fail` handling holds the offset forever. `poison_pill_handling: drop` is what makes the ingester safe to run unattended, and the dead-letter pipeline below is the alternative that keeps the rejected spans.

The ingester configuration the Kafka end-to-end tests run against is [config-kafka-ingester-sync.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester-sync.yaml). It is a complete example of this shape; the [Kafka page](../../storage/kafka/#at-least-once-delivery) covers the Kafka-specific settings and sizing.

## Dead-letter pipeline for rejected spans

Instead of dropping spans the storage rejects on every attempt, the pipeline can forward them to a separate pipeline whose exporter keeps them for inspection or repair. `jaeger_storage_exporter` is declared under `connectors:` instead of `exporters:`. The collector then builds it as a traces-to-traces connector that writes each batch to the storage exactly as the exporter does, with the same `queue` and `retry_on_failure` settings, and re-emits the spans the storage rejected terminally onto its output pipeline. The two forms share one component type, and the section an operator declares it in selects the form. A file that needs both forms names one of them, for example `jaeger_storage_exporter/dead_letter`, because the collector rejects the bare ID in both sections. The storage runs with `poison_pill_handling: fail`, because the writer's job is to report the rejection and the connector decides what a rejection means. Today only Elasticsearch and OpenSearch in sync mode report rejected spans in the form the connector needs; behind any other storage the connector writes exactly like the exporter and nothing reaches the dead-letter pipeline.

```yaml
service:
  pipelines:
    traces:
      receivers: [kafka]
      processors: []
      exporters: [jaeger_storage_exporter]
    traces/dead_letter:
      receivers: [jaeger_storage_exporter]
      exporters: [kafka/dead_letter]

connectors:
  jaeger_storage_exporter:
    trace_storage: some_storage
    retry_on_failure:
      enabled: true
      max_elapsed_time: 0
    queue:
      wait_for_result: true # required when a queue is configured
      block_on_overflow: true
      sizer: bytes
      num_consumers: 1
      queue_size: 104857600
      batch:
        sizer: bytes
        flush_timeout: 200ms
        min_size: 1048576
        max_size: 4194304

exporters:
  kafka/dead_letter:
    brokers: [localhost:9092]
    traces:
      topic: jaeger-spans-dead-letter
    sending_queue:
      enabled: false # the connector needs the sink's verdict before it advances the offset
    producer:
      max_message_bytes: 8388608 # a batch's rejected spans are sent as one record

extensions:
  jaeger_storage:
    backends:
      some_storage:
        elasticsearch:
          write_mode: sync
          poison_pill_handling: fail
```

The dead-letter pipeline can end in any standard exporter, such as `kafka` writing to a dead-letter topic, `otlphttp` sending to another collector, or `file`. Two properties of the sink matter:

- **It must deliver synchronously.** The connector acknowledges a batch only after the dead-letter exporter accepted the spans, so that exporter's `sending_queue` must be disabled. A queued exporter acknowledges a span the moment it is enqueued, and the batch would complete over a span the sink does not yet hold. Its `retry_on_failure` settings still apply and cover a short sink outage; once they are exhausted the connector returns the error and the whole batch is retried.
- **It must refuse what it does not keep.** `otlphttp` treats an OTLP partial-success response as success, so a dead-letter endpoint that drops spans that way loses them silently. Point it at a receiver that accepts a request whole or rejects it, as the stock `otlp` receiver does. A `kafka` exporter acknowledges only what the broker stored, on the leader alone under its default `producer.required_acks: 1` or on every in-sync replica with `producer.required_acks: all`, but its `producer.max_message_bytes` must accommodate the rejected spans of a whole batch, which are sent as one record, and the broker's `message.max.bytes` must allow the same size.

Each span forwarded to the dead-letter pipeline is a copy of the original with the attribute `jaeger.storage.rejection_reason` holding the reason the storage gave. The connector logs one warning per distinct rejected trace id and span id pair, with the reason, and counts them in the `jaeger_storage_exporter_dead_letter_spans` metric. A steady trickle on that metric is a few malformed spans, and a sudden rise usually means a mapping change that rejects a whole class of spans. The ingester configuration the Kafka end-to-end tests run against is [config-kafka-ingester-dead-letter.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-kafka-ingester-dead-letter.yaml); it ends in an `otlphttp` sink. The configuration reference is the [connector README](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/internal/exporters/storageexporter/README.md).
