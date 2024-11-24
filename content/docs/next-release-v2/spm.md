---
title: Service Performance Monitoring (SPM)
hasparent: true
---

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

If generating traces manually is preferred, the [Sample App: HotROD](../getting-started/#-hotrod-demo) can be started via docker. Be sure to include `--net monitor_backend` in the `docker run` command.

## Architecture

The RED metrics queried by Jaeger for the Monitor tab are the result of processing the collected span data by the [SpanMetrics Connector][spanmetrics-conn] component configured
within Jaeger pipeline. These metrics are exported (via prometheus
exporters) to a Prometheus-compatible metrics store.

It is important emphasize that this is a "read-only" feature and,
as such, is only relevant to the Jaeger Query component.

{{<mermaid align="center">}}
graph
    OTLP_EXPORTER[OTLP Exporter] --> TRACE_RECEIVER

    subgraph Service
        subgraph OpenTelemetry SDK
            OTLP_EXPORTER
        end
    end

    TRACE_RECEIVER[Trace Receiver] --> |spans| SPANMETRICS_CONN[SpanMetrics Connector]
    TRACE_RECEIVER --> |spans| TRACE_EXPORTER[Trace Exporter]
    TRACE_EXPORTER --> |spans| COLLECTOR[Jaeger Collector]
    SPANMETRICS_CONN --> |metrics| PROMETHEUS_EXPORTER[Prometheus/PrometheusRemoteWrite Exporter]
    PROMETHEUS_EXPORTER --> |metrics| METRICS_STORE[(Metrics Storage)]

    COLLECTOR --> |spans| SPAN_STORE[(Span Storage)]
    SPAN_STORE --> QUERY[Jaeger Query]
    METRICS_STORE --> QUERY
    QUERY --> UI[Jaeger UI]

    subgraph OpenTelemetry Collector
        subgraph Pipeline
            TRACE_RECEIVER
            SPANMETRICS_CONN
            TRACE_EXPORTER
            PROMETHEUS_EXPORTER
        end
    end

    style Service fill:#DFDFDF,color:black

    style OTLP_EXPORTER fill:#404CA8,color:white
    style TRACE_RECEIVER fill:#404CA8,color:white
    style TRACE_EXPORTER fill:#404CA8,color:white
    style SPANMETRICS_CONN fill:#404CA8,color:white
    style PROMETHEUS_EXPORTER fill:#404CA8,color:white

    style UI fill:#9AEBFE,color:black
    style QUERY fill:#9AEBFE,color:black
    style COLLECTOR fill:#9AEBFE,color:black
{{< /mermaid >}}

### Metrics Storage

Any PromQL-compatible backend is supported by Jaeger Query. A list of these have
been compiled by Julius Volz in:
https://promlabs.com/blog/2020/11/26/an-update-on-promql-compatibility-across-vendors

## Derived Time Series

It is worth understanding the additional metrics and time series that the
[SpanMetrics Connector][spanmetrics-conn] will generate in metrics storage to help
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
- `[namespace_]duration_[units]`
  - **Type**: histogram
  - **Description**: a histogram of span durations/latencies. Under the hood, Prometheus histograms
    will create a number of time series. For illustrative purposes, assume no namespace
    is configured and the units are `milliseconds`:
    - `duration_milliseconds_count`: The total number of data points across all buckets in the histogram.
    - `duration_milliseconds_sum`: The sum of all data point values.
    - `duration_milliseconds_bucket`: A collection of `n` time series (where `n` is the number of
      duration buckets) for each duration bucket identified by an `le` (less than
      or equal to) label. The `duration_milliseconds_bucket` counter with lowest `le` and
      `le >= span duration` will be incremented for each span.

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
- Custom [duration buckets][spanmetrics-config-duration] or [dimensions][spanmetrics-config-dimensions]
  configured in the spanmetrics connector will alter the calculation above.
- Querying custom dimensions are not supported by SPM and will be aggregated over.

## Configuration

### Enabling SPM

The following configuration is required to enable the SPM feature:

- [Jaeger UI](../frontend-ui#monitor)
- Jaeger Query (TODO: these instructions need to be updated for config file)
  - Set the `METRICS_STORAGE_TYPE` environment variable to `prometheus`.
  - Optional: Set `--prometheus.server-url` (or `PROMETHEUS_SERVER_URL` environment variable)
    to the URL of the prometheus server. Default: http://localhost:9090.
  - Optional: Set `--prometheus.query.support-spanmetrics-connector=true` to explicitly enable the [SpanMetrics Connector][spanmetrics-conn] if you intend to use it. This will become the default behavior in the future.


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
from Prometheus. In this case, query Prometheus directly on any of these metrics:

- `duration_bucket`
- `duration_milliseconds_bucket`
- `duration_seconds_bucket`
- `calls`
- `calls_total`

You should expect to see these counters increasing as spans are being emitted
by services to the OpenTelemetry Collector.

### Viewing Logs

If the above metrics are present in Prometheus, but not appearing in the Monitor
tab, it means there is a discrepancy between what metrics Jaeger expects to see in
Prometheus and what metrics are actually available.

This can be confirmed by increasing the log level by setting the following
environment variable:

```shell
LOG_LEVEL=debug
```

Outputting logs that resemble the following:
```json
{
    "level": "debug",
    "ts": 1688042343.4464543,
    "caller": "metricsstore/reader.go:245",
    "msg": "Prometheus query results",
    "results": "",
    "query": "sum(rate(calls{service_name =~ \"driver\", span_kind =~ \"SPAN_KIND_SERVER\"}[10m])) by (service_name,span_name)",
    "range":
    {
        "Start": "2023-06-29T12:34:03.081Z",
        "End": "2023-06-29T12:39:03.081Z",
        "Step": 60000000000
    }
}
```

In this instance, let's say OpenTelemetry Collector's `prometheusexporter` introduced
a breaking change that appends a `_total` suffix to counter metrics and the duration units within
histogram metrics (e.g. `duration_milliseconds_bucket`). As we discovered,
Jaeger is looking for the `calls` (and `duration_bucket`) metric names,
while the OpenTelemetry Collector is writing `calls_total` (and `duration_milliseconds_bucket`).

The resolution, in this specific case, is to set environment variables telling Jaeger
to normalize the metric names such that it knows to search for `calls_total` and
`duration_milliseconds_bucket` instead, like so:

```shell
PROMETHEUS_QUERY_NORMALIZE_CALLS=true
PROMETHEUS_QUERY_NORMALIZE_DURATION=true
```

### Checking OpenTelemetry Collector Config

If there are error spans appearing in Jaeger, but no corresponding error metrics:

- Check that raw metrics in Prometheus generated by the spanmetrics connector
  (as listed above: `calls`, `calls_total`, `duration_bucket`, etc.) contain
  the `status.code` label in the metric that the span should belong to.
- If there are no `status.code` labels, check the OpenTelemetry Collector
  configuration file, particularly for the presence of the following configuration:
  ```yaml
  exclude_dimensions: ['status.code']
  ```
  This label is used by Jaeger to determine if a request is erroneous.

### Inspect the OpenTelemetry Collector

If the above `latency_bucket` and `calls_total` metrics are empty, then it could
be misconfiguration in the OpenTelemetry Collector or anything upstream from it.

Some questions to ask while troubleshooting are:
- Is the OpenTelemetry Collector configured correctly?
  - See: https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/connector/spanmetricsconnector
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

[spm-demo]: https://github.com/jaegertracing/jaeger/tree/main/docker-compose/monitor
[metricsquery.proto]: https://github.com/jaegertracing/jaeger/blob/main/model/proto/metrics/metricsquery.proto
[openmetrics.proto]: https://github.com/jaegertracing/jaeger/blob/main/model/proto/metrics/openmetrics.proto#L53
[opentelemetry-collector]: https://opentelemetry.io/docs/collector/
[spanmetrics]: https://pkg.go.dev/github.com/open-telemetry/opentelemetry-collector-contrib/processor/spanmetricsprocessor#section-readme
[spanmetrics-conn]: https://pkg.go.dev/github.com/open-telemetry/opentelemetry-collector-contrib/connector/spanmetricsconnector#section-readme
[prom-metric-labels]: https://prometheus.io/docs/concepts/data_model/#metric-names-and-labels
[http-api-readme]: https://github.com/jaegertracing/jaeger/tree/main/docker-compose/monitor#http-api
[spanmetrics-config-dimensions]: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/connector/spanmetricsconnector/testdata/config.yaml#L23
[spanmetrics-config-duration]: https://github.com/open-telemetry/opentelemetry-collector-contrib/blob/main/connector/spanmetricsconnector/testdata/config.yaml#L14

### 403 when executing metrics query

If logs contain the error resembling: `failed executing metrics query: client_error: client error: 403`,
it is possible that the Prometheus server is expecting a bearer token.

Jaeger Query (and all-in-one) can be configured to pass the bearer token in
metrics queries via the `--prometheus.token-file` command-line parameter
(or the `PROMETHEUS_TOKEN_FILE` environment variable), with its value set to
the path of the file containing the bearer token.
