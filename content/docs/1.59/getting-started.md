---
title: Getting Started
description: Get up and running with Jaeger in your local environment
weight: 2
---

If you are new to distributed tracing, please check the [Introduction](../) page.

## Instrumentation

Your applications must be instrumented before they can send tracing data to Jaeger. We recommend using the [OpenTelemetry][otel] instrumentation and SDKs.

Historically, the Jaeger project supported its own SDKs (aka tracers, client libraries) that implemented the OpenTracing API. As of 2022, the Jaeger SDKs are no longer supported, and all users are advised to migrate to OpenTelemetry.

## All in One

**all-in-one** is an executable designed for quick local testing. It includes the Jaeger UI, **jaeger-collector**, **jaeger-query**, and **jaeger-agent**, with an in memory storage component.

The simplest way to start the all-in-one is to use the pre-built image published to DockerHub (a single command line).

```bash
docker run --rm --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 9411:9411 \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

Or run the `jaeger-all-in-one(.exe)` executable from the [binary distribution archives][download]:

```bash
jaeger-all-in-one --collector.zipkin.host-port=:9411
```

You can then navigate to `http://localhost:16686` to access the Jaeger UI.

The container exposes the following ports:

Port  | Protocol | Component | Function
----- | -------  | --------- | ---
6831  | UDP      | agent     | accept `jaeger.thrift` over Thrift-compact protocol (used by most SDKs)
6832  | UDP      | agent     | accept `jaeger.thrift` over Thrift-binary protocol (used by Node.js SDK)
5775  | UDP      | agent     | (deprecated) accept `zipkin.thrift` over compact Thrift protocol (used by legacy clients only)
5778  | HTTP     | agent     | serve configs (sampling, etc.)
      |          |           |
16686 | HTTP     | query     | serve frontend
      |          |           |
4317  | HTTP     | collector | accept OpenTelemetry Protocol (OTLP) over gRPC
4318  | HTTP     | collector | accept OpenTelemetry Protocol (OTLP) over HTTP
14268 | HTTP     | collector | accept `jaeger.thrift` directly from clients
14250 | HTTP     | collector | accept `model.proto`
9411  | HTTP     | collector | Zipkin compatible endpoint (optional)


### With Service Performance Monitoring (SPM)

Please refer to [Service Performance Monitoring (SPM)](../spm#getting-started).

## On Kubernetes

Please see Kubernetes Operator: https://github.com/jaegertracing/jaeger-operator

## Sample App: HotROD

HotROD (Rides on Demand) is a demo application that consists of several microservices and illustrates
the use of [OpenTelemetry][otel] and distributed tracing. A tutorial / walkthrough is available in the blog post:
[Take Jaeger for a HotROD ride][hotrod-tutorial].

The HotROD app can be run standalone, but requires Jaeger backend to view the traces.

### Features

- Discover architecture of the whole system via data-driven dependency
  diagram.
- View request timeline and errors; understand how the app works.
- Find sources of latency and lack of concurrency.
- Highly contextualized logging.
- Use baggage propagation to diagnose inter-request contention (queueing) and time spent in a service.
- Use open source libraries from `opentelemetry-contrib` to get vendor-neutral instrumentation for free.

### Running

We recommend running Jaeger and HotROD together via `docker compose`.


#### With Docker Compose

```bash
git clone git@github.com:jaegertracing/jaeger.git jaeger
cd jaeger/examples/hotrod
docker compose up
# Ctrl-C to stop
```

#### With Docker

```bash
docker run --rm -it --link jaeger \
  -p8080-8083:8080-8083 \
  -e OTEL_EXPORTER_OTLP_ENDPOINT="http://jaeger:4318" \
  jaegertracing/example-hotrod:{{< currentVersion >}} \
  all --otel-exporter=otlp
```

#### From Source

In order to run from source you need:

- [Go toolchain](https://golang.org/doc/install) installed on your machine
  (see [go.mod](https://github.com/jaegertracing/jaeger/blob/v1.59.0/go.mod) file for minimum required Go version).
- A [running Jaeger backend](#all-in-one) to view the traces.

```bash
git clone git@github.com:jaegertracing/jaeger.git jaeger
cd jaeger
go run ./examples/hotrod/main.go all
```

#### From binary distribution

Run `example-hotrod(.exe)` executable from the [binary distribution archives][download]:
```bash
example-hotrod all
```

Then navigate to `http://localhost:8080`.


## Migrating from Zipkin

**jaeger-collector** service exposes Zipkin compatible REST API `/api/v1/spans` which accepts both Thrift and JSON. Also there is `/api/v2/spans` for JSON and Proto.
By default it's disabled. It can be enabled with `--collector.zipkin.host-port=:9411`.

Zipkin [Thrift](https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift) IDL and Zipkin [Proto](https://github.com/jaegertracing/jaeger-idl/blob/master/proto/zipkin.proto) IDL files can be found in [jaegertracing/jaeger-idl](https://github.com/jaegertracing/jaeger-idl) repository.
They're compatible with [openzipkin/zipkin-api](https://github.com/openzipkin/zipkin-api) [Thrift](https://github.com/openzipkin/zipkin-api/blob/master/thrift/zipkinCore.thrift) and [Proto](https://github.com/openzipkin/zipkin-api/blob/master/zipkin.proto).

[hotrod-tutorial]: https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2
[otel]: https://opentelemetry.io
[download]: ../../../download/
