---
title: Getting Started
description: Get up and running with Jaeger in your local environment
weight: 2
---

If you are new to distributed tracing, please check the [Introduction](../) page.

## Instrumentation

Your applications must be instrumented before they can send tracing data to Jaeger backend. Check the [Client Libraries](../client-libraries) section for information about how to use the OpenTracing API and how to initialize and configure Jaeger tracers.

## All in One

All-in-one is an executable designed for quick local testing, launches the Jaeger UI, collector, query, and agent, with an in memory storage component.

The simplest way to start the all-in-one is to use the pre-built image published to DockerHub (a single command line).

```bash
docker run -d --name jaeger \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
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
5775  | UDP      | agent     | accept `zipkin.thrift` over compact thrift protocol (deprecated, used by legacy clients only)
6831  | UDP      | agent     | accept `jaeger.thrift` over compact thrift protocol
6832  | UDP      | agent     | accept `jaeger.thrift` over binary thrift protocol
5778  | HTTP     | agent     | serve configs
16686 | HTTP     | query     | serve frontend
14268 | HTTP     | collector | accept `jaeger.thrift` directly from clients
14250 | HTTP     | collector | accept `model.proto`
9411  | HTTP     | collector | Zipkin compatible endpoint (optional)

### With Service Performance Monitoring (SPM)

Please refer to [Service Performance Monitoring (SPM)](../spm#getting-started).

## Kubernetes and OpenShift

* Kubernetes templates: https://github.com/jaegertracing/jaeger-kubernetes
* Kubernetes Operator: https://github.com/jaegertracing/jaeger-operator
* OpenShift templates: https://github.com/jaegertracing/jaeger-openshift

## Sample App: HotROD

HotROD (Rides on Demand)  is a demo application that consists of several microservices and
illustrates the use of the [OpenTracing API](http://opentracing.io).
A tutorial / walkthrough is available in the blog post:
[Take OpenTracing for a HotROD ride][hotrod-tutorial].

It can be run standalone, but requires Jaeger backend to view the traces.

### Features

-   Discover architecture of the whole system via data-driven dependency
    diagram.
-   View request timeline and errors; understand how the app works.
-   Find sources of latency and lack of concurrency.
-   Highly contextualized logging.
-   Use baggage propagation to:

    -   Diagnose inter-request contention (queueing).
    -   Attribute time spent in a service.

-   Use open source libraries with OpenTracing integration to get
    vendor-neutral instrumentation for free.

### Prerequisites

-   You need [Go toolchain](https://golang.org/doc/install) installed on your machine to run from source
    (see [go.mod](https://github.com/jaegertracing/jaeger/blob/master/go.mod) file for required Go version).
-   Requires a [running Jaeger backend](#all-in-one) to view the traces.

### Running

#### From Source

```bash
mkdir -p $GOPATH/src/github.com/jaegertracing
cd $GOPATH/src/github.com/jaegertracing
git clone git@github.com:jaegertracing/jaeger.git jaeger
cd jaeger
go run ./examples/hotrod/main.go all
```
#### From docker

```bash
docker run --rm -it \
  --link jaeger \
  -p8080-8083:8080-8083 \
  -e JAEGER_AGENT_HOST="jaeger" \
  jaegertracing/example-hotrod:{{< currentVersion >}} \
  all
```

#### From binary distribution

Run `example-hotrod(.exe)` executable from the [binary distribution archives][download]:
```bash
example-hotrod all
```

Then navigate to `http://localhost:8080`.


## Migrating from Zipkin

Collector service exposes Zipkin compatible REST API `/api/v1/spans` which accepts both Thrift and JSON. Also there is `/api/v2/spans` for JSON and Proto.
By default it's disabled. It can be enabled with `--collector.zipkin.host-port=:9411`.

Zipkin [Thrift](https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift) IDL and Zipkin [Proto](https://github.com/jaegertracing/jaeger-idl/blob/master/proto/zipkin.proto) IDL files can be found in [jaegertracing/jaeger-idl](https://github.com/jaegertracing/jaeger-idl) repository.
They're compatible with [openzipkin/zipkin-api](https://github.com/openzipkin/zipkin-api) [Thrift](https://github.com/openzipkin/zipkin-api/blob/master/thrift/zipkinCore.thrift) and [Proto](https://github.com/openzipkin/zipkin-api/blob/master/zipkin.proto).

[hotrod-tutorial]: https://medium.com/@YuriShkuro/take-opentracing-for-a-hotrod-ride-f6e3141f7941
[download]: ../../../download/
