---
title: Live Demo
description: Try Jaeger with the HotROD demo application
type: live-demo
---

# Try Jaeger with HotROD

Experience Jaeger's distributed tracing capabilities with **HotROD** (Rides on Demand), a demo application that showcases real-world microservices tracing scenarios.

## 🚗 About HotROD

HotROD is a demo application consisting of several microservices that illustrates the use of [OpenTelemetry](https://opentelemetry.io) and distributed tracing. It simulates a ride-sharing service with realistic performance bottlenecks and errors that you can explore using Jaeger.

### What You Can Learn

With the HotROD demo, you can:

- **Discover architecture** - View data-driven dependency diagrams of the entire system
- **Analyze request flows** - See request timelines and understand how the application works
- **Find performance bottlenecks** - Identify sources of latency and lack of concurrency
- **Explore contextualized logging** - See how logs correlate with traces
- **Debug inter-service issues** - Use baggage propagation to diagnose queueing and service contention
- **Experience vendor-neutral instrumentation** - See OpenTelemetry libraries in action

## Quick Start

The fastest way to try Jaeger with HotROD is using Docker Compose:

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)

### Run the Demo

```bash
# Clone the Jaeger repository
git clone https://github.com/jaegertracing/jaeger.git jaeger
cd jaeger/examples/hotrod

# Start Jaeger and HotROD
docker compose up

# Note: For some Jaeger v2 versions, you may need to use:
docker compose -f docker-compose-v2.yml up
```

### Access the Applications

Once running, you can access:

- **HotROD Application**: `http://localhost:8080`
- **Jaeger UI**: `http://localhost:16686`

## Guided Tutorial

For a comprehensive walkthrough of the HotROD demo, read the blog post: [**Take Jaeger for a HotROD ride**](https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2).

This tutorial covers:
- How to generate traces by using the HotROD application
- Understanding the Jaeger UI and trace visualization
- Identifying and debugging performance issues
- Exploring service dependencies and call patterns

## Alternative Installation Methods

### Using Docker (Manual Setup)

If you prefer to run components separately:

```bash
# Start Jaeger v2
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 14268:14268 \
  jaegertracing/jaeger:{{< param "latestV2" >}} \
  --set receivers.otlp.protocols.http.endpoint=0.0.0.0:4318 \
  --set receivers.otlp.protocols.grpc.endpoint=0.0.0.0:4317

# Start HotROD
docker run -d --name hotrod \
  --link jaeger \
  -p 8080-8083:8080-8083 \
  -e OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318 \
  jaegertracing/example-hotrod:{{< param "latestV2" >}} \
  all --otel-exporter=otlp
```

### From Source Code

For developers who want to build from source:

```bash
# Clone and build
git clone https://github.com/jaegertracing/jaeger.git
cd jaeger
go run ./examples/hotrod/main.go all
```

## Connecting Your Applications

Want to send traces from your own applications to this demo instance? Configure your OpenTelemetry SDK to send traces to:

- **OTLP gRPC**: `http://localhost:4317`
- **OTLP HTTP**: `http://localhost:4318`
- **Jaeger Thrift**: `http://localhost:14268/api/traces`

### Example Configuration

Here's how to configure a simple application:

```javascript
// Node.js example
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-http');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
});

sdk.start();
```

```python
# Python example
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

otlp_exporter = OTLPSpanExporter(endpoint="http://localhost:4318/v1/traces")
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)
```

## Need Help?

- **Documentation**: Check out our [Getting Started guide](/docs/{{< param "latestV2" >}}/getting-started/)
- **Community**: Join our [Slack channel](https://cloud-native.slack.com/archives/CGG7NFUJ3) or [GitHub Discussions](https://github.com/jaegertracing/jaeger/discussions)
- **Issues**: Report problems on [GitHub Issues](https://github.com/jaegertracing/jaeger/issues)

---

Ready to get started? [Download Jaeger](/download/).
