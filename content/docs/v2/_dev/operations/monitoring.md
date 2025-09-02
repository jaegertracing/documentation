---
title: Monitoring Jaeger
navtitle: Monitoring
aliases: [../monitoring]
hasparent: true
---

Jaeger itself is a distributed, microservices based system. If you run it in production, you will likely want to setup adequate monitoring for different components, e.g. to ensure that the backend is not saturated by too much tracing data.

Please refer to [OpenTelemetry Collector documentation](https://opentelemetry.io/docs/collector/internal-telemetry/) for details on configuring the internal telemetry.

## Overview

Jaeger v2 exposes logs, metrics, traces, and health signals via the OpenTelemetry Collector. This document covers:

- How to configure internal observability (logs, metrics, traces, health)
- What to monitor for reliability and performance
- External integrations (Prometheus, Grafana, alerts)
- Troubleshooting common issues

For Jaeger project background and v2 architecture, see the [Jaeger repository README](https://github.com/jaegertracing/jaeger).

## Internal Observability Configuration

This section focuses on how to configure Jaeger v2’s internal telemetry. For the full schema, see the [OpenTelemetry Collector docs](https://opentelemetry.io/docs/collector/internal-telemetry/).

### Logging (debug and production) {#logging}

Logs by default go to `stderr`. Use `info` or `warn` in production; switch to `debug` during incident analysis.

```yaml
service:
  telemetry:
    logs:
      level: info           # debug | info | warn | error
      encoding: console     # console | json
      output_paths: ["stderr"]
```

Debug-friendly setup:

```yaml
service:
  telemetry:
    logs:
      level: debug
      development: true
      encoding: json
      disable_caller: false
      disable_stacktrace: false
```

To enable more verbose storage-component logs, set the component logger level appropriately (varies by distribution). Start with `service.telemetry.logs.level: debug` and narrow using component-specific settings where available.

#### Storage debug logging

Enable detailed logging for storage components during investigations:

- Set the Collector log level to debug:

```yaml
service:
  telemetry:
    logs:
      level: debug
```

- If you use a separate Jaeger storage plugin (gRPC storage), configure its own log level via env/flags in its deployment (exact keys vary by plugin/backend):

```yaml
# Example (deployment fragment)
containers:
  - name: jaeger-storage-plugin
    image: your-storage-plugin:TAG
    args: ["--log-level=debug"]
    # or, depending on the plugin
    env:
      - name: LOG_LEVEL
        value: debug
      - name: JAEGER_LOG_LEVEL
        value: debug
```

Note: exact flags and env names depend on the storage backend/distribution; consult the plugin’s documentation. Return to `info`/`warn` after resolution.

### Metrics (collection and export) {#metrics}

Use the new `readers` model to expose internal metrics. Prometheus pull (recommended):

```yaml
service:
  telemetry:
    resource:
      service.name: jaeger
    metrics:
      level: detailed      # none | basic | normal | detailed
      readers:
        - pull:
            exporter:
              prometheus:
                host: 0.0.0.0
                port: 8888
```

Push internal metrics to an OTLP backend:

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

If multiple Jaeger components run side-by-side, use distinct ports to avoid conflicts.

For how to interpret key metrics, see [OpenTelemetry Collector metrics](#opentelemetry-collector-metrics).

#### Quick metrics check

Use this practical command to fetch exposed metrics from the internal telemetry endpoint:

```bash
curl -s http://jaeger-collector:8888/metrics
```

### Internal tracing (self-tracing)

Self-tracing is useful for debugging Query service requests and other internal operations.

```yaml
service:
  telemetry:
    traces:
      level: basic         # none | basic | normal | detailed
```

Control via environment variables:

```bash
# Disable completely (recommended default for production)
OTEL_TRACES_SAMPLER=always_off

# Sample 10% during investigations
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
```

Export internal traces to an external backend (experimental):

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

#### Full pipeline example for internal traces export

```yaml
receivers:
  otlp:
    protocols:
      http:
      grpc:

processors:
  batch:

exporters:
  otlphttp:
    endpoint: https://tracing-backend:4318

service:
  telemetry:
    traces:
      level: normal
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [otlphttp]
```

### Health checks

Use the Health Check extension. Basic HTTP endpoint:

```yaml
extensions:
  health_check:
    endpoint: "0.0.0.0:13133"
    path: "/health"

service:
  extensions: [health_check]
```

Enhanced V2 health checks with component health aggregation:

```yaml
extensions:
  healthcheckv2:
    use_v2: true
    component_health:
      include_permanent_errors: false
      include_recoverable_errors: true
      recovery_duration: 5m
    http:
      endpoint: "0.0.0.0:13133"
      status:
        enabled: true
        path: "/health/status"
      config:
        enabled: false
        path: "/health/config"
    grpc:
      endpoint: "localhost:13132"
      transport: "tcp"

service:
  extensions: [healthcheckv2]
```

For comprehensive behavior and configuration details, see the health check extension V2 README: [Health Check Extension V2](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/extension/healthcheckv2#readme). For interpreting health outputs, see [Health signals](#health-signals).

Security note: never expose the config endpoint on non-localhost interfaces.

## What to Monitor

This section lists key signals to track in production. See also the sample alert rules and dashboards in the Jaeger repo: [monitoring/jaeger-mixin](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin).

### Process-level metrics

- CPU, memory (RSS/heap), file descriptors, network I/O
- Disk usage and I/O latency when using local storage

### Go runtime metrics

- GC duration and frequency
- Goroutine count and unexpected growth
- Heap usage and allocation churn

Note: metric names can vary by Collector version and distribution. For canonical names and details, refer to the OpenTelemetry Collector internal telemetry docs: https://opentelemetry.io/docs/collector/internal-telemetry/.

### OpenTelemetry Collector metrics

- Span ingestion:
  - `otelcol_receiver_accepted_spans`
  - `otelcol_receiver_refused_spans`
- Span export:
  - `otelcol_exporter_sent_spans`
  - `otelcol_exporter_send_failed_spans`

Under normal conditions, accepted and sent spans should be close. Use labels to differentiate receivers/exporters (e.g., `receiver="otlp"`, `transport="http"`).

Example of labeled metric for clarity (formatted for readability):

```text
otelcol_receiver_accepted_spans{
    receiver="otlp",
    service_instance_id="f91d66c2-0445-42bf-a062-32aaed09facf",
    service_name="jaeger",
    service_version="2.0.0",
    transport="http"
} 44
```

How to read these signals:

- If `otelcol_receiver_refused_spans` rises while `otelcol_exporter_sent_spans` is steady, the receiver is saturated or rejecting traffic; review receiver limits and upstream send rates.
- If `otelcol_exporter_send_failed_spans` rises, suspect backend connectivity/auth or exporter config (endpoint, headers, TLS).
- If `otelcol_receiver_accepted_spans` and `otelcol_exporter_sent_spans` diverge, check processor/exporter queues (capacity vs size) and backend health.
- Track by labels to isolate impact to a specific receiver/exporter (`receiver`, `transport`, storage exporter name).

### Storage backend

Monitor backend-specific metrics (e.g., Elasticsearch, Cassandra) for latency, errors, and saturation per vendor docs.

### Query performance

- UI/API latency and error rates
- Query volume and heavy queries
- Storage latency impacting query response times

### Health signals

Group health alongside other signals to quickly assess overall system status:

- Application Health: overall collector and per-pipeline health via HTTP status endpoint. Use `GET /health/status` (or `?pipeline=traces` and `?verbose`).
- Dependency Health: storage backend and network connectivity health exposed by backend-specific metrics and tools. Incorporate backend alerts alongside Jaeger/Collector alerts.

See configuration and endpoints in [Health checks](#health-checks). For detailed semantics of statuses and protocol mappings, see [Health Check Extension V2](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/extension/healthcheckv2#readme).

Status semantics (HTTP):

| Component Status   | Default HTTP status | Notes |
|--------------------|---------------------|-------|
| Starting/Stopping  | 503                 | initializing or shutting down |
| OK                 | 200                 | healthy |
| RecoverableError   | 200/500             | 200 until recovery window elapses if `include_recoverable_errors: true`; otherwise 200 |
| PermanentError     | 200/500             | 500 if `include_permanent_errors: true`; otherwise 200 (degraded) |
| FatalError         | 500                 | fatal; process exits |
| Stopped            | 503                 | not serving |

Use `?verbose` for component-level detail and `?pipeline=<name>` for per-pipeline views. For gRPC, statuses map to SERVING/NOT_SERVING with similar semantics.

## External Integration

### Prometheus scrape config

```yaml
scrape_configs:
  - job_name: 'jaeger-v2'
    static_configs:
      - targets: ['jaeger:8888']
    scrape_interval: 15s
    metrics_path: /metrics
```

Alerting rules and dashboards: [monitoring/jaeger-mixin](https://github.com/jaegertracing/jaeger/tree/main/monitoring/jaeger-mixin)

Recommendations:

- Import the Jaeger mixin alerts into your Prometheus/Alertmanager
- Build Grafana dashboards using OTEL Collector and storage backend metrics

### Prometheus alerts (categories and guidance)

The Jaeger mixin includes production-oriented alert groups, such as:

- Service availability: component down, probe failures
- Performance degradation: elevated query latency, exporter errors
- Capacity issues: queue saturation, high CPU/memory, file descriptor pressure
- Data loss risk: refused spans at receivers, failed span exports

Start with the mixin defaults, then tailor thresholds to your ingest/query rates and storage backend SLOs.

Mapping alert categories to signals:

- Data loss: `otelcol_receiver_refused_spans`, `otelcol_exporter_send_failed_spans` (see [OpenTelemetry Collector metrics](#opentelemetry-collector-metrics))
- Availability: health endpoints (see [Health signals](#health-signals)) and Kubernetes probes
- Performance: query latency/error rates (see [Query performance](#query-performance))
- Capacity: CPU/memory/FDs (see [Process-level metrics](#process-level-metrics)), exporter queues if available

## Troubleshooting

Use logs, metrics, health, and (optionally) self-traces together.

### High resource usage

- Inspect goroutines, heap, GC metrics
- Review configuration; temporarily enable debug logs

### Data loss (refused/failed spans)

- Check storage connectivity and health
- Verify exporter configuration and queues
- Watch `otelcol_receiver_refused_spans` and `otelcol_exporter_send_failed_spans`
- See [OpenTelemetry Collector metrics](#opentelemetry-collector-metrics)

Additional cues:

- Compare `otelcol_exporter_sent_spans` vs `otelcol_receiver_accepted_spans` over the same window
- Inspect exporter queue metrics if available (e.g., capacity vs size)

### Poor query performance

- Monitor storage latency and system contention
- Analyze query patterns; reduce heavy aggregations
- Monitor query latency (see [Query performance](#query-performance))

Additional cues:

- Check storage backend cluster health and indexing/refresh pressure
- Profile hot queries via request logs or self-tracing during incidents

### Configuration issues

- Use health endpoints to observe startup transitions
- In development only, verify active config via `/health/config`
- Check logs for parsing errors and warnings
