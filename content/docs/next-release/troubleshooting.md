---
title: Troubleshooting
description: Solve commonly encountered issues
weight: 10
---

Jaeger is composed of different components, each potentially running in its own host. It might be the case that one of these moving parts isn't working properly, causing spans to not be processed and stored. When something goes wrong, make sure to check the items listed here.

## Verify the sampling strategy

Before everything else, make sure to confirm what is the sampling strategy. By default, Jaeger uses a probabilistic sampling strategy, with a 1/1000th chance that the span will be reported. For development purposes or for low-traffic scenarios, however, it's appropriate to sample every trace.

Typically, the sampling strategy can be set via the environment variables `JAEGER_SAMPLER_TYPE` and `JAEGER_SAMPLER_PARAM`, but refer to the Jaeger Client's documentation for the language you are using for more details about which sampling strategies are available. When using the Jaeger Java Client, the strategy is usually printed out via the logging facility provided by the instrumented application when creating the tracer:

    2018-12-10 16:41:25 INFO  Configuration:236 - Initialized  tracer=JaegerTracer(..., sampler=ConstSampler(decision=true,  tags={sampler.type=const, sampler.param=true}), ...)

When diagnosing why spans are not being received by other components, make sure to configure the client to sample every trace, setting the `JAEGER_SAMPLER_TYPE` environment variable to `const` and the `JAEGER_SAMPLER_PARAM` to `true`.

## Use the logging reporter

Some Jaeger clients are able to log the spans that are being reported to the logging facility provided by the instrumented application. Typically, this can be done by setting the environment variable `JAEGER_REPORTER_LOG_SPANS` to `true`, but refer to the Jaeger Client's documentation for the language you are using. When using the Jaeger _Java_ Client, spans are reported like the following:

    2018-12-10 17:20:54 INFO  LoggingReporter:43 - Span reported:  e66dc77b8a1e813b:6b39b9c18f8ef082:a56f41e38ca449a4:1 -  getAccountFromCache

The log entry above contains three IDs: the trace ID `e66dc77b8a1e813b`, the span's ID `6b39b9c18f8ef082` and the span's parent ID `a56f41e38ca449a4`. When the backend components have the log level set to `debug`, the span and trace IDs should be visible on their standard output (see more about that below, under “Increase the logging in the backend components”).

The logging reporter follows the sampling decision made by the sampler, meaning that if the span is logged, it should also reach the agent or collector.

## Bypass the Jaeger Agent

By default, the Jaeger Client is configured to send spans via UDP to a Jaeger Agent running on `localhost`. As some networking setups might drop or block UDP packets, the Jaeger client can be configured to bypass the agent, sending spans directly to the collector. Some clients, such as the Jaeger Java Client, support the environment variable `JAEGER_ENDPOINT` which can be used to specify the collector's location, such as http://jaeger-collector:14268/api/traces. Refer to the Jaeger Client's documentation for the language you are using. When you have configured the `JAEGER_ENDPOINT` property to the endpoint for the collector, the Jaeger Java Client logs the following when the tracer is created:

    2018-12-10 17:06:30 INFO  Configuration:236 - Initialized  tracer=JaegerTracer(...,  reporter=CompositeReporter(reporters=[RemoteReporter(sender=HttpSender(),  ...), ...]), ...)

*IMPORTANT* the Jaeger Java Client will not fail when a connection to the Jaeger Collector can't be established. Spans will be collected and placed in an internal buffer. They might eventually reach the collector once a connection is established, or get dropped in case the buffer reaches its maximum size.

## Increase the logging in the backend components

The Jaeger Agent and Collector provide useful debugging information when the log level is set to `debug`. Every UDP packet that is received by the agent is logged by the agent, as well as every batch that is sent by the agent to the collector. The collector also logs every batch it receives and logs every span that is stored in the permanent storage.

Here's what to expect when the Jaeger Agent is started with the `--log-level=debug` flag:

    {"level":"debug","ts":1544458854.5367086,"caller":"processors/thrift_processor.go:113","msg":"Span(s) received by the agent","bytes-received":359}
    {"level":"debug","ts":1544458854.5408711,"caller":"tchannel/reporter.go:133","msg":"Span batch submitted by the agent","span-count":3}

In the collector's side, these are the expected log entries when the flag `--log-level=debug` is specified:

    {"level":"debug","ts":1544458854.5406284,"caller":"app/span_handler.go:90","msg":"Span batch processed by the collector.","ok":true}
    {"level":"debug","ts":1544458854.5406587,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"6b39b9c18f8ef082"}
    {"level":"debug","ts":1544458854.54068,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"d92976b6055e6779"}
    {"level":"debug","ts":1544458854.5406942,"caller":"app/span_processor.go:105","msg":"Span written to the storage by the collector","trace-id":"e66dc77b8a1e813b","span-id":"a56f41e38ca449a4"}

## Check the /metrics endpoint

For the cases where it's not possible or desirable to increase the logging in the collector's side, the `/metrics` endpoint can be used to check if spans for specific services were received. Assuming that the Jaeger Collector is available under a host named `jaeger-collector`, here's a sample `curl` call to obtain the metrics:

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
