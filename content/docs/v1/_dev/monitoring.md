---
title: Monitoring Jaeger
navtitle: Monitoring
weight: 8
---

Jaeger itself is a distributed, microservices based system. If you run it in production, you will likely want to setup adequate monitoring for different components, e.g. to ensure that the backend is not saturated by too much tracing data.

## Metrics

By default Jaeger microservices expose metrics in Prometheus format. It is controlled by the following command line options:

* `--admin.http.host-port` the port number where the HTTP admin server is running
* `--metrics-backend` controls how the measurements are exposed. The default value is `prometheus`, another option is `expvar`, the Go standard mechanism for exposing process level statistics.
* `--metrics-http-route` specifies the name of the HTTP endpoint used to scrape the metrics (`/metrics` by default).

Each Jaeger component exposes the metrics scraping endpoint on the admin port:

Component             | Port
--------------------- | ---
**jaeger-collector**  | 14269
**jaeger-query**      | 16687
**jaeger-ingester**   | 14270
**all-in-one**        | 14269

### Prometheus monitoring mixin for Jaeger

The Prometheus monitoring mixin for Jaeger provides a starting point for people wanting to monitor Jaeger using Prometheus, Alertmanager, and Grafana. This includes a prebuilt [dashboard](https://github.com/jaegertracing/jaeger/blob/main/monitoring/jaeger-mixin/dashboard-for-grafana.json). For more information, see [the documentation](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin).

## Logging

Jaeger components only log to standard out, using structured logging library [go.uber.org/zap](https://github.com/uber-go/zap) configured to write log lines as JSON encoded strings, for example:

```json
{"level":"info","ts":1615914981.7914007,"caller":"flags/admin.go:111","msg":"Starting admin HTTP server","http-addr":":14269"}
{"level":"info","ts":1615914981.7914548,"caller":"flags/admin.go:97","msg":"Admin server started","http.host-port":"[::]:14269","health-status":"unavailable"}
```

The log level can be adjusted via `--log-level` command line switch; default level is `info`.

## Traces

Jaeger has the ability to trace some of its own components, namely the requests to the Query service. For example, if you start `all-in-one` as described in [Getting Started](../getting-started/), and refresh the UI screen a few times, you will see `jaeger-all-in-one` populated in the Services dropdown. If you prefer not to see these traces in the Jaeger UI, you can disable them by running Jaeger backend components with `OTEL_TRACES_SAMPLER=always_off` environment variable, for example:

```
docker run -e OTEL_TRACES_SAMPLER=always_off -p 16686:16686 jaegertracing/all-in-one:{{< currentVersion >}}
```

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

Jaeger components are written in Go, making Go runtime metrics crucial for monitoring:

#### Garbage Collection
- **GC Duration**: Monitor garbage collection pause times
- **GC Frequency**: Track how often garbage collection occurs

#### Goroutines
- **Goroutine Count**: Monitor the number of active goroutines
- **Goroutine Growth**: Watch for unexpected increases that may indicate leaks

#### Memory Statistics
- **Heap Usage**: Monitor Go heap memory usage
- **Memory Allocations**: Track allocation patterns

### Jaeger-Specific Metrics

Monitor these Jaeger internal metrics for operational health:

#### Span Processing
- **Span Ingestion**: Monitor spans received and processed
- **Dropped Spans**: Critical metric for data loss detection
  - Monitor for any dropped spans which indicate data loss
  - Common causes: storage unavailability, rate limiting, malformed spans

#### Queue Management
- **Queue Size**: Monitor internal queue depths and capacity
- **Queue Utilization**: Watch for queue saturation patterns

#### Storage Operations
- **Write Performance**: Monitor storage write latency and throughput
- **Write Success/Failure**: Monitor successful vs failed writes
- **Storage Errors**: Monitor storage-specific error rates

#### Query Performance
- **Query Latency**: Monitor UI and API query response times
- **Query Volume**: Monitor query patterns and frequency

### Prometheus Alerts

The Jaeger repository includes a comprehensive set of Prometheus alerting rules in the [monitoring mixin](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin). These production-tested alerts cover:

- **Service availability**: Alerts for when Jaeger components are down
- **Performance degradation**: Alerts for high latency and error rates
- **Capacity issues**: Alerts for resource exhaustion and queue saturation
- **Data loss**: Alerts for dropped spans and storage failures

The monitoring mixin provides:
- **Alert rules** (`alerts.libsonnet`) - Ready-to-use Prometheus alerting rules
- **Grafana dashboards** - Pre-built dashboards for visualization
- **Runbooks** - Documentation for responding to alerts

For detailed setup instructions, see the [monitoring mixin documentation](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin).

### Custom Alerting Considerations

For custom alerting needs beyond the monitoring mixin, consider setting up alerts for:

#### Critical Issues
- Dropped spans indicating data loss
- Storage write failures indicating storage issues
- Service unavailability

#### Performance Issues
- High resource usage (CPU, memory, disk)
- Increased query response times
- Goroutine count growth indicating potential leaks

### Monitoring Tools Integration

#### Prometheus Configuration
Example Prometheus scrape configuration:

```yaml
scrape_configs:
  - job_name: 'jaeger-collector'
    static_configs:
      - targets: ['jaeger-collector:14269']
    scrape_interval: 15s
    metrics_path: /metrics

  - job_name: 'jaeger-query'
    static_configs:
      - targets: ['jaeger-query:16687']
    scrape_interval: 15s
    metrics_path: /metrics
```

#### Grafana Dashboard Recommendations
- Use the official [Jaeger monitoring mixin](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin) as a starting point
- Create custom dashboards for your specific monitoring needs

### Health Checks

Implement health checks for:

#### Application Health
- Verify storage connectivity
- Check queue health and capacity
- Validate configuration integrity

#### Dependency Health
- Monitor storage backend health according to your storage system's documentation
- Check network connectivity between components

### Troubleshooting

Common scenarios to investigate:

#### High Resource Usage
- Check goroutine counts and memory usage patterns
- Review span processing configuration

#### Data Loss (Dropped Spans)
- Check storage backend health and connectivity
- Verify queue capacity and processing rates
- Analyze error logs for specific failure reasons

#### Poor Query Performance
- Monitor storage backend performance
- Check for resource contention
- Review query patterns
