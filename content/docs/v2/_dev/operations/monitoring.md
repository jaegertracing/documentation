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

```bash
curl -s http://jaeger-collector:8888/metrics
```

The following metrics are of special interest:

```
otelcol_receiver_accepted_spans
otelcol_receiver_refused_spans

otelcol_exporter_sent_spans
otelcol_exporter_send_failed_spans
```

The first two metrics describe how many spans are being received by Jaeger. The last two metrics indicate how many spans are being sent to the storage. Under normal conditions the `accepted` and `sent_spans` counters should be close to each other.

The labels on the metrics allow to separate different receivers and exporters. For example, the first metric with all labels might look like this (formatted for readability):

```
otelcol_receiver_accepted_spans{
    receiver="otlp",
    service_instance_id="f91d66c2-0445-42bf-a062-32aaed09facf",
    service_name="jaeger",
    service_version="2.0.0",
    transport="http"
} 44
```

## Internal Observability Control

<!-- Comment: Based on OpenTelemetry Collector v0.123.0+ configuration patterns -->
Jaeger v2 built on OpenTelemetry Collector provides extensive control over internal observability through configuration.

### Debug Logging Configuration

Logs by default go to `stderr` in plain text format. For production deployment log verbosity of `info` or `warning` is recommended.

#### Basic Logging Configuration

```yaml
service:
  telemetry:
    logs:
      level: info        # debug, info, warn, error (production: info or warn)
      encoding: console  # console (default) or json
      output_paths: ["stderr"]
```

#### Development/Debug Logging

```yaml
service:
  telemetry:
    logs:
      level: debug         # Verbose logging for troubleshooting
      development: true    # Development mode formatting
      encoding: json       # Structured logging
      disable_caller: false
      disable_stacktrace: false
```

### Metrics Export and Control

Configure internal metrics collection and export. Jaeger v2 supports multiple approaches:

#### Approach 1: Internal Telemetry Metrics (Recommended)

<!-- Comment: This is the standard OpenTelemetry Collector pattern for internal metrics -->
```yaml
service:
  telemetry:
    resource:
      service.name: jaeger  # Identifies metrics source
    metrics:
      level: detailed  # none, basic, normal, detailed
      readers:
        - pull:
            exporter:
              prometheus:
                host: 0.0.0.0
                port: 8888
```

#### Port Conflict Resolution for Metrics

```yaml
# Kafka ingester configuration (different ports)
service:
  telemetry:
    metrics:
      level: detailed
      readers:
        - pull:
            exporter:
              prometheus:
                host: 0.0.0.0
                port: 8889  # Different port to avoid collector conflict
```

#### Approach 2: Push Metrics to OTLP Backend

<!-- Comment: Useful for centralized metrics collection -->
```yaml
service:
  telemetry:
    metrics:
      level: detailed
      readers:
        - periodic:
            exporter:
              otlp:
                protocol: http/protobuf
                endpoint: https://metrics-backend:4318
                headers:
                  authorization: "Bearer <token>"
```

#### Legacy Configuration Note

**Note:** The `service::telemetry::metrics::address` setting is deprecated as of OpenTelemetry Collector v0.123.0. Use the `readers` configuration shown above instead.

### Internal Tracing Control

> **⚠️ Experimental Feature:** Internal tracing is experimental with no stability guarantees for span names or attributes.

#### Basic Tracing Configuration

```yaml
service:
  telemetry:
    traces:
      level: basic  # none, basic, normal, detailed
```

#### Environment Variables for Trace Control

```bash
# Disable internal tracing completely (recommended for production)
export OTEL_TRACES_SAMPLER=always_off

# Sample 10% of internal traces (for debugging)
export OTEL_TRACES_SAMPLER=parentbased_traceidratio
export OTEL_TRACES_SAMPLER_ARG=0.1
```

#### Export Internal Traces (Experimental)

```yaml
service:
  telemetry:
    traces:
      processors:
        - batch:
      exporter:
        otlp:
          protocol: http/protobuf
          endpoint: https://tracing-backend:4318
```

## Health Checks

<!-- Note: Jaeger v2 released November 12, 2024, built on OpenTelemetry Collector -->
Jaeger v2 supports comprehensive health checking through the OpenTelemetry Collector's Health Check Extension. This extension provides both HTTP and gRPC health check services that monitor component status and pipeline health.

### Basic Health Check Configuration

For basic health monitoring, the minimal configuration is:

```yaml
extensions:
  health_check:
    endpoint: "0.0.0.0:13133"
    path: "/health"

service:
  extensions: [health_check, jaeger_storage, jaeger_query]
```

This provides HTTP health checks at `http://localhost:13133/health` by default.

### Advanced Health Check Configuration with v2 Extension

> **ℹ️ Info:** The Health Check Extension V2 provides enhanced features but may not be available in all OpenTelemetry Collector distributions. Verify availability before using in production.

For production deployments requiring fine-grained health monitoring:

```yaml
extensions:
  healthcheckv2:
    use_v2: true
    component_health:
      include_permanent_errors: false  # Don't fail health checks for permanent errors
      include_recoverable_errors: true # Consider recoverable errors during grace period
      recovery_duration: 5m           # Grace period for recovery from errors
    http:
      endpoint: "0.0.0.0:13133"       # Expose on all interfaces
      status:
        enabled: true
        path: "/health/status"
      config:
        enabled: false                # ⚠️ SECURITY: Only enable for debugging
        path: "/health/config"        # Exposes complete configuration
    grpc:
      endpoint: "localhost:13132"
      transport: "tcp"

service:
  extensions: [healthcheckv2, jaeger_storage, jaeger_query]
```

> **⛔ Security Warning:** The config endpoint exposes the complete collector configuration, including sensitive information like authentication tokens. Only enable for debugging and never expose on non-localhost interfaces.

### Health Check Endpoints
<!-- Relevant & essential to documentation but not necessary to keep, final decision on review -->
#### HTTP Status Endpoint

The status endpoint provides detailed health information:

- **Overall collector health**: `GET /health/status`
- **Pipeline-specific health**: `GET /health/status?pipeline=traces`
- **Verbose output**: `GET /health/status?verbose`

#### HTTP Status Code Mapping

Component statuses map to HTTP status codes as follows:

| Component Status  | HTTP Status Code | Description |
|-------------------|------------------|-------------|
| Starting          | 503 Service Unavailable | Component is starting |
| OK                | 200 OK | Component is healthy |
| RecoverableError  | 200 OK¹ | Transient error, may recover |
| PermanentError    | 200 OK² | Requires human intervention |
| FatalError        | 500 Internal Server Error | Fatal error, will shutdown |
| Stopping/Stopped  | 503 Service Unavailable | Component shutting down |

¹ Returns 500 if `include_recoverable_errors: true` and recovery duration exceeded
² Returns 500 if `include_permanent_errors: true`

#### gRPC Health Check Service

The extension implements the standard [gRPC Health Checking Protocol](https://github.com/grpc/grpc/blob/master/doc/health-checking.md):

- **Check RPC**: `grpc.health.v1.Health/Check`
- **Watch RPC**: `grpc.health.v1.Health/Watch`

Use empty string `""` for overall collector health, or pipeline name (e.g., `"traces"`) for pipeline-specific health.


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

The Jaeger repository includes a [sample set of Prometheus alerting rules](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin). These production-tested alerts cover:

- **Service availability**: Alerts for when Jaeger components are down
- **Performance degradation**: Alerts for high latency and error rates
- **Capacity issues**: Alerts for resource exhaustion and queue saturation
- **Data loss**: Alerts for dropped spans and storage failures

For detailed setup instructions, see the [monitoring mixin documentation](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin).

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
  - job_name: 'jaeger-v2-health'
    static_configs:
      - targets: ['jaeger:13133']  # Health check endpoint
    scrape_interval: 30s
    metrics_path: /health
```

### Troubleshooting

Common scenarios to investigate:

#### High Resource Usage
- Check goroutine counts and memory usage patterns through Go runtime metrics
- Review OpenTelemetry Collector configuration
- Enable debug logging: `service.telemetry.logs.level: debug`

#### Data Loss (Refused/Failed Spans)
- Check storage backend health and connectivity
- Verify exporter configuration and connectivity
- Review receiver capacity settings
- Monitor component health status for permanent vs recoverable errors
- Check queue metrics: `otelcol_exporter_queue_size` vs `otelcol_exporter_queue_capacity`

#### Poor Query Performance
- Monitor storage backend performance and resource utilization
- Check for resource contention using system metrics
- Review query patterns and optimize frequently used queries
- Use verbose health checks (`/health?verbose`) to identify problematic components

#### Configuration Issues
- **Development Only**: Use health check config endpoints to verify active configuration (never in production)
- Enable debug logging for configuration validation
- Monitor component status transitions during startup using health check endpoints
- Check logs for configuration parsing errors or warnings