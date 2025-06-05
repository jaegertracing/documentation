---
title: Terminology
aliases: [../terminology]
hasparent: true
---

Jaeger represents tracing data in a data model inspired by the [OpenTracing Specification](https://github.com/opentracing/specification/blob/master/specification.md). The data model is logically very similar to [OpenTelemetry Traces](https://opentelemetry.io/docs/concepts/signals/traces/), with some naming differences:

| Jaeger               | OpenTelemetry   | Notes |
| -------------------- | --------------- | ----------------------------------------------------------------------- |
| Tags                 | Attributes      | Both support typed values, but nested tags are not supported in Jaeger. |
| Span Logs            | Span Events     | Point-in-time events on the span recorded in a structured form.         |
| Span References      | Span Links      | Jaeger's Span References have a required type (`child-of` or `follows-from`) and always refer to predecessor spans; OpenTelemetry's Span Links have no type, but allow attributes. |
| Process              | Resource        | A struct describing the entity that produces the telemetry.             |

### Span

A **span** represents a logical unit of work that has an operation name, the start time of the operation, and the duration. Spans may be nested and ordered to model causal relationships.

![Traces And Spans](/img/spans-traces.png)

### Trace

A **trace** represents the data or execution path through the system. It can be thought of as a directed acyclic graph of spans.

### Baggage

**Baggage** is arbitrary user-defined metadata (key-value pairs) that can be attached to distributed context and propagated by the tracing SDKs. See [W3C Baggage](https://www.w3.org/TR/baggage/) for more information.
