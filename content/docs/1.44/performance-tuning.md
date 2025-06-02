---
title: Performance Tuning Guide
navtitle: Perf Tuning
description: Tweaking your Jaeger instance to achieve a better performance
weight: 10
---

Jaeger was built from day 1 to be able to ingest huge amounts of data in a resilient way. To better utilize resources that might cause delays, such as storage or network communications, Jaeger buffers and batches data. When more spans are generated than Jaeger is able to safely process, spans might get dropped. However, the defaults might not fit all scenarios.

## Deployment considerations

Although performance tuning the individual components is important, the way Jaeger is deployed can be decisive in obtaining optimal performance.

### Scale the Collector up and down

Use the auto-scaling capabilities of your platform: the Collector is nearly horizontally scalable so that more instances can be added and removed on-demand. A good way to scale up and down is by checking the `jaeger_collector_queue_length` metric: add instances when the length is higher than 50% of the maximum size for extended periods of time. Another metric that can be taken into consideration is `jaeger_collector_in_queue_latency_bucket`, which is a histogram indicating how long spans have been waiting in the queue before a worker picked it up. When the queue latency gets higher over time, it’s a good indication to increase the number of the workers, or to improve the storage performance.

Adding Collector instances is recommended when your platform provides auto-scaling capabilities, or when it's easier to start/stop Collector instances than changing existing, running instances. Scaling horizontally is also indicated when the CPU usage should be spread across nodes.

### Make sure the storage can keep up

Each span is written to the storage by the Collector using one worker, blocking it until the span has been stored. When the storage is too slow, the number of workers blocked by the storage might be too high, causing spans to be dropped. To help diagnose this situation, the histogram `jaeger_collector_save_latency_bucket` can be analyzed. Ideally, the latency should remain the same over time. When the histogram shows that most spans are taking longer and longer over time, it’s a good indication that your storage might need some attention.

### Place the Agents close to your applications

{{< warning >}}
Since the Jaeger client libraries [are deprecated](../client-libraries/) and the OpenTelemetry SDKs are phasing out support for Jaeger Thrift format, the **jaeger-agent** is no longer required or recommended. See the [Architecture](../architecture/) page for alternative deployment options.
{{< /warning >}}

The Agent is meant to be placed on the same host as the instrumented application, in order to avoid UDP packet loss over the network. This is typically accomplished by having one Agent per bare metal host for traditional applications, or as a sidecar in container environments like Kubernetes, as this helps spread the load handled by Agents with the additional advantage of allowing each Agent to be tweaked individually, according to the application’s needs and importance.

### Consider using Apache Kafka as intermediate buffer

Jaeger [can use Apache Kafka](../architecture/) as a buffer between **jaeger-collector** and the actual backing storage (Elasticsearch, Apache Cassandra). This is ideal for cases where the traffic spikes are relatively frequent (prime time traffic) but the storage can eventually catch up once the traffic normalizes. For that, the `SPAN_STORAGE_TYPE` environment variable should be set to `kafka` in  **jaeger-collector**, and **jaeger-ingester** component must be used, reading data from Kafka and writing it to the storage.

In addition to the performance aspects, having spans written to Kafka is useful for building real time data pipeline for aggregations and feature extraction from traces.

The Collectors can still be scaled in the same way as when writing to storage directly. The trace IDs are used as sharding keys for Kafka partitions, such that all spans for a given trace end up in the same partition of the Kafka topic. Each **jaeger-collector** can write to any partition.

**jaeger-ingester**s can also be scaled as needed to sustain the throughput. They will automatically negotiate and rebalance Kafka partitions among them. However, it does not make sense to run more **jaeger-ingester**s than there are partitions in the Kafka topic, as in this case some of **jaeger-ingester**s will be idle.

## Client (Tracer) settings

{{< warning >}}
Jaeger clients have been retired. Please use the OpenTelemetry SDKs.
{{< /warning >}}

The Jaeger Clients are built to have minimal effect to the instrumented application. As such, it has conservative defaults that might not be suitable for all cases. Note that Jaeger Clients can be configured programmatically or via [environment variables](../client-features/).

### Adjust the sampling configuration

Together, the `JAEGER_SAMPLER_TYPE` and `JAEGER_SAMPLER_PARAM` specify how often traces should be "sampled", ie, recorded and sent to the Jaeger backend. For applications generating many spans, setting the sampling type to `probabilistic` and the value to `0.001` (the default) will cause traces to be reported with a 1/1000th chance. Note that the sampling decision is made at the root span and propagated down to all child spans.

For applications with low to medium traffic, setting the sampling type to `const` and value to `1` will cause all spans to be reported. Similarly, tracing can be disabled by setting the value to `0`, while context propagation will continue to work.

Some Clients support the setting `JAEGER_DISABLED` to completely disable the Jaeger Tracer. This is recommended only if the Tracer is behaving in a way that causes problems to the instrumented application, as it will not propagate the context to the downstream services.

{{< info >}}
We recommend setting your clients/SDKs to use the [`remote` sampling strategy](../sampling/#remote-sampling), so that admins can centrally set the concrete sampling strategy for each service.
{{< /info >}}

### Increase in-memory queue size

Most of the Jaeger clients, such as the Java, Go, and C# clients, buffer spans in memory before sending them to the Jaeger Agent/Collector. The maximum size of this buffer is defined by the environment variable `JAEGER_REPORTER_MAX_QUEUE_SIZE` (default value: about `100` spans): the larger the size, the higher the potential memory consumption. When the instrumented application is generating a large number of spans, it’s possible that the queue will be full causing the Client to discard the new spans (metric `jaeger_tracer_reporter_spans_total{result="dropped",}`).

In most common scenarios, the queue will be close to empty (metric: `jaeger_tracer_reporter_queue_length`), as spans are flushed to the Agent or Collector at regular intervals or when a certain size of the batch is reached. The detailed behavior of this queue is described in this [GitHub issue](https://github.com/jaegertracing/jaeger-client-java/issues/607).

Thrift clients also report their dropped spans to the agent.  These are then published by the agent itself as `jaeger_agent_client_stats_spans_dropped_total{cause="full-queue|send-failure|too-large",}`.  This can be useful if client metrics are unavailable for some reason.

### Modify the batched spans flush interval

The Java, Go, NodeJS, Python and C# Clients allow the customization of the flush interval (default value: `1000` milliseconds, or 1 second) used by the reporters, such as the `RemoteReporter`, to trigger a `flush` operation, sending all in-memory spans to the Agent or Collector. The lower the flush interval is set to, the more frequent the flush operations happen. As most reporters will wait until enough data is in the queue, this setting will force a flush operation at periodic intervals, so that spans are sent to the backend in a timely fashion.

When the instrumented application is generating a large number of spans and the Agent/Collector is close to the application, the networking overhead might be low, justifying a higher number of flush operations. When the `HttpSender` is being used and the Collector is not close enough to the application, the networking overhead might be too high so that a higher value for this property makes sense.

## Agent settings

{{< warning >}}
Since the Jaeger client libraries [are deprecated](../client-libraries/) and the OpenTelemetry SDKs are phasing out support for Jaeger Thrift format, the **jaeger-agent** is no longer required or recommended. See the [Architecture](../architecture/) page for alternative deployment options.
{{< /warning >}}

Jaeger Agents receive data from Clients, sending them in batches to the Collector. When not properly configured, it might end up discarding data even if the host machine has plenty of resources.

### Adjust server queue sizes

The set of “server queue size” properties ( `processor.jaeger-binary.server-queue-size`, `processor.jaeger-compact.server-queue-size`, `processor.zipkin-compact.server-queue-size`) indicate the maximum number of span batches that the Agent can accept and store in memory. It’s safe to assume that `jaeger-compact` is the most important processor in your Agent setup, as it’s the only one available in most Clients, such as the Java and Go Clients.

The default value for each queue is `1000` span batches. Given that each span batch has up to 64KiB worth of spans, each queue can hold up to 64MiB worth of spans.

In typical scenarios, the queue will be close to empty (metric `jaeger_agent_thrift_udp_server_queue_size`) as span batches should be quickly picked up and processed by a worker. However, sudden spikes in the number of span batches submitted by Clients might occur, causing the batches to be queued. When the queue is full, the older batches are overridden causing spans to be discarded (metric `jaeger_agent_thrift_udp_server_packets_dropped_total`).

### Adjust processor workers

The set of “processor workers” properties ( `processor.jaeger-binary.workers`, `processor.jaeger-compact.workers`, `processor.zipkin-compact.workers`) indicate the number of parallel span batch processors to start. Each worker type has a default size of `10`. In general, span batches are processed as soon as they are placed in the server queue and will block a worker until the whole packet is sent to the Collector. For Agents processing data from multiple Clients, the number of workers should be increased. Given that the cost of each worker is low, a good rule of thumb is 10 workers per Client with moderate traffic: given that each span batch might contain up to 64KiB worth of spans, it means that 10 workers are able to send about 640KiB concurrently to a Collector.

## Collector settings

The Collector receives data from Clients and Agents. When not properly configured, it might process less data than what would be possible on the same host, or it might overload the host by consuming more memory than permitted.

### Adjust queue size

Similar to the Agent, the Collector is able to receive spans and place them in an internal queue for processing. This allows the Collector to return immediately to the Client/Agent instead of waiting for the span to make its way to the storage.

The setting `collector.queue-size` (default: `2000`) dictates how many spans the queue should support. In the typical scenario, the queue will be close to empty, as enough workers should exist picking up spans from the queue and sending them to the storage. When the number of items in the queue (metric `jaeger_collector_queue_length`) is permanently high, it’s an indication that either the number of workers should be increased or that the storage cannot keep up with the volume of data that it’s receiving. When the queue is full, the older items in the queue are overridden, causing spans to be discarded (metric `jaeger_collector_spans_dropped_total`).

{{< warning >}}
The queue size for the Agent is about _span batches_, whereas the queue size for the Collector is about _individual spans_.
{{< /warning >}}

Given that the queue size should be close to empty most of the time, this setting should be as high as the available memory for the Collector, to provide maximum protection against sudden traffic spikes. However, if your storage layer is under-provisioned and cannot keep up, even a large queue will quickly fill up and start dropping data.

Experimental: starting from Jaeger 1.17, the Jaeger Collector can adjust the queue size automatically based on the memory requirements and average span size. Set the flag `collector.queue-size-memory` to the maximum memory size in MiB that the collector should use, and Jaeger will periodically calculate the ideal queue size based on the average span size it has seen. For safety reasons, the maximum queue size is hard-coded to 1 million records. If you are using this feature, [give us your feedback](/get-in-touch/)!

### Adjust processor workers

Items from the span queue in the Collector are picked up by workers. Each worker picks one span from the queue and persists it to the storage. The number of workers can be specified by the setting `collector.num-workers` (default: `50`) and should be as high as needed to keep the queue close to zero. The general rule is: the faster the backing storage, the lower the number of workers can be. Given that workers are relatively cheap, this number can be increased at will. As a general rule, one worker per 50 items in the queue should be sufficient when the storage is fast. With a `collector.queue-size` of `2000`, having about `40` workers should be sufficient. For slower storage mechanisms, this ratio should be adjusted accordingly, having more workers per queue item.
