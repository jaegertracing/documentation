---
title: OpenTelemetry
hasparent: true
---

The future Jaeger backend components will be based on [OpenTelemetry collector](https://opentelemetry.io/docs/collector/).
This integration will make all OpenTelemetry Collector features available in the Jaeger backend components.

{{< warning >}}
At the moment Jaeger OpenTelemetry binaries are experimental and the configuration or behavior can change.
The current progress can be tracked via [issues tagged as `area/otel`](https://github.com/jaegertracing/jaeger/issues?q=is%3Aissue+is%3Aopen+label%3Aarea%2Fotel).
{{< /warning >}}

The Jaeger OpenTelemetry backend components are published as Docker images:

Component             | Repository
--------------------- | ---
**jaeger-agent**      | [hub.docker.com/r/jaegertracing/jaeger-opentelemetry-agent/](https://hub.docker.com/r/jaegertracing/jaeger-opentelemetry-agent/)
**jaeger-collector**  | [hub.docker.com/r/jaegertracing/jaeger-opentelemetry-collector/](https://hub.docker.com/r/jaegertracing/jaeger-opentelemetry-collector/)
**jaeger-ingester**   | [hub.docker.com/r/jaegertracing/jaeger-opentelemetry-ingester/](https://hub.docker.com/r/jaegertracing/jaeger-opentelemetry-ingester/)
**all-in-one**        | [hub.docker.com/r/jaegertracing/opentelemetry-all-in-one/](https://hub.docker.com/r/jaegertracing/opentelemetry-all-in-one/)

## Compatibility

The Jaeger OpenTelemetry binaries are **almost** backward compatible with the current Jaeger binaries.

The differences are:

* Health check port changed to `13133`
* Not all current Jaeger flags are exposed (e.g. health check port)
* Exposed metrics

## Configuration

Jaeger OpenTelemetry components can be configured by a subset of Jaeger current flags (or other [configuration sources](../cli/))
and [OpenTelemetry configuration file](https://opentelemetry.io/docs/collector/configuration/).
The OpenTelemetry configuration takes precedence over Jaeger configuration.
The Jaeger OpenTelemetry binaries use hardcoded default configuration that enables predefined set of components - Jaeger receiver, attribute processor, (storage) exporter.
The opinionated default configuration ensures compatibility between Jaeger current binaries.
The user provided OpenTelemetry configuration is merged with the default configuration.

Let's have a look at the example configuration:

```sh
$ docker run --rm -it -v ${PWD}:/config \
    -e SPAN_STORAGE_TYPE=elasticsearch \
    jaegertracing/jaeger-opentelemetry-collector \
    --config-file=/config/config.yaml \
    --es.server-urls=http://localhost:9200 \
    --es.num-shards=3
```

The content of `config.yaml`:

```yaml
exporters:
  jaeger_elasticsearch:
    es:
      server-urls: http://elasticsearch:9200
      num-replicas: 2
processors:
  attributes:
    actions:
      - key: user
        action: delete
service:
  pipelines:
    traces:
      processors: [attributes]
```

* Enables Jaeger receiver (by default) with collector endpoints - gRPC, TChannel, HTTP.
* Enables Elasticsearch backend with URL http://elasticsearch:9200, 3 primary shards (default is 5) and 2 replica shards (default 1). The CLI flag `--es.server.urls=http://localhost:9200` is superseded by the value from the configuration file.
* Enables attribute processor (disabled by default). Note that new components have to be explicitly added to the pipeline and component lists (e.g. `processors`) override the default configuration.
* Enables health check extension (by default).

The following command can be used to list all supported flags:

```sh
$ docker run --rm \
    -e SPAN_STORAGE_TYPE=elasticsearch \
    jaegertracing/jaeger-opentelemetry-collector:latest -h
```

## Jaeger Operator

The following Jaeger custom resource (CR) deploys production instance connected to Elasticsearch cluster:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: simple-prod
spec:
  strategy: production
  collector:
    image: jaegertracing/jaeger-opentelemetry-collector:latest # <1>
    config: # <2>
      extensions:
        health_check:
          port: 14269 # <3>
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200
```

<1> The image has to be explicitly specified.

<2> Config field exposes OpenTelemetry collector configuration. This field has been added to collector, agent, ingester and all-in-one CR nodes.

<3> Health check port has to match Jaeger component health check port from the [deployment page](../deployment).

Once Jaeger OpenTelemetry binaries are released in a stable stream the Jaeger Operator will automatically use a new set of images and properly change readiness probes to the new ports.
