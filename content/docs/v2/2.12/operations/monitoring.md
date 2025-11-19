---
title: Monitoring Jaeger
navtitle: Monitoring
aliases: [../monitoring]
hasparent: true
---

Jaeger itself is a distributed, microservices based system. If you run it in production, you will likely want to setup adequate monitoring for different components, e.g. to ensure that the backend is not saturated by too much tracing data.

Please refer to [OpenTelemetry Collector documentation](https://opentelemetry.io/docs/collector/internal-telemetry/) for details on configuring the internal telemetry.

## Metrics

Here's a sample `curl` call to obtain the metrics:

```sh
curl -s http://jaeger-collector:8888/metrics
```

The following metrics are of special interest:

```ini
otelcol_receiver_accepted_spans
otelcol_receiver_refused_spans

otelcol_exporter_sent_spans
otelcol_exporter_send_failed_spans
```

The first two metrics describe how many spans are being received by Jaeger. The last two metrics indicate how many spans are being sent to the storage. Under normal conditions the `accepted` and `sent_spans` counters should be close to each other.

The labels on the metrics allow to separate different receivers and exporters. For example, the first metric with all labels might look like this (formatted for readability):

```ini
otelcol_receiver_accepted_spans{
    receiver="otlp",
    service_instance_id="f91d66c2-0445-42bf-a062-32aaed09facf",
    service_name="jaeger",
    service_version="2.0.0",
    transport="http"
} 44
```

## Logging

Logs by default go to `stderr` in plain text format. For production deployment log verbosity of `info` or `warning` is recommended.

## Traces

Jaeger has the ability to trace some of its own components, namely the requests to the Query service. For example, if you start `all-in-one` as described in [Getting Started](../../getting-started/), and refresh the UI screen a few times, you will see `jaeger` populated in the Services dropdown.

Self-tracing can be disabled by setting `OTEL_TRACES_SAMPLER=always_off` environment variable.

## Monitoring Best Practices

When running Jaeger in production, comprehensive monitoring is essential to ensure optimal performance and reliability. This section covers key metrics and monitoring strategies.

### Process-Level Metrics

Monitor these fundamental system metrics for all Jaeger components:

#### System Resources
- **CPU Usage**: Monitor CPU utilization to detect performance bottlenecks
- **Memory Usage**: Track both RSS and virtual memory consumption
- **File Descriptors**: Monitor open file descriptor count
- **Network Usage**: Monitor network I/O for data ingestion and storage operations

#### Disk I/O (for components with local storage)
- **Disk Usage**: Monitor disk space utilization
- **Disk I/O**: Track read/write operations per second and latency

### Go Runtime Metrics

Jaeger v2 components are built on OpenTelemetry Collector, which exposes standard Go runtime metrics:

#### Garbage Collection
- **GC Duration**: Monitor garbage collection pause times
- **GC Frequency**: Track how often garbage collection occurs

#### Goroutines
- **Goroutine Count**: Monitor the number of active goroutines
- **Goroutine Growth**: Watch for unexpected increases that may indicate leaks

#### Memory Statistics
- **Heap Usage**: Monitor Go heap memory usage
- **Memory Allocations**: Track allocation patterns

### OpenTelemetry Collector Metrics

Jaeger v2 is built on OpenTelemetry Collector. The key metrics to monitor are:

#### Span Processing
- **Span Ingestion**: Monitor spans received
  - `otelcol_receiver_accepted_spans`: Total spans accepted by receivers
  - `otelcol_receiver_refused_spans`: Spans refused (indicates data loss)
- **Span Export**: Monitor spans sent to storage
  - `otelcol_exporter_sent_spans`: Successfully exported spans
  - `otelcol_exporter_send_failed_spans`: Failed export attempts

#### Component Health
- **Receiver Health**: Monitor data ingestion components by receiver type
- **Exporter Health**: Monitor storage export components by storage backend

### Query Performance

Monitor Jaeger query service performance:

#### Response Times
- **Query Latency**: Monitor UI and API query response times
- **Query Volume**: Track query patterns and frequency

#### Storage Backend
- Monitor your specific storage backend (Elasticsearch, Cassandra, etc.) according to its documentation

### Prometheus Alerts

The Jaeger repository includes a [sample set of Prometheus alerting rules](https://github.com/jaegertracing/jaeger/tree/v2.12.0/monitoring/jaeger-mixin). These production-tested alerts cover:

- **Service availability**: Alerts for when Jaeger components are down
- **Performance degradation**: Alerts for high latency and error rates
- **Capacity issues**: Alerts for resource exhaustion and queue saturation
- **Data loss**: Alerts for dropped spans and storage failures

For detailed setup instructions, see the [monitoring mixin documentation](https://github.com/jaegertracing/jaeger/tree/v2.12.0/monitoring/jaeger-mixin).

### Monitoring Tools Integration

#### Prometheus Configuration
Example Prometheus scrape configuration for Jaeger v2:

```yaml
scrape_configs:
  - job_name: 'jaeger-v2'
    static_configs:
      - targets: ['jaeger:8888']  # Internal telemetry port
    scrape_interval: 15s
    metrics_path: /metrics
```

### Health Checks

Implement health checks for:

#### Application Health
- Verify OpenTelemetry Collector pipeline health
- Check storage connectivity
- Validate receiver endpoint availability

#### Dependency Health
- Monitor storage backend health according to your storage system's documentation
- Check network connectivity between components

### Troubleshooting

Common scenarios to investigate:

#### High Resource Usage
- Check goroutine counts and memory usage patterns
- Review OpenTelemetry Collector configuration

#### Data Loss (Refused/Failed Spans)
- Check storage backend health and connectivity
- Verify exporter configuration
- Review receiver capacity settings

#### Poor Query Performance
- Monitor storage backend performance
- Check for resource contention
- Review query patterns
