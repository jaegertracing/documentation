---
title: Deployment
weight: 4
children:
- title: Configuration
  url: configuration
- title: User Interface
  url: frontend-ui
- title: On Kubernetes
  url: kubernetes
- title: On Windows
  url: windows
- title: Security
  url: security
---

Jaeger backend is released as a single binary or container image (see [Downloads](../../../download/)). Despite that, it can be configured to operate in different **roles**, such as **all-in-one**, **collector**, **query**, and **ingester** (see [Architecture](../architecture/)).

## Configuration

An explicit YAML configuration file must be provided via the `--config` command line argument (see [Configuration](./configuration/)). When running in a container, the path to the config file must be mapped into the container file system (the `-v ...` mapping below):

```sh
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 5778:5778 \
  -p 9411:9411 \
  -v /path/to/local/config.yaml:/jaeger/config.yaml \
  jaegertracing/jaeger:{{< currentVersion >}} \
  --config /jaeger/config.yaml
```

## Scaling

Both Jaeger **collector**  and **query** are stateless and thus many instances can be run in parallel.

## Upgrades

Since Jaeger microservices (components) are stateless, all the state lives in the data store(s). When no breaking changes are introduced in a release, the order of upgrades for individual Jaeger components does not matter.

We try to avoid any kinds of breaking changes in new versions, but sometimes they are unavoidable and will be clearly called out in the release notes. In those cases the safest upgrade order is by starting from the end of the ingestion pipeline: first **query**, then **ingester** if using Kafka, then **collector**. This order ensures that the receiving component is running on a newer version and is capable of understanding any protocol changes from the other components earlier in the pipeline before those are upgraded.

Finally, sometimes we introduce storage schema changes that may require some proactive steps before upgrading Jaeger components. Such changes will always be marked as breaking changes in the release notes and contain specific instructions for upgrading.

## Management Ports

The following intra-oriented ports are exposed by default (can be changed via configuration):

Port  | Protocol | Endpoint   | Function
----- | -------  | ---------- | --------
8888  | HTTP     | `/metrics` | metrics port for exposing metrics which can be scraped with Prometheus compatible systems
8889  | HTTP     | `/metrics` | ingester port for reading data from Kafka topics and writing to a supported backend
13133 | HTTP     | `/status`  | Healthcheck port via the `healthcheckv2` extension
27777 | HTTP     | `/`        | expvar port for process level metrics per the Go standards

See [APIs](../architecture/apis/) for the list of all API ports.

## SPM

Service Performance Monitoring (SPM) requires a deployment of Prometheus-compatible metrics storage (see [SPM page](../architecture/spm/)).

## Service Maps

In order to display service dependency diagrams, production deployments need an external process that aggregates data and computes dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and writes them directly to the storage.

[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[model.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/model.proto
[thriftrw]: https://www.npmjs.com/package/thriftrw
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/v2.13.0/internal/storage/v1/grpc/proto/storage.proto
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
