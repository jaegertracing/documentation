---
title: Monitoring Jaeger
navtitle: Monitoring
hasparent: true
---

Jaeger itself is a distributed, microservices based system. If you run it in production, you will likely want to setup adequate monitoring for different components, e.g. to ensure that the backend is not saturated by too much tracing data.

Please refer to [OpenTelemetry Collector documentation](https://opentelemetry.io/docs/collector/internal-telemetry/) for details on configuring the internal telemetry.

## Metrics

Here's a sample `curl` call to obtain the metrics:

```
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

## Logging

Logs by default go to `stderr` in plain text format. For production deployment log verbosity of `info` or `warning` is recommended.

## Traces

Jaeger has the ability to trace some of its own components, namely the requests to the Query service. For example, if you start `all-in-one` as described in [Getting Started](../getting-started/), and refresh the UI screen a few times, you will see `jaeger` populated in the Services dropdown.

Self-tracing can be disabled by setting `OTEL_TRACES_SAMPLER=always_off` environment variable.
