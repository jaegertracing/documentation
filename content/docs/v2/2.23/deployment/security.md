---
title: Securing Jaeger Installation
description: TLS and authentication for every connection between Jaeger components, clients and AI agents.
linkTitle: Securing Jaeger
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
  * The ingester writes whatever it reads from the topic into storage, so a client that can produce to the topic can write arbitrary spans into trace storage. Enable an [authorizer](https://kafka.apache.org/documentation/#security_authz) on the brokers and grant the collector's principal produce access to the span topic only, and the ingester's principal consume access to that topic and its consumer group only. The Kafka receiver's consumer group is `otel-collector` unless `group_id` is set. Nothing else should produce to the span topic; a post-processing pipeline consumes from it.
* {{< check_yes >}} Prometheus (for [SPM](../../architecture/spm/)) - TLS with mTLS (client cert authentication) supported, as long as you've [configured your Prometheus server](https://prometheus.io/docs/guides/tls-encryption/) correctly.

| Storage | TLS | mTLS | Basic | Bearer Token | API Key | Kerberos |
| ------- | --- | ---- | ------ | ------------ | ------- | -------- |
| Cassandra | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} | {{< check_no >}} |
| Elasticsearch | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} |
| OpenSearch | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} |
| Kafka | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} | {{< check_yes >}} |
| Prometheus | {{< check_yes >}} | {{< check_yes >}} | {{< check_yes >}} | {{< check_no >}} | {{< check_no >}} | {{< check_no >}} |


## Browser to UI

* {{< check_yes >}} HTTP - TLS and bearer token authentication (pass-through to storage).
  * Blog post: [Protecting Jaeger UI with an OAuth sidecar Proxy](https://medium.com/jaegertracing/protecting-jaeger-ui-with-an-oauth-sidecar-proxy-34205cca4bb1).
  * Blog post: [Secure architecture for Jaeger with Apache httpd reverse proxy on OpenShift](https://medium.com/@larsmilland01/secure-architecture-for-jaeger-with-apache-httpd-reverse-proxy-on-openshift-f31983fad400).

## Consumers to Query

* {{< check_yes >}} HTTP - TLS with mTLS (client cert authentication) supported.
* {{< check_yes >}} gRPC - TLS with mTLS (client cert authentication) supported.

## AI Agents to Query

The [MCP endpoint](../../ai/mcp-server/) and the [AI Assistant](../../ai/assistant/)'s
chat endpoint are served by `jaeger_query` on the query HTTP port. The MCP tools
use the same query service as the UI and the query API, and they return span
attributes, events, and errors. Read-only access can still expose sensitive
telemetry, so treat access to the AI endpoints as access to your trace data.
`read_skill` also exposes any installation-specific skills.

The query HTTP listener defaults to all interfaces with no TLS and no
authenticator. The endpoint shares that listener, so its reachability also
depends on your firewall, container port publishing, and ingress configuration.

### Production deployment

Require authentication and TLS before making the endpoint reachable by remote
agents. Apply the policy to the entire query HTTP surface, including
`<base_path>/api/ai/mcp/` and every path below it, with either an authenticated reverse
proxy or the query server's own authenticator.

**Reverse proxy.** Terminate TLS and authenticate requests at the proxy, and
restrict direct access to the query listener so clients cannot bypass it. For a
proxy on the same host, bind `extensions.jaeger_query.http.endpoint` to
`127.0.0.1:16686` and set the upstream `Host` header to `127.0.0.1` or
`localhost`, because the MCP transport rejects a loopback request that carries a
public `Host` header; the [MCP Server](../../ai/mcp-server/) page explains the
guard and how to turn it off.
Forward POST, GET, and DELETE requests, the `Mcp-Session-Id` and
`MCP-Protocol-Version` headers, and SSE responses without buffering. The query
gRPC listener on `:16685` also reads trace data and is not protected by an HTTP
proxy, so bind it to a private address or configure gRPC authentication and TLS.

**Query server authenticator.** Jaeger includes the collector's
[`basicauth` server authenticator](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/extension/basicauthextension).
The following settings protect the UI, the query API, the gRPC API, and the MCP
endpoint together. Merge them into your configuration and add `basicauth/query`
to `service.extensions`:

```yaml
extensions:
  basicauth/query:
    htpasswd:
      file: /etc/jaeger/query.htpasswd
  jaeger_query:
    http:
      endpoint: 0.0.0.0:16686
      auth:
        authenticator: basicauth/query
      tls:
        cert_file: /etc/jaeger/tls/server.crt
        key_file: /etc/jaeger/tls/server.key
        min_version: "1.2"
    grpc:
      endpoint: 0.0.0.0:16685
      auth:
        authenticator: basicauth/query
      tls:
        cert_file: /etc/jaeger/tls/server.crt
        key_file: /etc/jaeger/tls/server.key
        min_version: "1.2"
    ai:
      mcp:
        base_url: https://jaeger.example.com:16686

service:
  extensions: [basicauth/query, jaeger_storage, jaeger_query]
```

Basic authentication requires TLS to protect the credentials in transit.
Configure the MCP client to trust the certificate's CA and to send the
credentials on every request. With TLS on, Jaeger cannot infer the URL that an
AI chat agent uses to reach the endpoint, so set `ai.mcp.base_url` to the scheme
and authority the agent can reach; Jaeger appends `base_path` and the MCP path.
The assistant's `ai.agent_headers` authenticate Jaeger's outbound dial to the
agent; they do not authenticate the agent's requests back to this endpoint, so
configure the agent's MCP client with the credentials and CA trust it needs.

### Gating the AI surfaces alone

The query server's `http.auth` setting applies to every request on the port, so
it cannot admit everyone to the UI while admitting only some people to the AI
features. The `ai.auth` block takes the same shape and applies it only to the
MCP endpoint, the chat endpoint, and the flag that tells the UI to show the chat
panel. Add the authenticator to `service.extensions` as well:

```yaml
extensions:
  basicauth/ai:
    htpasswd:
      inline: |
        alice:$2y$...
  jaeger_query:
    ai:
      mcp: {}
      auth:
        authenticator: basicauth/ai

service:
  extensions: [basicauth/ai, jaeger_storage, jaeger_query]
```

The authenticator receives the request headers, plus any query parameters
listed under `ai.auth.request_params`. A rejected MCP or chat request is answered with 401. A rejected page request is
served the UI without the chat panel, so a person outside the admitted group
sees Jaeger without the assistant rather than an assistant that fails. Any
extension that implements the collector's `extensionauth.Server` interface
works here, so a custom build can gate the features on a group lookup of its
own. Jaeger fails to start when the named extension is not loaded.

The 401 carries no `WWW-Authenticate` challenge, so a browser never offers basic
credentials on a page load. The example above therefore gates MCP clients and
hides the panel from every browser user. Showing the panel to admitted users
takes an authenticator that reads what a browser sends on navigation, such as a
session cookie or a header that a fronting proxy injects.

The deployment pattern that provides such a header is an identity-aware proxy:

1. **The proxy authenticates the person.** A single-sign-on proxy, an ingress
   with OIDC, or a service mesh terminates the user's session for every request
   to the UI, the REST API, the chat endpoint and the MCP endpoint alike, and
   injects the result as request headers, a signed identity token or a plain
   username header. A tool that bypasses the browser, such as an MCP client or
   `curl`, obtains the same token and sends it in a header up front.
2. **Jaeger trusts those headers only from the proxy.** The query port is
   reachable only through the proxy, by network policy or by mutual TLS, so a
   header that names a user is trustworthy because of where the request came
   from. A deployment that exposes the port directly must not trust a username
   header at all, and should verify a signed token instead.
3. **An authenticator extension turns the headers into a caller.** It verifies
   the token or reads the trusted header and returns the caller, or an error
   that Jaeger answers with 401. The same extension can consult a group
   directory and reject a caller outside a rollout group, which is how a feature
   is opened to a few people first. An installation builds this extension into
   its own Jaeger binary.

The authenticator sees headers and the listed query parameters, never the URL
path, which is why the per-route grain is the `ai.auth` setting rather than a
decision the extension makes. Who may see which spans is a question about the
data rather than the route, and belongs in a `query_interceptors` extension,
which runs around every trace query whether it came from the UI, the REST API or
an MCP tool.

The turn-scoped endpoint that the gateway hands to the chat agent is not covered
by `ai.auth`; the [AI Assistant](../../ai/assistant/) page describes it.

`ai.auth` requires Jaeger 2.23 or later.

### Tenants and sessions

The endpoint follows `extensions.jaeger_query.multi_tenancy`. When enabled,
every MCP request must carry the configured tenant header, `x-tenant` by
default; a missing header or a tenant outside the `tenants` allowlist receives
HTTP 401, and an empty allowlist accepts any nonempty tenant. A tenant header
selects a tenant and is not proof that the caller may
access it, so enforce that authorization at the proxy.

By default the transport is stateful, and a session keeps the tenant and
identity of the request that created it. Use a separate session for each
identity and tenant, and reconnect when either changes. An `Mcp-Session-Id` is
not a credential; do not share one across users or tenants. Idle sessions
expire after five minutes.

### Forwarding the caller's identity to the agent

An [AI Assistant](../../ai/assistant/) agent that acts on behalf of the person in the chat, for example to attribute
its model usage to them, needs that person's identity rather than a credential
of the gateway. The query extension's `header_forwarding` list names the request
headers that Jaeger captures from each inbound request and forwards to the
storage backend. The gateway copies the same captured headers onto the dial for
each chat turn, so one list describes the caller's identity for every hop:

```yaml
extensions:
  jaeger_query:
    header_forwarding:
      - http_name: X-Identity-Token
    ai:
      agent_url: ws://127.0.0.1:17000/acp
```

A listed header that a request does not carry is not sent. Each header arrives
at the agent under its `http_outbound_name`, or its `http_name` when that is
unset. A captured header with the same name as an `agent_headers` entry
replaces the static value. The
gateway copies the header as the request carried it, so it is only as
trustworthy as the proxy in front of Jaeger that sets it and strips any copy the
client supplied. The health probe has no request to copy from, so the agent must
answer `initialize` without the forwarded header.

[issue-1718]: https://github.com/jaegertracing/jaeger/issues/1718
