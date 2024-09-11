---
title: Deployment
weight: 4
children:
- title: Configuration
  url: configuration
- title: Kubernetes Operator
  url: operator
- title: User Interface
  url: frontend-ui
- title: On Windows
  url: windows
---

The main Jaeger backend components are released as Docker images on [Docker Hub](https://hub.docker.com/r/jaegertracing) and [Quay](https://quay.io/organization/jaegertracing):

!!!UPDATE HERE

Component             | Docker Hub                                                                                                   | Quay
--------------------- | -------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------
**jaeger-all-in-one**      | [hub.docker.com/r/jaegertracing/all-in-one/](https://hub.docker.com/r/jaegertracing/all-in-one/)         | [quay.io/repository/jaegertracing/all-in-one](https://quay.io/repository/jaegertracing/all-in-one)
**jaeger-agent**      | [hub.docker.com/r/jaegertracing/jaeger-agent/](https://hub.docker.com/r/jaegertracing/jaeger-agent/)         | [quay.io/repository/jaegertracing/jaeger-agent](https://quay.io/repository/jaegertracing/jaeger-agent)
**jaeger-collector**  | [hub.docker.com/r/jaegertracing/jaeger-collector/](https://hub.docker.com/r/jaegertracing/jaeger-collector/) | [quay.io/repository/jaegertracing/jaeger-collector](https://quay.io/repository/jaegertracing/jaeger-collector)
**jaeger-query**      | [hub.docker.com/r/jaegertracing/jaeger-query/](https://hub.docker.com/r/jaegertracing/jaeger-query/)         | [quay.io/repository/jaegertracing/jaeger-query](https://quay.io/repository/jaegertracing/jaeger-query)
**jaeger-ingester**   | [hub.docker.com/r/jaegertracing/jaeger-ingester/](https://hub.docker.com/r/jaegertracing/jaeger-ingester/)   | [quay.io/repository/jaegertracing/jaeger-ingester](https://quay.io/repository/jaegertracing/jaeger-ingester)
**jaeger-remote-storage**   | [hub.docker.com/r/jaegertracing/jaeger-remote-storage/](https://hub.docker.com/r/jaegertracing/jaeger-remote-storage/)   | [quay.io/repository/jaegertracing/jaeger-remote-storage](https://quay.io/repository/jaegertracing/jaeger-remote-storage)

The images listed above are the primary release versions. Most components have additional images published:
  * `${component}-debug` images include Delve debugger
  * `${component}-snapshot` images are published from the tip of the main branch for every commit, allowing testing of unreleased versions
  * `${component}-debug-snapshot` snapshot images that include the Delve debugger

There are orchestration templates for running Jaeger with:

  * Kubernetes: [github.com/jaegertracing/jaeger-kubernetes](https://github.com/jaegertracing/jaeger-kubernetes),
  * OpenShift: [github.com/jaegertracing/jaeger-openshift](https://github.com/jaegertracing/jaeger-openshift).

## Configuration Options

Jaeger binaries are configured via configuration YAML file.

!!!NEED TO WORK BELOW HERE

## All-in-one

Jaeger all-in-one is a special distribution that combines Jaeger components, [agent](#agent), [collector](#collector), and [query service/UI](#query-service--ui), in a single binary or container image. It is useful for single-node deployments where your trace volume is light enough to be handled by a single instance. By default, all-in-one starts with `memory` storage, meaning it will lose all data upon restart. All other [span storage backends](#span-storage-backends) can also be used with all-in-one, but `memory` and `badger` are exclusive to all-in-one because they cannot be shared between instances.

All-in-one listens to the same ports as the components it contains (described below), with the exception of the admin port.

Port  | Protocol | Function
----- | -------  | ---
14269 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

```bash
## make sure to expose only the ports you use in your deployment scenario!
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 9411:9411 \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

You can navigate to `http://localhost:16686` to access the Jaeger UI.

## Agent

{{< warning >}}
**jaeger-agent** is [deprecated](https://github.com/jaegertracing/jaeger/issues/4739). The OpenTelemetry data can be sent from the OpenTelemetry SDKs (equipped with OTLP exporters) directly to **jaeger-collector**. See the [Architecture](../architecture) page for alternative deployment options.
{{< /warning >}}

**jaeger-agent** is designed to receive tracing data in Thrift format over UDP and run locally on each host, either as a host agent / daemon or as an application sidecar. **jaeger-agent** exposes the following ports:

Port  | Protocol | Function
----- | -------  | ---
6831  | UDP      | Accepts [jaeger.thrift][jaeger-thrift] in `compact` Thrift protocol used by most current Jaeger clients.
6832  | UDP      | Accepts [jaeger.thrift][jaeger-thrift] in `binary` Thrift protocol used by Node.js Jaeger client (because [thriftrw][thriftrw] npm package does not support `compact` protocol).
5778  | HTTP     | Serves SDK configs, namely sampling strategies at `/sampling` (see [Remote Sampling](../sampling/#remote-sampling)).
5775  | UDP      | Accepts [zipkin.thrift][zipkin-thrift] in `compact` Thrift protocol (deprecated; only used by very old Jaeger clients, circa 2016).
14271 | HTTP     | Admin port: health check at `/` and metrics at `/metrics`.

It can be executed directly on the host or via Docker, as follows:

```sh
## make sure to expose only the ports you use in your deployment scenario!
docker run \
  --rm \
  -p6831:6831/udp \
  -p6832:6832/udp \
  -p5778:5778/tcp \
  -p5775:5775/udp \
  jaegertracing/jaeger-agent:{{< currentVersion >}}
```

### Discovery System Integration

**jaeger-agent**s can connect point-to-point to a single **jaeger-collector** address, which could be
load balanced by another infrastructure component (e.g. DNS) across multiple **jaeger-collector**s.
**jaeger-agent** can also be configured with a static list of **jaeger-collector** addresses.

On Docker, a command like the following can be used:

```sh
docker run \
  --rm \
  -p5775:5775/udp \
  -p6831:6831/udp \
  -p6832:6832/udp \
  -p5778:5778/tcp \
  jaegertracing/jaeger-agent:{{< currentVersion >}} \
  --reporter.grpc.host-port=jaeger-collector.jaeger-infra.svc:14250
```

When using gRPC, you have several options for load balancing and name resolution:

* Single connection and no load balancing. This is the default if you specify a single `host:port`. (example: `--reporter.grpc.host-port=jaeger-collector.jaeger-infra.svc:14250`)
* Static list of hostnames and round-robin load balancing. This is what you get with a comma-separated list of addresses. (example: `reporter.grpc.host-port=jaeger-collector1:14250,jaeger-collector2:14250,jaeger-collector3:14250`)
* Dynamic DNS resolution and round-robin load balancing. To get this behavior, prefix the address with `dns:///` and gRPC will attempt to resolve the hostname using SRV records (for [external load balancing](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md)), TXT records (for [service configs](https://github.com/grpc/grpc/blob/master/doc/service_config.md)), and A records. Refer to the [gRPC Name Resolution docs](https://github.com/grpc/grpc/blob/master/doc/naming.md) and the [dns_resolver.go implementation](https://github.com/grpc/grpc-go/blob/master/resolver/dns/dns_resolver.go) for more info. (example: `--reporter.grpc.host-port=dns:///jaeger-collector.jaeger-infra.svc:14250`)

### Agent level tags

Jaeger supports agent level tags, that can be added to the process tags of all spans passing through **jaeger-agent**. This is supported through the command line flag `--agent.tags=key1=value1,key2=value2,...,keyn=valuen`. Tags can also be set through an environment flag like so - `--agent.tags=key=${envFlag:defaultValue}` - The tag value will be set to the value of the `envFlag` environment key and `defaultValue` if not set.

## Collector

**jaeger-collector**s are stateless and thus many instances of **jaeger-collector** can be run in parallel.
**jaeger-collector**s require almost no configuration, except for storage location, such as
`--cassandra.keyspace` and `--cassandra.servers` options, or the location of Elasticsearch cluster,
via `--es.server-urls`, depending on which storage is specified. See the [CLI Flags](../cli/) for all
command line options.

At default settings **jaeger-collector** exposes the following ports:

| Port  | Protocol | Endpoint | Function
| ----- | -------  | -------- | ----
| 4317  | gRPC     | n/a      | Accepts traces in [OpenTelemetry OTLP format][otlp] (Protobuf).
| 4318  | HTTP     | `/v1/traces` | Accepts traces in [OpenTelemetry OTLP format][otlp] (Protobuf and JSON).
| 14268 | HTTP     | `/api/sampling` | Serves sampling policies (see [Remote Sampling](../sampling/#remote-sampling)).
|       |          | `/api/traces` | Accepts spans in [jaeger.thrift][jaeger-thrift] format with `binary` thrift protocol (`POST`).
| 14269 | HTTP     | `/`      | Admin port: health check (`GET`).
|       |          | `/metrics` | Prometheus-style metrics (`GET`).
| 9411  | HTTP     | `/api/v1/spans` and `/api/v2/spans` | Accepts Zipkin spans in Thrift, JSON and Proto (disabled by default).
| 14250 | gRPC     | n/a      | Used by **jaeger-agent** to send spans in [model.proto][] Protobuf format.

## Ingester

**jaeger-ingester** is a service which reads span data from Kafka topic and writes it to another storage backend (Elasticsearch or Cassandra).

Port  | Protocol | Function
----- | -------  | ---
14270 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

To view all exposed configuration options run the following command:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=cassandra \
  jaegertracing/jaeger-ingester:{{< currentVersion >}}
  --help
```

## Query Service & UI

**jaeger-query** serves the API endpoints and a React/Javascript UI.
The service is stateless and is typically run behind a load balancer, such as [**NGINX**](https://www.nginx.com/).

At default settings the **jaeger-query** service exposes the following port(s):

Port  | Protocol | Function
----- | -------  | ---
16685 | gRPC     | Protobuf/gRPC [QueryService](https://github.com/jaegertracing/jaeger-idl/blob/master/proto/api_v2/query.proto)
16686 | HTTP     | `/api/*` endpoints and Jaeger UI at `/`
16687 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

### Minimal deployment example (Elasticsearch backend):
```sh
docker run -d --rm \
  -p 16685:16685 \
  -p 16686:16686 \
  -p 16687:16687 \
  -e SPAN_STORAGE_TYPE=elasticsearch \
  -e ES_SERVER_URLS=http://<ES_SERVER_IP>:<ES_SERVER_PORT> \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```

### Clock Skew Adjustment

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. **jaeger-query** service implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/master/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to their timestamps.

Sometimes these adjustments themselves make the trace hard to understand. For example, when repositioning the server span within the bounds of its parent span, Jaeger does not know the exact relationship between the request and response latencies, so it assumes they are equal and places the child span in the middle of the parent span (see [issue #961](https://github.com/jaegertracing/jaeger/issues/961#issuecomment-453925244)).

**jaeger-query** service supports a configuration flag `--query.max-clock-skew-adjustment` that controls how much clock skew adjustment should be allowed. Setting this parameter to zero (`0s`) disables clock skew adjustment completely. This setting applies to all traces retrieved from the given query service. There is an open [ticket #197](https://github.com/jaegertracing/jaeger-ui/issues/197) to support toggling the adjustment on and off directly in the UI.

### UI Base Path

The base path for all **jaeger-query** HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running **jaeger-query** behind a reverse proxy.

The base path can be configured via the `--query.base-path` command line parameter or the `QUERY_BASE_PATH` environment variable.

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](../frontend-ui/).

## Aggregation Jobs for Service Dependencies

Production deployments need an external process that aggregates data and creates dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and writes them directly to the storage.

[cqlsh]: http://cassandra.apache.org/doc/latest/tools/cqlsh.html
[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[model.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/model.proto
[thriftrw]: https://www.npmjs.com/package/thriftrw
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/grpc/proto/storage.proto
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
