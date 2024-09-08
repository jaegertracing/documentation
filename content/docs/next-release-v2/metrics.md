---
title: Metrics Backends
hasparent: true
---

Jaeger Query is capable of querying aggregated R.E.D metrics from a storage backend,
visualizing them on the [Monitor tab](../spm). It should be emphasized that the
configured metrics storage type is for reading _only_ and therefore, only applies
to the Jaeger Query component (and All In One, which contains Jaeger Query).

The storage type can be passed via `METRICS_STORAGE_TYPE` environment variable.
Valid values are: `prometheus`.

### Prometheus

Any PromQL-compatible backend is supported by Jaeger Query. A list of these have
been compiled by Julius Volz in:
https://promlabs.com/blog/2020/11/26/an-update-on-promql-compatibility-across-vendors

#### Configuration

##### Minimal
```sh
docker run \
  -e METRICS_STORAGE_TYPE=prometheus \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```

##### All options
To view the full list of configuration options, you can run the following command:
```sh
docker run \
  -e METRICS_STORAGE_TYPE=prometheus \
  jaegertracing/jaeger-query:{{< currentVersion >}} \
  --help
```
#### TLS support

Jaeger supports TLS client to Prometheus server connections as long as you've [configured
your Prometheus server](https://prometheus.io/docs/guides/tls-encryption/) correctly. You can
configure **jaeger-query** like so:

```sh
docker run \
  -e METRICS_STORAGE_TYPE=prometheus \
  -e PROMETHEUS_SERVER_URL=<...> \
  -e PROMETHEUS_TLS_ENABLED=true \
  -e PROMETHEUS_TLS_CA=<path to your CA cert file> \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```
