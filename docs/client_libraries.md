# Client Libraries

## Introduction

All Jaeger client libraries support the [OpenTracing standard](http://opentracing.io). The following resources provide more information about instrumenting your application with the OpenTracing APIs:

* [OpenTracing tutorials](https://github.com/yurishkuro/opentracing-tutorial) for Java, Go, Python, and Node.js
* A deep dive blog post [Tracing HTTP request latency in Go][http-latency-medium]
* The official OpenTracing documentation and other materials at [opentracing.io](http://opentracing.io)
* The `opentracing-contrib` [org on GitHub](https://github.com/opentracing-contrib) contains many repositories with off-the-shelf instrumentation for many popular frameworks, including JAXRS & Dropwizard (Java), Flask & Django (Python), Go std library, etc.

The rest of this page contains information about configuring and instantiating a Jaeger tracer in an application that is already instrumented with OpenTracing API.

## Terminology

We use the term _client library_, _instrumentation library_, and _tracer_ interchangeably in this document.

## Official libraries

| Language | Library                                                              |
| -------- | -------------------------------------------------------------------- |
| go       | [jaeger-client-go](https://github.com/uber/jaeger-client-go)         |
| java     | [jaeger-client-java](https://github.com/uber/jaeger-client-java)     |
| node     | [jaeger-client-node](https://github.com/uber/jaeger-client-node)     |
| python   | [jaeger-client-python](https://github.com/uber/jaeger-client-python) |
| C++      | [cpp-client](https://github.com/jaegertracing/cpp-client)            |

Libraries in other languages are currently under development, please see [issue #366](https://github.com/jaegertracing/jaeger/issues/366).

## Initializing Jaeger Tracer

The initialization syntax is slightly different in each languages, please refer to the README's in the respective repositories. The general pattern is to not create the Tracer explicitly, but use a Configuration class to do that. Configuration allows simpler parameterization of the Tracer, such as changing the default sampler or the location of Jaeger agent.

## Tracer Internals

### Sampling

Jaeger libraries implement consistent upfront (or head-based) sampling. For example, assume we have a simple call graph where service A calls service B, and B calls service C: `A -> B -> C`. When service A receives a request that contains no tracing information, Jaeger tracer will start a new trace, assign it a random trace ID, and make a sampling decision based on the currently installed sampling strategy. The sampling decision will be propagated with the requests to B and to C, so those services will not be making the sampling decision again but instead will respect the decision made by the top service A. This approach guarantees that if a trace is sampled, all its spans will be recorded in the backend. If each service was making its own sampling decision we would rarely get complete traces in the backend.

When using configuration object to instantiate the tracer, the type of sampling can be selected via `sampler.type` and `sampler.param` properties. Jaeger libraries support the following samplers:

* **Constant** (`sampler.type=const`) sampler always makes the same decision for all traces. It either samples all traces (`sampler.param=1`) or none of them (`sampler.param=0`).
* **Probabilistic** (`sampler.type=probabilistic`) sampler makes a random sampling decision with the probability of sampling equal to the value of `sampler.param` property. For example, with `sampler.param=0.1` approximately 1 in 10 traces will be sampled.
* **Rate Limiting** (`sampler.type=ratelimiting`) sampler uses a leaky bucket rate limiter to ensure that traces are sampled with a certain constant rate. For example, when `sampler.param=2.0` it will sample requests with the rate of 2 traces per second.
* **Remote** (`sampler.type=remote`, which is also the default) sampler consults Jaeger agent for the appropriate sampling strategy to use in the current service. This allows controlling the sampling strategies in the services from a central configuration in Jaeger backend, or even dynamically (see [Adaptive Sampling](https://github.com/jaegertracing/jaeger/issues/365)).

### Reporters

Jaeger tracers use **reporters** to process finished spans. Typically Jaeger libraries ship with the following reporters:

* **NullReporter** does nothing with the span. It can be useful in unit tests.
* **LoggingReporter** simply logs the fact that a span was finished, usually by printing the trace and span ID and the operation name.
* **CompositeReporter** takes a list of other reporters and invokes them one by one.
* **RemoteReporter** (default) buffers a certain number of finished spans in memory and uses a **sender** to submit a batch of spans out of process to Jaeger backend. The sender is responsible for serializing the span to the wire format (e.g. Thrift of JSON) and communicating with the backend components (e.e. over UDP or HTTP).

#### EMSGSIZE and UDP buffer limits

By default Jaeger libraries use a UDP sender to report finished spans to `jaeger-agent` sidecar. The default max packet size is 65,000 bytes, which can be transmitted without segmentation when connecting to the agent via loopback interface. However, some OSs (in particular, MacOS), limit the max buffer size for UDP packets, as raised in [this GitHub issue](https://github.com/uber/jaeger-client-node/issues/124). If you run into issue with `EMSGSIZE` errors, consider raising the limits in your kernel (see the issue for examples). You can also configure the client libraries to use a smaller max packet size, but that may cause issues if you have large spans, e.g. if you log big chunks of data. Spans that exceed max packet size are dropped by the clients (with metrics emitted to indicate that). Another alternative is to use non-UDP transports, such as [HttpSender in Java][httpsender] (not currently available for all languages).

### Metrics

Jaeger tracers emit various metrics about how many spans or traces they have started and finished, how many of them were sampled or not sampled, if there were any errors in decoding trace context from inbound requests or reporting spans to the backend.

TODO standardize and describe the metric names and labels (issues [#572](https://github.com/jaegertracing/jaeger/issues/572), [#611](https://github.com/jaegertracing/jaeger/issues/611)).

## Propagation Format

When `SpanContext` is encoded on the wire as part of the request to another service, Jaeger client libraries default to the encoding specified below. In the future Jaeger will support the upcoming [W3C Trace-Context specification](https://github.com/w3c/distributed-tracing).

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
  * Clients in some languages support 128-bit, migration pending
  * Value of 0 is invalid
* `{span-id}`
  * 64-bit random number in base16 format
* `{parent-span-id}`
  * 64-bit value in base16 format representing parent span id
  * Deprecated, most Jaeger clients ignore on the receiving side, but still include it on the sending side
  * 0 value is valid and means “root span” (when not ignored)
* `{flags}`
  * One byte bitmap, as two hex digits
  * Bit 1 (right-most, least significant) is “sampled” flag
    * 1 means the trace is sampled and all downstream services are advised to respect that
    * 0 means the trace is not sampled and all downstream services are advised to respect that
      * We’re considering a new feature that allows downstream services to upsample if they find their tracing level is too low
  * Bit 2 is “debug” flag
    * Debug flag implies sampled flag
    * Instructs the backend to try really hard not to drop this trace
  * Other bits are unused

### Baggage

* Key: `uberctx-{baggage-key}`
* Value: url-encoded string
* Limitation: since HTTP headers don’t preserve the case, Jaeger recommends baggage keys to be lowercase-snake-case, e.g. `my-baggage-key-1`.

[httpsender]: https://github.com/uber/jaeger-client-java/blob/master/jaeger-core/src/main/java/com/uber/jaeger/senders/HttpSender.java
[http-latency-medium]: https://medium.com/@YuriShkuro/tracing-http-request-latency-in-go-with-opentracing-7cc1282a100a
