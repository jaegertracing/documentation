---
title: Performance Tuning Guide
navtitle: Perf Tuning
description: Tweaking your Jaeger instance to achieve a better performance
hasparent: true
---

Jaeger was built to be able to ingest huge amounts of data in a resilient way. To better utilize resources that might cause delays, such as storage or network communications, Jaeger buffers and batches data. When more spans are generated than Jaeger is able to safely process, spans might get dropped. However, the defaults might not fit all scenarios.

Since Jaeger v2 is based on the OpenTelemetry Collector, most of the advice in the [Scaling the Collector documentation](https://opentelemetry.io/docs/collector/scaling/) applies to Jaeger as well.

Although performance tuning the individual components is important, the way Jaeger is deployed can be decisive in obtaining optimal performance.

## Scale the Collector up and down

Use the auto-scaling capabilities of your platform: **jaeger-collector** is nearly horizontally scalable so that more instances can be added and removed on-demand.

Adding **jaeger-collector** instances is recommended when your platform provides auto-scaling capabilities, or when it's easier to start/stop **jaeger-collector** instances than changing existing, running instances. Scaling horizontally is also indicated when the CPU usage should be spread across nodes.

## Make sure the storage can keep up

{{< rawhtml >}}<!-- TODO: fix me once the latency metric is available -->{{< /rawhtml >}}
{{< danger >}}
The metric `jaeger_collector_save_latency_bucket` mentioned below is not yet available in Jaeger v2.
{{< /danger >}}

Each span is written to the storage by **jaeger-collector** using one worker, blocking it until the span has been stored. When the storage is too slow, the number of workers blocked by the storage might be too high, causing spans to be dropped. To help diagnose this situation, the histogram `jaeger_collector_save_latency_bucket` can be analyzed. Ideally, the latency should remain the same over time. When the histogram shows that most spans are taking longer and longer over time, it’s a good indication that your storage might need some attention.

## Consider using Kafka as intermediate buffer

Jaeger [can use Apache Kafka](../architecture/) as a buffer between **jaeger-collector** and the actual backing storage (Elasticsearch, Apache Cassandra). This is ideal for cases where the traffic spikes are relatively frequent (prime time traffic) but the storage can eventually catch up once the traffic normalizes. Please refer to the [Kafka page](../kafka/) for details on configuring this deployment.

In addition to the performance aspects, having spans written to Kafka is useful for building real time data pipeline for aggregations and feature extraction from traces.

**jaeger-collector**s can still be scaled in the same way as when writing to storage directly. The trace IDs are used as sharding keys for Kafka partitions, such that all spans for a given trace end up in the same partition of the Kafka topic. Each **jaeger-collector** can write to any partition.

**jaeger-ingester**s can also be scaled as needed to sustain the throughput. They will automatically negotiate and rebalance Kafka partitions among them. However, it does not make sense to run more **jaeger-ingester**s than there are partitions in the Kafka topic, as in this case some of **jaeger-ingester**s will be idle.
