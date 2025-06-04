---
title: Troubleshooting
description: Solve commonly encountered issues
hasparent: true
---

Jaeger backend is itself a distributed system, composed of different components, potentially running on many hosts. It might be the case that one of these moving parts is not working properly, causing spans to not be processed or stored. When something goes wrong, make sure to check the items listed here.

If you are using the OpenTelemetry Collector as part of your pipeline, make sure to check its own [Troubleshooting guide](https://opentelemetry.io/docs/collector/troubleshooting/).

## Verify the sampling strategy

Before everything else, make sure to confirm what sampling strategy is being used. For development purposes or for low-traffic scenarios, it is useful to sample every trace. In production, you may want to use lower rates. When diagnosing why spans are not being received by the backend, make sure to configure the SDK to _sample every trace_. Typically, the sampling strategy can be set via environment variables.

### OpenTelemetry SDKs

If you are using OpenTelemetry SDKs, they should default to `parentbased_always_on` sampler, which is effectively sampling at 100%. It can be changed via `OTEL_TRACES_SAMPLER` environment variable ([see documentation](https://github.com/open-telemetry/opentelemetry-specification/blob/main/specification/configuration/sdk-environment-variables.md)).

#### Using stdout Exporter

OpenTelemetry SDKs can be configured with an exporter that prints recorded spans to `stdout`. Enabling it allows you to verify if the spans are actually being recorded.

### Remote Sampling

The Jaeger backend supports [Remote Sampling](../sampling/#remote-sampling), i.e., configuring sampling strategies centrally and making them available to the SDKs. Some, but not all, OpenTelemetry SDKs support remote sampling, often via extensions (refer to [Migration to OpenTelemetry](/sdk-migration/#migration-to-opentelemetry) for details).

If you suspect the remote sampling is not working correctly, try these steps:

1. Make sure that the SDK is actually configured to use remote sampling, points to the correct sampling service address (see [APIs](../apis/#remote-sampling-configuration)), and that address is reachable from your application's [networking namespace](#network-connectivity).
1. Verify that the server is returning the appropriate sampling strategy for your service:
```
    $ curl "jaeger-collector:14268/api/sampling?service=foobar"
    {"strategyType":"PROBABILISTIC","probabilisticSampling":{"samplingRate":0.001}}
```

## Bypass intermediate collectors

If your applications are not sending data directly to Jaeger but to intermediate layers, for example an OpenTelemetry Collector running as a host agent, try configuring the SDK to send data directly to Jaeger to narrow down the problem space.

## Network connectivity

If your Jaeger backend is still not able to receive spans (see the following sections on how to check logs and metrics for that), then the issue is most likely with your networking namespace configuration. When running the Jaeger backend components as containers, the typical mistakes are:

  * Not exposing the appropriate ports outside of the container. For example, the collector may be listening on `:4317` inside the container network namespace, but the port is not reachable from the outside.
  * Using `localhost` as the host name for server endpoints. `localhost` is fine when running on bare metal, but in a container it is recommended to listen on `0.0.0.0` instead.
  * Not making Jaeger's host name visible from the application's network namespace. For example, if you run both your application and Jaeger backend in separate containers in Docker, they either need to be in the same namespace, or the application's container needs to be given access to Jaeger backend using the `--link` option of the `docker` command.

## Increase the logs verbosity

Jaeger provides useful debugging information when the log level is set to `debug`. See [Monitoring](../monitoring/#logging) for more details on increasing logging verbosity.

## Check the /metrics endpoint

For the cases where it's not possible or desirable to increase the logging verbosity, the `/metrics` endpoint can be used to check how trace data is being received and processed by Jaeger. See [Monitoring](../monitoring/#logging) for more details on configuring metrics production. Here's a sample `curl` call to obtain the metrics:

```
curl -s http://jaeger-collector:8888/metrics
```

If Jaeger is able to receive traces, the counter `otelcol_receiver_accepted_spans` should be going up. If it is able to successfully write traces into storage, the counter `otelcol_exporter_sent_spans` should also be going up at the same rate.

## Service Mesh: missing spans

When deploying your application as part of a service mesh like Istio, the number of moving parts increases significantly and might affect how (and which) spans are reported. If you expect to see spans generated by a service mesh but they are noe visible in the Jaeger UI, check the troubleshooting guides for the service mesh you are using. For example, on [Istio's website](https://istio.io/faq/distributed-tracing/#no-tracing).

## Run debug images of the backend components

We provide debug images for Jaeger, which include Jaeger binary compiled with optimizations disabled and the [delve debugger](https://github.com/go-delve/delve). When you run these images, delve triggers the execution of Jaeger as its child process and immediately attaches to it to begin a new debug session and start listening on TCP port 12345 for remote connections. You can then use your IDEs like [Visual Studio Code](https://code.visualstudio.com/) or [GoLand](https://www.jetbrains.com/go/) to connect to this port and attach with it remotely and perform [debugging](https://golangforall.com/en/post/go-docker-delve-remote-debug.html) by adding breakpoints.

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
