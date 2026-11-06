---
title: Terminology
description: The Jaeger data model and how its terms map to OpenTelemetry.
aliases: [../terminology]
hasparent: true
---

Jaeger uses the [OpenTelemetry trace data model](https://opentelemetry.io/docs/concepts/signals/traces/): it receives spans over OTLP and the UI shows them with OpenTelemetry names. Jaeger's own formats, which predate OpenTelemetry, still appear in the [v1 query API](../apis/), the Thrift and Protobuf definitions in [jaeger-idl](https://github.com/jaegertracing/jaeger-idl) and the storage schemas, and they use different names for some of the same concepts:

| OpenTelemetry   | Jaeger v1 API and storage | Notes |
| --------------- | ------------------------- | ----- |
| Attributes      | Tags                      | Both support typed values, but nested tags are not supported in Jaeger. |
| Span Events     | Span Logs                 | Point-in-time events on the span recorded in a structured form. |
| Span Links      | Span References           | A Jaeger Span Reference has a required type, `child-of` or `follows-from`, and always points at an earlier span. An OpenTelemetry Span Link has no type but can carry attributes. |
| Resource        | Process                   | A description of the entity that produces the telemetry. |

### Span

A **span** represents a logical unit of work that has an operation name, the start time of the operation, and the duration. Spans may be nested and ordered to model causal relationships.

[![Traces And Spans](/img/spans-traces.png)](/img/spans-traces.png)

### Trace

A **trace** represents the data or execution path through the system. It can be thought of as a directed acyclic graph of spans.

### Baggage

**Baggage** is arbitrary user-defined metadata (key-value pairs) that can be attached to distributed context and propagated by the tracing SDKs. See [W3C Baggage](https://www.w3.org/TR/baggage/) for more information.
