---
title: Securing Jaeger Installation
hasparent: true
---

This page documents the existing security mechanisms in Jaeger, organized by the pairwise connections between Jaeger components. We ask for community help with implementing additional security measures (see [issue-1718][]).

## Client to Agent

Deployments that involve **jaeger-agent** are meant for trusted environments where the agent is run as a sidecar within the container's network namespace, or as a host agent. Therefore, there is currently no support for traffic encryption between clients and agents.

* {{< check_no >}} Sending trace data over UDP - no TLS/authentication.
* {{< check_no >}} Retrieving sampling configuration via HTTP - no TLS/authentication.

## Client to Collector

Clients can be configured to communicate directly with **jaeger-collector** via HTTP. Unfortunately, at this time the Jaeger backend does not provide means of configuring TLS for its HTTP servers. The connections can be secured by using a reverse proxy placed in front of **jaeger-collector**s.

* {{< check_no >}} HTTP - no TLS/authentication.
  * Some Jaeger clients support passing [auth-tokens or basic auth](../client-features/#tracer-configuration-via-environment-variables).
  * Blog post: [Protecting the collection of spans (using Keycloak)](https://medium.com/jaegertracing/protecting-the-collection-of-spans-1948d88682e5).
  * Blog post: [Secure architecture for Jaeger with Apache httpd reverse proxy on OpenShift](https://medium.com/@larsmilland01/secure-architecture-for-jaeger-with-apache-httpd-reverse-proxy-on-openshift-f31983fad400).

## Agent to Collector

* {{< check_yes >}} gRPC - TLS with client cert authentication supported.

## Collector/Query to Storage

* {{< check_yes >}} Cassandra - TLS with mTLS supported.
* {{< check_yes >}} Elasticsearch - TLS with mTLS supported; bearer token propagation.
* {{< check_yes >}} Kafka - TLS with various authentication mechanisms supported (mTLS, Kerberos, plaintext).

## Browser to UI

* {{< check_no >}} HTTP - no TLS/authentication.
  * Blog post: [Protecting Jaeger UI with an OAuth sidecar Proxy](https://medium.com/jaegertracing/protecting-jaeger-ui-with-an-oauth-sidecar-proxy-34205cca4bb1).

## Consumers to Query Service

* {{< check_yes >}} HTTP - TLS with client cert authentication supported.
* {{< check_yes >}} gRPC - TLS with client cert authentication supported.

[issue-1718]: https://github.com/jaegertracing/jaeger/issues/1718
