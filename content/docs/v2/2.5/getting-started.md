---
title: Getting Started
hasparent: true
weight: 2
---

If you are new to distributed tracing, please check the [Introduction](../) page.

## All-in-one

The easiest way to run Jaeger is by starting it in a container:

```
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 5778:5778 \
  -p 9411:9411 \
  jaegertracing/jaeger:{{< currentVersion >}}
```

This runs the **all-in-one** configuration of Jaeger ([see Architecture](../architecture/)) that combines collector and query components in a single process and uses a transient in-memory storage for trace data. You can navigate to `http://localhost:16686` to access the Jaeger UI. See the [APIs page](../apis/) for a full list of exposed ports.

In order to run Jaeger in other roles ([see Architecture](../architecture/)), an explicit configuration file ([see Configuration](../configuration/)) must be provided via the `--config` command line argument. When running in a container, the path to the config file must be mapped into the container file system (the `-v ...` mapping below):

```
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 5778:5778 \
  -p 9411:9411 \
  -v /path/to/local/config.yaml:/jaeger/config.yaml \
  jaegertracing/jaeger:{{< currentVersion >}} \
  --config /jaeger/config.yaml
```

{{< warning >}}
Your applications must be instrumented before they can send tracing data to Jaeger. We recommend using the [OpenTelemetry](https://opentelemetry.io/) instrumentation and SDKs.
{{< /warning >}}

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

We recommend running Jaeger and HotROD together via `docker compose`:

```bash
git clone https://github.com/jaegertracing/jaeger.git jaeger
cd jaeger/examples/hotrod
docker compose -f docker-compose-v2.yml up
# press Ctrl-C to exit
```

Then navigate to `http://localhost:8080`. See the [README](https://github.com/jaegertracing/jaeger/blob/v2.5.0/examples/hotrod/README.md) for other ways to run the demo.

## SPM

The Service Performance Monitoring (SPM) page has its own [Quick Start](../spm/#getting-started) that shows how to explore that aspect of Jaeger.

[hotrod-tutorial]: https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2
[otel]: https://opentelemetry.io
