---
title: Securing Jaeger Installation
aliases: [../security]
hasparent: true
---

This page documents the existing security mechanisms in Jaeger, organized by the pairwise connections between Jaeger components.

## SDK to Collector

OpenTelemetry SDKs can be configured to communicate directly with Jaeger Collectors via gRPC or HTTP, with optional TLS enabled.

* {{< check_yes >}} HTTP - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} gRPC - TLS with mTLS (client cert authentication) supported.
  * Covers both span export and sampling configuration querying.

## Collector/Ingester/Query to Storage

* {{< check_yes >}} Cassandra - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} Elasticsearch - TLS with mTLS (client cert authentication) supported; bearer token propagation.
* {{< check_yes >}} Kafka - TLS with various authentication mechanisms supported (mTLS, Kerberos, plaintext).
* {{< check_yes >}} Prometheus (for [SPM](../../architecture/spm/)) - TLS with mTLS (client cert authentication) supported, as long as you've [configured your Prometheus server](https://prometheus.io/docs/guides/tls-encryption/) correctly.

| Storage | TLS | mTLS | Basic | Bearer Token | API Key | Kerberos |
| ------- | --- | ---- | ------ | ------------ | ------- | -------- |
| Cassandra | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} | {{< check_no >}} |
| Elasticsearch | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} |
| OpenSearch | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} |
| Kafka | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} | {{< check_yes >}} |
| Prometheus | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} | {{< check_no >}} |


## Browser to UI

* {{< check_yes >}} HTTP - TLS and bearer token authentication (pass-through to storage).
  * Blog post: [Protecting Jaeger UI with an OAuth sidecar Proxy](https://medium.com/jaegertracing/protecting-jaeger-ui-with-an-oauth-sidecar-proxy-34205cca4bb1).
  * Blog post: [Secure architecture for Jaeger with Apache httpd reverse proxy on OpenShift](https://medium.com/@larsmilland01/secure-architecture-for-jaeger-with-apache-httpd-reverse-proxy-on-openshift-f31983fad400).

## Consumers to Query

* {{< check_yes >}} HTTP - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} gRPC - TLS with mTLS (client cert authentication) supported.

[issue-1718]: https://github.com/jaegertracing/jaeger/issues/1718
