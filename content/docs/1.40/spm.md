---
title: Service Performance Monitoring (SPM) - Experimental
hasparent: true
---

{{< info >}}
The Service Performance Monitoring feature is currently considered **experimental**.
{{< /info >}}

![Service Performance Monitoring](/img/frontend-ui/spm.png)

Surfaced in Jaeger UI as the "Monitor" tab, the motivation for this feature is
to help identify interesting traces (e.g. high QPS, slow or erroneous requests)
without needing to know the service or operation names up-front.

It is essentially achieved through aggregating span data to produce RED
(Request, Error, Duration) metrics.

Potential use cases include:

- Post deployment sanity checks across the org, or on known dependent services
  in the request chain.
- Monitoring and root-causing when alerted of an issue.
- Better onboarding experience for new users of Jaeger UI.
- Long-term trend analysis of QPS, errors and latencies.
- Capacity planning.

## UI Feature Overview

The "Monitor" tab provides a service-level aggregation, as well as an operation-level
aggregation within the service, of Request rates, Error rates and Durations
(P95, P75 and P50), also known as RED metrics.

Within the operation-level aggregations, an "Impact" metric, computed as the
product of latency and request rate, is another signal that can be used to
rule-out operations that may naturally have a high latency profile such as daily
batch jobs, or conversely highlight operations that are lower in the latency
rankings but with a high RPS (request per second).

From these aggregations, Jaeger UI is able to pre-populate a Trace search with
the relevant service, operation and lookback period, narrowing down the search
space for these more interesting traces.

## Getting Started

{{< info >}}
This is for demonstration purposes only and does not reflect deployment best practices.
{{< /info >}}

A locally runnable setup is available in the [Jaeger repository][spm-demo] along
with instructions on how to run it.

The feature can be accessed from the "Monitor" tab along the top menu.

This demo includes [Microsim](https://github.com/yurishkuro/microsim); a microservices
simulator to generate trace data.

If generating traces manually is preferred, the [Sample App: HotROD](../getting-started/#sample-app-hotrod)
can be started via docker. Be sure to include `--net monitor_backend` in the `docker run` command.

## Architecture

The RED metrics queried by Jaeger for the Monitor tab are the result of span
data collected by the [OpenTelemetry Collector][opentelemetry-collector] which
is then aggregated by the [SpanMetrics Processor][spanmetrics] component configured
within its pipeline.

These metrics are finally exported by the OpenTelemetry Collector (via prometheus
exporters) to a Prometheus-compatible metrics store.

It is important emphasize that this is a "read-only" feature and,
as such, is only relevant to the Jaeger Query component (and All In One).

{{<mermaid align="center">}}
graph
    TRACE_RECEIVER[Trace Receiver] --> |spans| SPANMETRICS_PROC[Spanmetrics Processor]
    TRACE_RECEIVER --> |spans| TRACE_EXPORTER[Trace Exporter]
    SPANMETRICS_PROC --> |metrics| PROMETHEUS_EXPORTER[Prometheus/PrometheusRemoteWrite Exporter]
    UI[Jaeger UI] --> QUERY
    QUERY[Jaeger Query Service] --> METRICS_STORE[Metrics Storage]
    PROMETHEUS_EXPORTER --> |metrics| METRICS_STORE
    subgraph OpenTelemetry Collector
        subgraph Pipeline
            TRACE_RECEIVER
            SPANMETRICS_PROC
            TRACE_EXPORTER
            PROMETHEUS_EXPORTER
        end
    end
    style UI fill:#9AEBFE,color:black
    style QUERY fill:#9AEBFE,color:black

    style TRACE_RECEIVER fill:#404ca8,color:white
    style TRACE_EXPORTER fill:#404ca8,color:white
    style SPANMETRICS_PROC fill:#404ca8,color:white
    style PROMETHEUS_EXPORTER fill:#404ca8,color:white
{{< /mermaid >}}

## Derived Time Series

Though more in scope of the [OpenTelemetry Collector][opentelemetry-collector],
it is worth understanding the additional metrics and time series that the
[SpanMetrics Processor][spanmetrics] will generate in metrics storage to help
with capacity planning when deploying SPM.

Please refer to [Prometheus documentation][prom-metric-labels] covering the
concepts of metric names, types, labels and time series; terms that will be used
in the remainder of this section.

Two metric names will be created:
- `calls_total`
  - **Type**: counter
  - **Description**: counts the total number of spans, including error spans.
    Call counts are differentiated from errors via the `status_code` label. Errors
    are identified as any time series with the label `status_code = "STATUS_CODE_ERROR"`.
- `latency`
  - **Type**: histogram
  - **Description**: a histogram of span latencies. Under the hood, Prometheus histograms
    will create a number of time series:
    - `latency_count`: The total number of data points across all buckets in the histogram.
    - `latency_sum`: The sum of all data point values.
    - `latency_bucket`: A collection of `n` time series (where `n` is the number of
      latency buckets) for each latency bucket identified by an `le` (less than
      or equal to) label. The `latency_bucket` counter with lowest `le` and
      `le >= span latency` will be incremented for each span.

The following formula aims to provide some guidance on the number of new time series created:
```
num_status_codes * num_span_kinds * (1 + num_latency_buckets) * num_operations

Where:
  num_status_codes = 3 max (typically 2: ok/error)
  num_span_kinds = 6 max (typically 2: client/server)
  num_latency_buckets = 17 default
```

Plugging those numbers in, assuming default configuration:
```
max = 324 * num_operations
typical = 72 * num_operations
```

Note:
- Custom [latency buckets][spanmetrics-config-latency] or [dimensions][spanmetrics-config-dimensions]
  configured in the spanmetrics processor will alter the calculation above.
- Querying custom dimensions are not supported by SPM and will be aggregated over.

## Configuration

### Enabling SPM

The following configuration is required to enable the SPM feature:

- [Jaeger UI](../frontend-ui/#monitor-experimental)
- [Jaeger Query](../cli/#jaeger-query-prometheus)
  - Set the `METRICS_STORAGE_TYPE` environment variable to `prometheus`.
  - Optional: Set `--prometheus.server-url` (or `PROMETHEUS_SERVER_URL` environment variable)
    to the URL of the prometheus server. Default: http://localhost:9090.

## API

### gRPC/Protobuf

The recommended way to programmatically retrieve RED metrics is via `jaeger.api_v2.metrics.MetricsQueryService` gRPC endpoint defined in the [metricsquery.proto][metricsquery.proto] IDL file.

### HTTP JSON

Used internally by the Monitor tab of Jaeger UI to populate the metrics for its visualizations.

Refer to [this README file][http-api-readme] for a detailed specification of
the HTTP API.

## Troubleshooting

### Check the /metrics endpoint

The `/metrics` endpoint can be used to check if spans for specific services were received.
The `/metrics` endpoint is served from the admin port.
Assuming that Jaeger all-in-one and query are available under hosts named `all-in-one`
and `jaeger-query` respectively, here are sample `curl` calls to obtain the metrics:

```shell
$ curl http://all-in-one:14269/metrics

$ curl http://jaeger-query:16687/metrics
```

The following metrics are of most interest:

```shell
# all-in-one
jaeger_requests_total
jaeger_latency_bucket

# jaeger-query
jaeger_query_requests_total
jaeger_query_latency_bucket
```

Each of these metrics will have a label for each of the following operations:
```shell
get_call_rates
get_error_rates
get_latencies
get_min_step_duration
```

If things are working as expected, the metrics with label `result="ok"` should
be incrementing, and `result="err"` being static. For example:
```shell
jaeger_query_requests_total{operation="get_call_rates",result="ok"} 18
jaeger_query_requests_total{operation="get_error_rates",result="ok"} 18
jaeger_query_requests_total{operation="get_latencies",result="ok"} 36

jaeger_query_latency_bucket{operation="get_call_rates",result="ok",le="0.005"} 5
jaeger_query_latency_bucket{operation="get_call_rates",result="ok",le="0.01"} 13
jaeger_query_latency_bucket{operation="get_call_rates",result="ok",le="0.025"} 18

jaeger_query_latency_bucket{operation="get_error_rates",result="ok",le="0.005"} 7
jaeger_query_latency_bucket{operation="get_error_rates",result="ok",le="0.01"} 13
jaeger_query_latency_bucket{operation="get_error_rates",result="ok",le="0.025"} 18

jaeger_query_latency_bucket{operation="get_latencies",result="ok",le="0.005"} 7
jaeger_query_latency_bucket{operation="get_latencies",result="ok",le="0.01"} 25
jaeger_query_latency_bucket{operation="get_latencies",result="ok",le="0.025"} 36
```

If there are issues reading metrics from Prometheus such as a failure to reach
the Prometheus server, then the `result="err"` metrics will be incremented. For example:
```shell
jaeger_query_requests_total{operation="get_call_rates",result="err"} 4
jaeger_query_requests_total{operation="get_error_rates",result="err"} 4
jaeger_query_requests_total{operation="get_latencies",result="err"} 8
```

At this point, checking the logs will provide more insight towards root causing
the problem.

### Query Prometheus

Graphs may still appear empty even when the above Jaeger metrics indicate successful reads
from Prometheus. In this case, query Prometheus directly on any one of these metrics:

- `latency_bucket`
- `calls_total`

You should expect to see these counters increasing as spans are being emitted
by services to the OpenTelemetry Collector.

### Inspect the OpenTelemetry Collector

If the above `latency_bucket` and `calls_total` metrics are empty, then it could
be misconfiguration in the OpenTelemetry Collector or anything upstream from it.

Some questions to ask while troubleshooting are:
- Is the OpenTelemetry Collector configured correctly?
  - See: https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/processor/spanmetricsprocessor
- Is the Prometheus server reachable by the OpenTelemetry Collector?
- Are the services sending spans to the OpenTelemetry Collector?
  - See: https://opentelemetry.io/docs/collector/troubleshooting/

### Service/Operation missing in Monitor Tab

If the service/operation is missing in the Monitor Tab, but visible in the Jaeger
Trace search service and operation drop-downs menus, a common cause of this is
the default `server` span kind used in metrics queries.

The service/operations you are not seeing could be from spans that are non-server
span kinds such as client or worse, `unspecified`. Hence, this is an instrumentation
data quality issue, and the instrumentation should set the span kind.

The reason for defaulting to `server` span kinds is to avoid double-counting
both ingress and egress spans in the `server` and `client` span kinds, respectively.


[spm-demo]: https://github.com/jaegertracing/jaeger/tree/v1.40.0/docker-compose/monitor
[metricsquery.proto]: https://github.com/jaegertracing/jaeger/blob/v1.40.0/model/proto/metrics/metricsquery.proto
[openmetrics.proto]: https://github.com/jaegertracing/jaeger/blob/v1.40.0/model/proto/metrics/openmetrics.proto#L53
[opentelemetry-collector]: https://opentelemetry.io/docs/collector/
[spanmetrics]: https://pkg.go.dev/github.com/open-telemetry/opentelemetry-collector-contrib/processor/spanmetricsprocessor#section-readme
[prom-metric-labels]: https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels
[http-api-readme]: https://github.com/jaegertracing/jaeger/tree/v1.40.0/docker-compose/monitor#http-api
[spanmetrics-config-dimensions]: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/spanmetricsprocessor/testdata/config-full.yaml#L46
[spanmetrics-config-latency]: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/processor/spanmetricsprocessor/testdata/config-full.yaml#L38
