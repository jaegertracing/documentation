# Monitoring Jaeger

Jaeger itself is a distributed, microservices based system. If you run it in production, you will likely want to setup adequate monitoring for different components, e.g. to ensure that the backend is not saturated by too much tracing data. 

## Metrics

By default Jaeger microservices expose metrics in Prometheus format. It is controlled by the following command line options:

* `--metrics-backend` controls how the measurements are exposed. The default value is `prometheus`, another option is `expvar`, the Go standard mechanism for exposing process level statistics.
* `--metrics-http-route` specifies the name of the HTTP endpoint used to scrape the metrics (`/metrics` by default).

Each Jaeger components exposes the metrics scraping endpoint on one of the HTTP ports they already serve:

Component             | Port
--------------------- | ---
**jaeger-agent**      | 5778
**jaeger-collector**  | 14268
**jaeger-query**      | 16686

## Logging

Jaeger components only log to standard out, using structured logging library [go.uber.org/zap](https://github.com/uber-go/zap) configured to write log lines as JSON encoded strings, for example:

```
{"level":"info","ts":1517621222.261759,"caller":"healthcheck/handler.go:99","msg":"Health Check server started","http-port":14269,"status":"unavailable"}
```

The log level can be adjusted via `--log-level` command line switch; default level is `info`.
