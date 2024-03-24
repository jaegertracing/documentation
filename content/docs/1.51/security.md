---
title: Securing Jaeger Installation
hasparent: true
---

This page documents the existing security mechanisms in Jaeger, organized by the pairwise connections between Jaeger components. We ask for community help with implementing additional security measures (see [issue-1718][]).

## SDK to Agent

{{< warning >}}
**jaeger-agent** is [deprecated](https://github.com/jaegertracing/jaeger/issues/4739). The OpenTelemetry data can be sent from the OpenTelemetry SDKs (equipped with OTLP exporters) directly to **jaeger-collector**. Alternatively, use the OpenTelemetry Collector as a local agent.
{{< /warning >}}

Deployments that involve **jaeger-agent** are meant for trusted environments where the agent is run as a sidecar within the container's network namespace, or as a host agent. Therefore, there is currently no support for traffic encryption between clients and agents.

* {{< check_no >}} Sending trace data over UDP - no TLS/authentication.
* {{< check_no >}} Retrieving sampling configuration via HTTP - no TLS/authentication.

## SDK to Collector

OpenTelemetry SDKs can be configured to communicate directly with **jaeger-collector** via gRPC or HTTP, with optional TLS enabled.

* {{< check_yes >}} HTTP - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} gRPC - TLS with mTLS (client cert authentication) supported.
  * Covers boths span export and sampling configuration querying.

## Agent to Collector

{{< warning >}}
**jaeger-agent** is [deprecated](https://github.com/jaegertracing/jaeger/issues/4739).
{{< /warning >}}

* {{< check_yes >}} gRPC - TLS with client cert authentication supported.

## Collector/Ingester/Query-Service to Storage

* {{< check_yes >}} Cassandra - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} Elasticsearch - TLS with mTLS (client cert authentication) supported; bearer token propagation.
* {{< check_yes >}} Kafka - TLS with various authentication mechanisms supported (mTLS, Kerberos, plaintext).

## Browser to UI

* {{< check_no >}} HTTP - no TLS; bearer token authentication (pass-through to storage).
  * Blog post: [Protecting Jaeger UI with an OAuth sidecar Proxy](https://medium.com/jaegertracing/protecting-jaeger-ui-with-an-oauth-sidecar-proxy-34205cca4bb1).
  * Blog post: [Secure architecture for Jaeger with Apache httpd reverse proxy on OpenShift](https://medium.com/@larsmilland01/secure-architecture-for-jaeger-with-apache-httpd-reverse-proxy-on-openshift-f31983fad400).

## Consumers to Query Service

* {{< check_yes >}} HTTP - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} gRPC - TLS with mTLS (client cert authentication) supported.

[issue-1718]: https://github.com/jaegertracing/jaeger/issues/1718
