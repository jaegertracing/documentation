---
title: Troubleshooting
description: Solve commonly encountered issues
weight: 10
---

Jaeger is composed of different components, each potentially running in its own host. It might be the case that one of these moving parts isn't working properly, causing spans to not be processed and stored. When something goes wrong, make sure to check the items listed here.

## Verify the sampling strategy

Before everything else, make sure to confirm what sampling strategy is being used. By default, Jaeger uses a probabilistic sampling strategy, with a 1/1000th chance that the span will be reported. For development purposes or for low-traffic scenarios, however, it's appropriate to sample every trace.

Typically, the sampling strategy can be set via the environment variables `JAEGER_SAMPLER_TYPE` and `JAEGER_SAMPLER_PARAM`, but refer to the Jaeger Client's documentation for the language you are using for more details about which sampling strategies are available. When using the Jaeger _Java_ Client, the strategy is usually printed out via the logging facility provided by the instrumented application when creating the tracer:

    2018-12-10 16:41:25 INFO  Configuration:236 - Initialized  tracer=JaegerTracer(..., sampler=ConstSampler(decision=true,  tags={sampler.type=const, sampler.param=true}), ...)

When diagnosing why spans are not being received by other components, make sure to configure the client to sample every trace, setting the `JAEGER_SAMPLER_TYPE` environment variable to `const` and the `JAEGER_SAMPLER_PARAM` to `1`.

## Use the logging reporter

Most Jaeger clients are able to log the spans that are being reported to the logging facility provided by the instrumented application. Typically, this can be done by setting the environment variable `JAEGER_REPORTER_LOG_SPANS` to `true`, but refer to the Jaeger Client's documentation for the language you are using. In some languages, specifically in Go and Node.js, there are no de-facto standard logging facilities, so you need to explicitly pass a logger to the Client that implements a very narrow `Logger` interface defined by the Jaeger Client. When using the Jaeger _Java_ Client, spans are reported like the following:

    2018-12-10 17:20:54 INFO  LoggingReporter:43 - Span reported:  e66dc77b8a1e813b:6b39b9c18f8ef082:a56f41e38ca449a4:1 -  getAccountFromCache

The log entry above contains three IDs: the trace ID `e66dc77b8a1e813b`, the span's ID `6b39b9c18f8ef082` and the span's parent ID `a56f41e38ca449a4`. When the backend components have the log level set to `debug`, the span and trace IDs should be visible on their standard output (see more about that below, under “Increase the logging in the backend components”).

The logging reporter follows the sampling decision made by the sampler, meaning that if the span is logged, it should also reach the agent or collector.

## Bypass the Jaeger Agent

By default, the Jaeger Client is configured to send spans via UDP to a Jaeger Agent running on `localhost`. As some networking setups might drop or block UDP packets, or impose size limits, the Jaeger Client can be configured to bypass the Agent, sending spans directly to the Collector. Some clients, such as the Jaeger _Java_ Client, support the environment variable `JAEGER_ENDPOINT` which can be used to specify the Collector's location, such as `http://jaeger-collector:14268/api/traces`. Refer to the Jaeger Client's documentation for the language you are using. For example, when you have configured the `JAEGER_ENDPOINT` property in the Jaeger _Java_ Client, it logs the following when the tracer is created (notice `sender=HttpSender`):

    2018-12-10 17:06:30 INFO  Configuration:236 - Initialized  tracer=JaegerTracer(...,  reporter=CompositeReporter(reporters=[RemoteReporter(sender=HttpSender(),  ...), ...]), ...)

{{< warning >}}

The Jaeger Java Client will not fail when a connection to the Jaeger Collector can't be established. Spans will be collected and placed in an internal buffer. They might eventually reach the Collector once a connection is established, or get dropped in case the buffer reaches its maximum size.

{{< /warning >}}

If your Jaeger backend is still not able to receive spans (see the following sections on how to check logs and metrics for that), then the issue is most likely with your networking namespace configuration. When running the Jaeger backend components as Docker containers, the typical mistakes are:

  * Not exposing the appropriate ports outside of the container. For example, the collector may be listening on `:14268` inside the container network namespace, but the port is not reachable from the outside.
  * Not making the agent's or collector's host name visible from the application's network namespace. For example, if you run both your application and Jaeger backend in separate containers in Docker, they either need to be in the same namespace, or the application's container needs to be given access to Jaeger backend using the `--link` option of the `docker` command.

## Increase the logging in the backend components

The Jaeger Agent and Collector provide useful debugging information when the log level is set to `debug`. Every UDP packet that is received by the Agent is logged, as well as every batch that is sent by the Agent to the Collector. The Collector also logs every batch it receives and logs every span that is stored in the permanent storage.

Here's what to expect when the Jaeger Agent is started with the `--log-level=debug` flag:

    {"level":"debug","ts":1544458854.5367086,"caller":"processors/thrift_processor.go:113","msg":"Span(s) received by the agent","bytes-received":359}
    {"level":"debug","ts":1544458854.5408711,"caller":"tchannel/reporter.go:133","msg":"Span batch submitted by the agent","span-count":3}

On the Collector side, these are the expected log entries when the flag `--log-level=debug` is specified:

    {"level":"debug","ts":1544458854.5406284,"caller":"app/span_handler.go:90","msg":"Span batch processed by the collector.","ok":true}
    {"level":"debug","ts":1544458854.5406587,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"6b39b9c18f8ef082"}
    {"level":"debug","ts":1544458854.54068,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"d92976b6055e6779"}
    {"level":"debug","ts":1544458854.5406942,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"a56f41e38ca449a4"}

## Check the /metrics endpoint

For the cases where it's not possible or desirable to increase the logging on the Collector side, the `/metrics` endpoint can be used to check if spans for specific services were received. The `/metrics` endpoint is served from the admin port, which is different for each binary (see [Deployment](../deployment/)). Assuming that the Jaeger Collector is available under a host named `jaeger-collector`, here's a sample `curl` call to obtain the metrics:

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

## make: esc: Command not found

Make sure `esc` is installed:
```
make install-tools
```

`esc` will be installed in your `$GOPATH`; check it is added in your `$PATH`:
```
export PATH=$PATH:$(go env GOPATH)/bin
```

To make this more permanent, add the above `export` command to your preferred
login shell: `~/.bash_profile`, `~/.zshrc`, etc.