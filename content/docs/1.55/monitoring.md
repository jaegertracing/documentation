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
**jaeger-agent**      | 14271
**jaeger-collector**  | 14269
**jaeger-query**      | 16687
**jaeger-ingester**   | 14270
**all-in-one**        | 14269

### Prometheus monitoring mixin for Jaeger

The Prometheus monitoring mixin for Jaeger provides a starting point for people wanting to monitor Jaeger using Prometheus, Alertmanager, and Grafana. This includes a prebuilt [dashboard](https://github.com/jaegertracing/jaeger/blob/v1.55.0/monitoring/jaeger-mixin/dashboard-for-grafana.json). For more information, see [the documentation](https://github.com/jaegertracing/jaeger/tree/v1.55.0/monitoring/jaeger-mixin).

## Logging

Jaeger components only log to standard out, using structured logging library [go.uber.org/zap](https://github.com/uber-go/zap) configured to write log lines as JSON encoded strings, for example:

```json
{"level":"info","ts":1615914981.7914007,"caller":"flags/admin.go:111","msg":"Starting admin HTTP server","http-addr":":14269"}
{"level":"info","ts":1615914981.7914548,"caller":"flags/admin.go:97","msg":"Admin server started","http.host-port":"[::]:14269","health-status":"unavailable"}
```

The log level can be adjusted via `--log-level` command line switch; default level is `info`.

## Traces

Jaeger has the ability to trace some of its own components, namely the requests to the Query service. For example, if you start `all-in-one` as described in [Getting Started](../getting-started), and refresh the UI screen a few times, you will see `jaeger-all-in-one` populated in the Services dropdown. If you prefer not to see these traces in the Jaeger UI, you can disable them by running Jaeger backend components with `OTEL_TRACES_SAMPLER=always_off` environment variable, for example:

```
docker run -e OTEL_TRACES_SAMPLER=always_off -p 16686:16686 jaegertracing/all-in-one:{{< currentVersion >}}
```
