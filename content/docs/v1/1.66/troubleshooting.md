---
title: Troubleshooting
description: Solve commonly encountered issues
weight: 10
---

Jaeger backend is itself a distributed system, composed of different components, potentially running on many hosts. It might be the case that one of these moving parts is not working properly, causing spans to not be processed or stored. When something goes wrong, make sure to check the items listed here.

If you are using the OpenTelemetry Collector as part of your pipeline, make sure to check its own [Troubleshooting guide](https://opentelemetry.io/docs/collector/troubleshooting/).

## Verify the sampling strategy

Before everything else, make sure to confirm what sampling strategy is being used. For development purposes or for low-traffic scenarios, it is useful to sample every trace. In production, you may want to use lower rates. When diagnosing why spans are not being received by the backend, make sure to configure the SDK to _sample every trace_. Typically, the sampling strategy can be set via environment variables.

### OpenTelemetry SDKs

If you are using OpenTelemetry SDKs, they should default to `parentbased_always_on` sampler, which is effectively sampling at 100%. It can be changed via `OTEL_TRACES_SAMPLER` environment variable ([see documentation](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/configuration/sdk-environment-variables.md)).

#### Using stdout Exporter

OpenTelemetry SDKs can be configured with an exporter that prints recorded spans to `stdout`. Enabling it allows you to verify if the spans are actually being recorded.

### Jaeger SDKs (deprecated)

If you are using one of the Jaeger SDKs, they default to a probabilistic sampling strategy with `1-in-1000` chance that the trace will be recorded. The strategy can be changed by setting these environment variables:

```
JAEGER_SAMPLER_TYPE=const
JAEGER_SAMPLER_PARAM=1
```

For example, when using the Jaeger SDK for Java, the strategy is usually printed out via the logging facility provided by the instrumented application when creating the tracer:

    2018-12-10 16:41:25 INFO  Configuration:236 - Initialized  tracer=JaegerTracer(..., sampler=ConstSampler(decision=true,  tags={sampler.type=const, sampler.param=true}), ...)

### Remote Sampling

The Jaeger backend supports [Remote Sampling](../sampling/#remote-sampling), i.e., configuring sampling strategies centrally and making them available to the SDKs. Some, but not all, OpenTelemetry SDKs support remote sampling, often via extensions (refer to [Migration to OpenTelemetry](/sdk-migration/#migration-to-opentelemetry) for details).

If you suspect the remote sampling is not working correctly, try these steps:

1. Make sure that the SDK is actually configured to use remote sampling, points to the correct sampling service address (see [APIs](../apis/#remote-sampling-configuration-stable)), and that address is reachable from your application's [networking namespace](#networking-namespace).
1. Verify that the server is returning the appropriate sampling strategy for your service:
```
    $ curl "jaeger-collector:14268/api/sampling?service=foobar"
    {"strategyType":"PROBABILISTIC","probabilisticSampling":{"samplingRate":0.001}}
```

## Networking Namespace

If your Jaeger backend is still not able to receive spans (see the following sections on how to check logs and metrics for that), then the issue is most likely with your networking namespace configuration. When running the Jaeger backend components as Docker containers, the typical mistakes are:

  * Not exposing the appropriate ports outside of the container. For example, the collector may be listening on `:4317` inside the container network namespace, but the port is not reachable from the outside.
  * Not making **jaeger-collector**'s host name visible from the application's network namespace. For example, if you run both your application and Jaeger backend in separate containers in Docker, they either need to be in the same namespace, or the application's container needs to be given access to Jaeger backend using the `--link` option of the `docker` command.

## Increase the logging in the backend components

Jaeger provides useful debugging information when the log level is set to `debug`. **jaeger-collector** logs information of every batch it receives and every span that is stored in the permanent storage.

On the **jaeger-collector** side, these are the expected log entries when the flag `--log-level=debug` is specified:

    {"level":"debug","ts":1544458854.5406284,"caller":"app/span_handler.go:90","msg":"Span batch processed by the collector.","ok":true}
    {"level":"debug","ts":1544458854.5406587,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"6b39b9c18f8ef082"}
    {"level":"debug","ts":1544458854.54068,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"d92976b6055e6779"}
    {"level":"debug","ts":1544458854.5406942,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"a56f41e38ca449a4"}

## Check the /metrics endpoint

For the cases where it's not possible or desirable to increase the logging in the Jaeger backend, the `/metrics` endpoint can be used to check if spans for specific services are being received. The `/metrics` endpoint is served from the admin port, which is different for each binary (see [Deployment](../deployment/)). Assuming that **jaeger-collector** is available under a host named `jaeger-collector`, here's a sample `curl` call to obtain the metrics:

    curl http://jaeger-collector:14269/metrics

The following metrics are of special interest:

    jaeger_collector_spans_received
    jaeger_collector_spans_saved_by_svc
    jaeger_collector_traces_received
    jaeger_collector_traces_saved_by_svc

The first two metrics should have similar values for the same service. Similarly, the two `traces` metrics should also have similar values. For instance, this is an example of a setup that is working as expected:

    jaeger_collector_spans_received{debug="false",format="jaeger",svc="order"} 8
    jaeger_collector_spans_saved_by_svc{debug="false",result="ok",svc="order"} 8
    jaeger_collector_traces_received{debug="false",format="jaeger",svc="order"} 1
    jaeger_collector_traces_saved_by_svc{debug="false",result="ok",svc="order"} 1

## Istio: missing spans

When deploying your application as part of a service mesh like Istio, the number of moving parts increases significantly and might affect how (and which) spans are reported. If you expect to see spans generated by Istio but they aren't being visible in the Jaeger UI, check the troubleshooting guide on [Istio's website](https://istio.io/faq/distributed-tracing/#no-tracing).

## Run debug images of the backend components

We provide debug images for each Jaeger component. These images have [delve](https://github.com/go-delve/delve) and respective Jaeger component compiled with optimizations disabled. When you run these images, delve triggers the execution of the Jaeger component as its child process and immediately attaches to it to begin a new debug session and start listening on TCP port 12345 for remote connections. You can then use your IDEs like [Visual Studio Code](https://code.visualstudio.com/) or [GoLand](https://www.jetbrains.com/go/) to connect to this port and attach with it remotely and perform [debugging](https://golangforall.com/en/post/go-docker-delve-remote-debug.html) by adding breakpoints.

For Visual Studio Code, you need to have the following configuration at the root of your local clone of the Jaeger source code:

    $ cat .vscode/launch.json
    {
        "version": "0.2.0",
        "configurations": [
            {
                "name": "Launch remote",
                "type": "go",
                "request": "attach",
                "mode": "remote",
                "remotePath": "",
                "port": 12345,
                "host": "127.0.0.1",
                "cwd": "${workspaceRoot}",
            }
        ]
    }
