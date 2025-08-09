---
title: Monitoring Jaeger
navtitle: Monitoring
aliases: [../monitoring]
hasparent: true
---

Jaeger v2 inherits comprehensive observability capabilities from the OpenTelemetry Collector. You can monitor Jaeger's internal operations through:

- **Debug Logging**: Detailed logging for troubleshooting storage and component issues
- **Internal Tracing**: Trace Jaeger's own operations to understand performance bottlenecks
- **Metrics**: Monitor key performance indicators and operational health
- **Health Checks**: Automated health monitoring with the Health Check v2 extension

Jaeger itself is a distributed, microservices-based system. If you run it in production, you will likely want to set up adequate monitoring for different components, e.g., to ensure that the backend is not saturated by too much tracing data.

All configuration is done via the OpenTelemetry Collector configuration file. Please refer to [OpenTelemetry Collector documentation](https://opentelemetry.io/docs/collector/internal-telemetry/) for details on configuring the internal telemetry.

## Metrics

Jaeger v2 exposes key metrics via the OpenTelemetry Collector. These metrics help you monitor ingestion, export, and component health.

**Sample curl call:**
```bash
curl -s http://jaeger-collector:8888/metrics
```

**Key metrics:**
```
otelcol_receiver_accepted_spans
otelcol_receiver_refused_spans
otelcol_exporter_sent_spans
otelcol_exporter_send_failed_spans
```

The first two metrics describe how many spans are being received by Jaeger. The last two metrics indicate how many spans are being sent to the storage. Under normal conditions the `accepted` and `sent_spans` counters should be close to each other.

**Key metrics table:**
| Metric | Description | Type |
|--------|-------------|------|
| `otelcol_receiver_accepted_spans` | Spans accepted by receiver | Counter |
| `otelcol_receiver_refused_spans` | Spans refused by receiver | Counter |
| `otelcol_processor_batch_batch_send_size` | Batch size when sent | Histogram |
| `otelcol_exporter_sent_spans` | Spans sent by exporter | Counter |
| `otelcol_exporter_send_failed_spans` | Failed span exports | Counter |
| `otelcol_exporter_queue_size` | Export queue size | Gauge |
| `otelcol_exporter_queue_capacity` | Export queue capacity | Gauge |

**Metric labels example:**
```
otelcol_receiver_accepted_spans{
    receiver="otlp",
    service_instance_id="f91d66c2-0445-42bf-a062-32aaed09facf",
    service_name="jaeger",
    service_version="2.0.0",
    transport="http"
} 44
```

### Metrics Configuration

Configure metrics collection and export:

```yaml
service:
  telemetry:
    metrics:
      level: detailed
      address: 0.0.0.0:8888

exporters:
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: jaeger
    const_labels:
      deployment: production
      version: "2.0.0"
  otlp/metrics:
    endpoint: http://otel-collector:4317
    tls:
      insecure: true
```

## Logging

Logs by default go to `stderr` in plain text format. For production deployment, log verbosity of `info` or `warning` is recommended. Debug logging can be enabled for troubleshooting.

### Debug Logging

#### Storage Debug Logging
Enable debug logging for Jaeger's storage operations:

```yaml
service:
  telemetry:
    logs:
      level: debug
      development: true
      encoding: console
      disable_caller: false
      disable_stacktrace: false
    resource:
      service.name: jaeger
      service.version: "2.0.0"
```

#### Component-Specific Debug Logging
Configure debug logging with processor settings:

```yaml
service:
  telemetry:
    logs:
      level: debug
      development: true
      encoding: console
      disable_caller: false
      disable_stacktrace: false

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048
  memory_limiter:
    limit_mib: 1000
    spike_limit_mib: 500
    check_interval: 5s
```

#### Environment Variable Override
Alternative log level configuration for deployments:

```yaml
# Docker/Kubernetes deployment
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: jaeger-collector
        env:
        - name: OTEL_LOG_LEVEL
          value: "debug"
```

#### Storage Backend Specific Logging

**Elasticsearch:**
```yaml
exporters:
  elasticsearch:
    endpoints: ["http://elasticsearch:9200"]
    traces_index: jaeger-traces-{2006-01-02}
    logs_index: jaeger-logs-{2006-01-02}
    sending_queue:
      enabled: true
      num_consumers: 10
      queue_size: 1000
```

**OpenSearch:**
```yaml
exporters:
  opensearch:
    http:
      endpoints: ["https://opensearch:9200"]
      tls:
        insecure_skip_verify: true
    dataset: traces
```

## Traces

Jaeger has the ability to trace some of its own components, namely the requests to the Query service. For example, if you start `all-in-one` as described in [Getting Started](../../getting-started/), and refresh the UI screen a few times, you will see `jaeger` populated in the Services dropdown.

Self-tracing can be disabled by setting `OTEL_TRACES_SAMPLER=always_off` environment variable.

### Internal Tracing Configuration

#### Enable Self-Tracing
Configure Jaeger to trace its own operations:

```yaml
service:
  telemetry:
    traces:
      level: detailed
      processors:
        - batch
        - memory_limiter

processors:
  memory_limiter:
    limit_mib: 512
  batch:
    timeout: 1s
    send_batch_size: 1024

exporters:
  otlp/internal:
    endpoint: http://jaeger-internal:4317
    tls:
      insecure: true
```

#### Trace Sampling for Internal Operations
Control sampling for Jaeger's internal traces:

```yaml
processors:
  probabilistic_sampler:
    sampling_percentage: 1
```

## Health Checks

Jaeger v2 supports health monitoring through OpenTelemetry Collector health check extensions.

### Health Check Extension (Standard)
Basic health monitoring:

```yaml
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
    path: "/health"

service:
  extensions: [health_check]
```

### Health Check v2 Extension (Advanced)
Advanced health monitoring with component-specific checks:

```yaml
extensions:
  health_check/v2:
    endpoint: 0.0.0.0:13133
    path: "/health"
    check_collector_pipeline:
      enabled: true
      interval: 30s
      exporter_failure_threshold: 5

service:
  extensions: [health_check/v2]
```

**Health check endpoints:**
| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /health` | Overall health status | `curl http://localhost:13133/health` |

**Typical health check response:**
```json
{
  "status": "Server available",
  "upSince": "2024-01-15T10:30:00Z",
  "uptime": "2h30m0s"
}
```

**Choosing between extensions:**
- **Standard Health Check**: Use for basic health monitoring needs with minimal configuration
- **Health Check v2**: Use for component-specific checks, advanced monitoring, custom intervals/thresholds

## Complete Configuration Example

Here is a comprehensive OpenTelemetry Collector configuration with all observability features enabled:

```yaml
extensions:
  health_check:
    endpoint: 0.0.0.0:13133
    path: "/health"

receivers:
  jaeger:
    protocols:
      grpc:
        endpoint: 0.0.0.0:14250
      thrift_http:
        endpoint: 0.0.0.0:14268

processors:
  memory_limiter:
    limit_mib: 1000
  batch:
    timeout: 1s
    send_batch_size: 1024
    send_batch_max_size: 2048

exporters:
  elasticsearch:
    endpoints: ["http://elasticsearch:9200"]
    traces_index: jaeger-traces-{2006-01-02}
    sending_queue:
      enabled: true
      num_consumers: 10
      queue_size: 1000
  prometheus:
    endpoint: "0.0.0.0:8889"
    namespace: jaeger

service:
  extensions: [health_check]
  pipelines:
    traces:
      receivers: [jaeger]
      processors: [memory_limiter, batch]
      exporters: [elasticsearch]
    metrics:
      exporters: [prometheus]
  telemetry:
    logs:
      level: info  # Use debug for troubleshooting
    metrics:
      level: detailed
      address: 0.0.0.0:8888
    traces:
      level: detailed
    resource:
      service.name: jaeger-collector
      service.version: "2.0.0"
```

## Monitoring Best Practices

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
Key metrics to monitor for Jaeger v2:

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
Monitor your specific storage backend (Elasticsearch, Cassandra, etc.) according to its documentation

## Integration & Setup

### Prometheus Configuration
Example scrape config for Jaeger v2:

```yaml
scrape_configs:
  - job_name: 'jaeger-v2'
    static_configs:
      - targets: ['jaeger:8888']  # Internal telemetry port
    scrape_interval: 15s
    metrics_path: /metrics
  - job_name: 'jaeger-health-check'
    static_configs:
      - targets: ['jaeger-collector:13133']
    scrape_interval: 30s
    metrics_path: /health
```

#### Key Metrics to Monitor
Set up alerts and dashboards for these critical Jaeger metrics:

| Metric | Alert Threshold | Description |
|--------|----------------|-------------|
| `otelcol_receiver_accepted_spans` | Rate decreasing | Spans being received |
| `otelcol_exporter_send_failed_spans` | > 5% error rate | Failed exports to storage |
| `otelcol_exporter_queue_size` | > 80% capacity | Export queue filling up |
| `up{job="jaeger-health-check"}` | == 0 | Health check failing |

### Prometheus Alerts
The Jaeger repository includes a [sample set of Prometheus alerting rules](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin). These production-tested alerts cover:

- **Service availability**: Alerts for when Jaeger components are down
- **Performance degradation**: Alerts for high latency and error rates
- **Capacity issues**: Alerts for resource exhaustion and queue saturation
- **Data loss**: Alerts for dropped spans and storage failures

For detailed setup instructions, see the [monitoring mixin documentation](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin).

### Grafana Dashboards
Sample PromQL queries:

```promql
# Span ingestion rate
rate(otelcol_receiver_accepted_spans[5m])

# Export error rate
rate(otelcol_exporter_send_failed_spans[5m]) / rate(otelcol_exporter_sent_spans[5m]) * 100

# Queue utilization
otelcol_exporter_queue_size / otelcol_exporter_queue_capacity * 100
```

### Kubernetes Health Probes
Configure probes using the health check extension:

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: jaeger-collector
    image: jaegertracing/jaeger-collector:2.0.0
    ports:
    - containerPort: 13133
      name: health
    livenessProbe:
      httpGet:
        path: /health
        port: 13133
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /health
        port: 13133
      initialDelaySeconds: 5
      periodSeconds: 5
```

## Troubleshooting

### Common Issues
| Issue | Symptoms | Solution |
|-------|----------|----------|
| High memory usage | OOM errors, slow performance | Tune `memory_limiter` processor |
| Storage connection issues | Failed exports, timeouts | Check storage backend health |
| Missing traces | Gaps in trace data | Verify receiver configuration |
| High CPU usage | Slow processing | Optimize batch processor settings |

### Debug Commands
```bash
# Check health status
curl http://localhost:13133/health

# View internal metrics
curl http://localhost:8888/metrics

# Check collector logs (Kubernetes)
kubectl logs deployment/jaeger-collector -f

# Test storage connectivity (Elasticsearch)
curl http://elasticsearch:9200/_cluster/health
```