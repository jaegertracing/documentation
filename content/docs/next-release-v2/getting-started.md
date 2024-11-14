---
title: Getting Started
hasparent: true
weight: 2
---

## In Docker

The easiest way to run Jaeger is by starting a Docker container:

```
docker run --rm --name jaeger \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 9411:9411 \
  jaegertracing/jaeger:{{< currentVersion >}} \
  --set receivers.otlp.protocols.http.endpoint=0.0.0.0:4318 \
  --set receivers.otlp.protocols.grpc.endpoint=0.0.0.0:4317
```

This runs the "all-in-one" configuration of Jaeger (using a configuration file embedded in the binary) that combines collector and query components in a single process and uses a transient in-memory storage for trace data. You can navigate to `http://localhost:16686` to access the Jaeger UI. See the [APIs page](../apis/) for a list of other exposed ports.

Note: the `--set` flags are necessary because by default OTLP receiver listens on `localhost` and therefore is not accessible from the host network even with port mappings. In the future versions the default will be changed to `0.0.0.0`.

## Instrumentation

Your applications must be instrumented before they can send tracing data to Jaeger. We recommend using the [OpenTelemetry][otel] instrumentation and SDKs.

## 🚗 HotROD Demo

HotROD (Rides on Demand) is a demo application that consists of several microservices and illustrates the use of [OpenTelemetry][otel] and distributed tracing. A tutorial / walkthrough is available in the blog post: [Take Jaeger for a HotROD ride][hotrod-tutorial].

Using this application you can:

- Discover architecture of the whole system via data-driven dependency diagram.
- View request timeline and errors; understand how the app works.
- Find sources of latency and lack of concurrency.
- Explore highly contextualized logging.
- Use baggage propagation to diagnose inter-request contention (queueing) and time spent in a service.
- Use open source libraries from `opentelemetry-contrib` to get vendor-neutral instrumentation 
for free.

### Running

We recommend running Jaeger and HotROD together via `docker compose`:

```bash
git clone git@github.com:jaegertracing/jaeger.git jaeger
cd jaeger/examples/hotrod
docker compose -f docker-compose-v2.yml up
# Ctrl-C to stop
```

Then navigate to `http://localhost:8080`. See the [README](https://github.com/jaegertracing/jaeger/blob/main/examples/hotrod/README.md) for other ways to run the demo.

## SPM

The Service Performance Monitoring (SPM) page has its own [Quick Start](../spm#getting-started) that shows how to explore that aspect of Jaeger.

[hotrod-tutorial]: https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2
[otel]: https://opentelemetry.io
