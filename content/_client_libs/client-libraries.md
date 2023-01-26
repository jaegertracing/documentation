---
title: Client Libraries
weight: 5
children:
- title: Client Features
  url: client-features
---

{{< warning >}}
Jaeger clients have been retired. Please use the OpenTelemetry SDKs.
{{< /warning >}}

## Deprecating Jaeger clients

The Jaeger clients have faithfully served our community for several years. We pioneered many new features, such as remotely controlled samplers and per-operation / adaptive sampling, which were critical to the success of distributed tracing deployments at large organizations. However, now that the larger community in OpenTelemetry has caught up with the Jaeger clients in terms of feature parity and there is full support for exporting data to Jaeger, we believe it is time to **decommission Jaeger's native clients and refocus the efforts on the OpenTelemetry SDKs**.

For new applications, we recommend using the [OpenTelemetry](https://opentelemetry.io/) APIs, SDKs, and instrumentation. Since v1.35, the Jaeger backend can receive trace data from the OpenTelemetry SDKs in their native [OpenTelemetry Protocol (OTLP)][otlp].

For existing applications that are already instrumented with the OpenTracing API, we recommend replacing the Jaeger clients with the corresponding OpenTelemetry SDKs and the OpenTracing shim/bridge available in most languages supported by Jaeger.

### Timeline

We plan to continue accepting pull requests and making new releases of Jaeger clients **through the end of 2021**. In January 2022 we will enter a code freeze period **for 6 months**, during which time we will no longer accept pull requests with new features, with the exception of security-related fixes.  After that we will archive the client library repositories and will no longer accept new changes.

### Migration to OpenTelemetry

The OpenTelemetry project [published a migration guide](https://opentelemetry.io/docs/migration/opentracing/) from the OpenTracing APIs to the OpenTelemetry SDKs via the OpenTracing bridges/shims. There may be different levels of maturity and features in different OpenTelemetry SDKs. We will keep updating the information below as more of it becomes available.

#### Baggage support

OpenTelemetry implements baggage propagation differently from OpenTracing and they are not completely equivalent. In OpenTelemetry the `context` layer sits below the tracing API and relies on immutable context objects, whereas baggage in OpenTracing is stored in a `span` which is mutable (and may occasionally lead to tricky race conditions when starting children spans).

#### We need your help!

If you find inaccuracies or have information that can be added, please open an issue or a PR to the [documentation repo](https://github.com/jaegertracing/documentation). If some features are missing and you need them, please open tickets in the respective OpenTelemetry repos or contibute. For example, Jaeger's remote samplers are not yet implemented in every OpenTelemetry SDK, but porting them from the Jaeger codebase is a fairly straightforward task.

#### Copying Jaeger code

We encourage OpenTelemetry SDK authors to copy relevant pieces of the Jaeger clients instead of depending on Jaeger modules directly. This is why we use a liberal APL2 license. When copying code, the correct way to respect the license requirements is to keep the copyright notices. For example, Jaeger authors did the same with the code originally written at Uber:

```
// Copyright (c) 2019 The Jaeger Authors.
// Copyright (c) 2017 Uber Technologies, Inc.
// ... <rest of Apache notice> ...
```

#### Java
* OpenTelemetry SDK: https://github.com/open-telemetry/opentelemetry-java
  * Remote sampling: [sdk-extensions/jaeger-remote-sampler](https://github.com/open-telemetry/opentelemetry-java/tree/main/sdk-extensions/jaeger-remote-sampler)
  * Internal SDK metrics: n/a
* OpenTracing Bridge: [opentracing-shim](https://github.com/open-telemetry/opentelemetry-java/tree/main/opentracing-shim)
  * Migration Guide: ["Migrating from Jaeger client to OpenTelemetry SDK"][blog-otel-java]

#### Python
* OpenTelemetry SDK: https://github.com/open-telemetry/opentelemetry-python
  * Remote sampling: ?
  * Internal SDK metrics: n/a
* OpenTracing Bridge: [opentelemetry-opentracing-shim](https://github.com/open-telemetry/opentelemetry-python/tree/main/shim/opentelemetry-opentracing-shim)
  * Migration Guide: available in the shim's README

#### Node.js
* OpenTelemetry SDK: https://github.com/open-telemetry/opentelemetry-js
  * Remote sampling: ?
  * Internal SDK metrics: n/a
* OpenTracing Bridge: [opentelemetry-shim-opentracing](https://github.com/open-telemetry/opentelemetry-js/tree/main/packages/opentelemetry-shim-opentracing)
  * Migration Guide: available in the shim's README and the corresponding readthedocs

#### Go
* OpenTelemetry SDK: https://github.com/open-telemetry/opentelemetry-go
  * Remote sampling: https://github.com/open-telemetry/opentelemetry-go-contrib/pull/936
  * Internal SDK metrics: n/a
* OpenTracing Bridge: [bridge/opentracing](https://github.com/open-telemetry/opentelemetry-go/tree/main/bridge/opentracing)
  * Migration Guide: ?

#### C# / .NET
* OpenTelemetry SDK: https://github.com/open-telemetry/opentelemetry-dotnet
  * Remote sampling: ?
  * Internal SDK metrics: n/a
* OpenTracing Bridge: [OpenTelemetry.Shims.OpenTracing](https://github.com/open-telemetry/opentelemetry-dotnet/tree/main/src/OpenTelemetry.Shims.OpenTracing)
  * Migration Guide: available in the shim's README, but is very terse

#### C++
* OpenTelemetry SDK: https://github.com/open-telemetry/opentelemetry-cpp
  * Remote sampling: ?
  * Internal SDK metrics: n/a
* OpenTracing Bridge: n/a
  * Migration Guide: n/a

## Intro

All Jaeger client libraries support the [OpenTracing APIs](http://opentracing.io). The following resources provide more information about instrumenting your application with OpenTracing:

* [OpenTracing tutorials](https://github.com/yurishkuro/opentracing-tutorial) for Java, Go, Python, Node.js and C#
* A deep dive blog post [Tracing HTTP request latency in Go][http-latency-medium]
* The official OpenTracing documentation and other materials at [opentracing.io](http://opentracing.io)
* The [`opentracing-contrib` org on GitHub](https://github.com/opentracing-contrib) contains many repositories with off-the-shelf instrumentation for many popular frameworks, including JAXRS & Dropwizard (Java), Flask & Django (Python), Go std library, etc.

The rest of this page contains information about configuring and instantiating a Jaeger tracer in an application that is already instrumented with OpenTracing API.

## Terminology

We use the terms *client library*, *instrumentation library*, and *tracer* interchangeably in this document.

## Supported Libraries

The following client libraries are officially supported:

{{< clientsTable >}}

Libraries in other languages are currently under development, please see [issue #366](https://github.com/jaegertracing/jaeger/issues/366).

## Initializing Jaeger Tracer

The initialization syntax is slightly different in each languages, please refer to the README's in the respective repositories.
The general pattern is to not create the Tracer explicitly, but use a Configuration class to do that.  Configuration allows
simpler parameterization of the Tracer, such as changing the default sampler or the location of Jaeger agent.

## Tracer Internals

### Sampling

See [Architecture | Sampling](../sampling#client-sampling-configuration).

### Reporters

Jaeger tracers use **reporters** to process finished {{< tip "spans" "span" >}}. Typically Jaeger libraries ship with the following reporters:

* **NullReporter** does nothing with the span. It can be useful in unit tests.
* **LoggingReporter** simply logs the fact that a span was finished, usually by printing the trace and span ID and the operation name.
* **CompositeReporter** takes a list of other reporters and invokes them one by one.
* **RemoteReporter** (default) buffers a certain number of finished spans in memory and uses a **sender** to submit a batch of spans out of process to Jaeger backend. The sender is responsible for serializing the span to the wire format (e.g. Thrift or JSON) and communicating with the backend components (e.g. over UDP or HTTP).

#### EMSGSIZE and UDP buffer limits

By default Jaeger libraries use a UDP sender to report finished {{< tip "spans" "span" >}} to the `jaeger-agent` daemon.
The default max packet size is 65,000 bytes, which can be transmitted without segmentation when
connecting to the agent via loopback interface. However, some OSs (in particular, MacOS), limit
the max buffer size for UDP packets, as raised in [this GitHub issue](https://github.com/uber/jaeger-client-node/issues/124).
If you run into issue with `EMSGSIZE` errors, consider raising the limits in your kernel (see the issue for examples).
You can also configure the client libraries to use a smaller max packet size, but that may cause
issues if you have large spans, e.g. if you log big chunks of data. Spans that exceed max packet size
are dropped by the clients (with metrics emitted to indicate that). Another alternative is
to use non-UDP transports, such as [HttpSender in Java][HttpSender] (not currently available for all languages).

### Metrics

Jaeger tracers emit various metrics about how many spans or traces they have started and finished, how many of them were sampled or not sampled, if there were any errors in decoding trace context from inbound requests or reporting spans to the backend.

TODO standardize and describe the metric names and labels (issues [#572](https://github.com/jaegertracing/jaeger/issues/572), [#611](https://github.com/jaegertracing/jaeger/issues/611)).

## Propagation Format

When `SpanContext` is encoded on the wire as part of the request to another service, Jaeger client libraries default to the Jaeger native propagation format specified below. In addition, Jaeger clients support [Zipkin B3 format](https://github.com/openzipkin/b3-propagation) and [W3C Trace-Context](https://github.com/w3c/distributed-tracing).

### Trace/Span Identity

#### Key

`uber-trace-id`

* Case-insensitive in HTTP
* Lower-case in protocols that preserve header case

#### Value

`{trace-id}:{span-id}:{parent-span-id}:{flags}`

* `{trace-id}`
    * 64-bit or 128-bit random number in base16 format
    * Can be variable length, shorter values are 0-padded on the left
      * Receivers MUST accept hex-strings shorter than 32 characters and 0-pad them on the left
      * Senders SHOULD generate hex strings of exactly 16 or 32 characters in length
    * Clients in some languages support 128-bit, migration pending
    * Value of 0 is not valid
* `{span-id}`
    * 64-bit random number in base16 format
    * Can be variable length, shorter values are 0-padded on the left
      * Receivers MUST accept hex-strings shorter than 16 characters and 0-pad them on the left
      * Senders SHOULD generate hex strings of exactly 16 characters in length
    * Value of 0 is not valid
* `{parent-span-id}`
    * 64-bit value in base16 format representing parent span id
    * Deprecated, most Jaeger clients ignore on the receiving side, but still include it on the sending side
    * 0 value is valid and means “root span” (when not ignored)
* `{flags}`
    * One byte bitmap, as one or two hex digits (leading zero may be omitted)
    * Bit 1 (right-most, least significant, bit mask `0x01`) is "sampled" flag
        * 1 means the trace is sampled and all downstream services are advised to respect that
        * 0 means the trace is not sampled and all downstream services are advised to respect that
            * We’re considering a new feature that allows downstream services to upsample if they find their tracing level is too low
    * Bit 2 (bit mask `0x02` ) is "debug" flag
        * Debug flag should only be set when the sampled flag is set
        * Instructs the backend to try really hard not to drop this trace
    * Bit 3 (bit mask `0x04` ) is not used
    * Bit 4 (bit mask `0x08` ) is "firehose" flag
        * Spans tagged as "firehose" are excluded from being indexed in the storage
        * The traces can only be retrieved by trace ID (usually available from other sources, like logs)
    * Other bits are unused

### Baggage

* Key: `uberctx-{baggage-key}`
* Value: `{baggage-value}` as a string (see Value Encoding below)
* Limitation: since HTTP headers don’t preserve the case, Jaeger recommends baggage keys to be lowercase-kebab-case,
e.g. `my-baggage-key-1`.

Example: the following code sequence:

```
span.SetBaggageItem("key1", "value1")
span.SetBaggageItem("key2", "value2")
```

will result in the following HTTP headers:

```
uberctx-key1: value1
uberctx-key2: value2
```

#### Value Encoding

OpenTracing defines two formats for plain text headers: `HTTP_HEADERS` and `TEXT_MAP`. The former was introduced to deal with restrictions imposed by the HTTP protocol on the context of the headers, whereas the latter does not impose any restrictions, e.g. it can be used with Kafka Record Headers. The main difference between these two formats in the Jaeger SDKs is that the baggage values are URL-encoded when using the `HTTP_HEADERS` propagation format.

Example: when using the `HTTP_HEADERS` propagation format, the following code sequence:

```
span.SetBaggageItem("key1", "value 1 / blah")
```

will result in the following HTTP header:

```
uberctx-key1: value%201%20%2F%20blah
```


[HttpSender]: https://github.com/jaegertracing/jaeger-client-java/blob/master/jaeger-thrift/src/main/java/io/jaegertracing/thrift/internal/senders/HttpSender.java
[http-latency-medium]: https://medium.com/@YuriShkuro/tracing-http-request-latency-in-go-with-opentracing-7cc1282a100a
[blog-otel-java]: https://medium.com/jaegertracing/migrating-from-jaeger-client-to-opentelemetry-sdk-bd337d796759
[otlp]: https://opentelemetry.io/docs/reference/specification/protocol/
