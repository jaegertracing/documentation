---
title: Securing Jaeger Installation
aliases: [../security]
hasparent: true
---

This page documents the existing security mechanisms in Jaeger, organized by the pairwise connections between Jaeger components. We ask for community help with implementing additional security measures (see [issue-1718][]).

## SDK to Collector

OpenTelemetry SDKs can be configured to communicate directly with **jaeger-collector** via gRPC or HTTP, with optional TLS enabled.

* {{< check_yes >}} HTTP - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} gRPC - TLS with mTLS (client cert authentication) supported.
  * Covers both span export and sampling configuration querying.

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
