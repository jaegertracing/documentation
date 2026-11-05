---
title: MCP Server
hasparent: true
weight: 2
---

The `jaeger_query` extension can serve Jaeger's telemetry tools over the
[Model Context Protocol](https://modelcontextprotocol.io/) (MCP). The endpoint
uses the Streamable HTTP transport and shares the query HTTP listener with the UI
and the query API. It has no port of its own.

## Enabling the endpoint

The `ai` block of the `jaeger_query` extension configures both AI surfaces: the
MCP endpoint and the [AI Assistant](../assistant/). The presence of the `mcp`
block enables the MCP endpoint, and an empty block is enough:

```yaml
extensions:
  jaeger_query:
    ai:
      mcp: {}
```

The endpoint serves at `<base_path>/api/ai/mcp/` on the query port, `:16686` by
default. The embedded all-in-one configuration enables it.

The AI Assistant is configured by `agent_url`, the address of the chat agent.
That setting has a default, so the block above also enables the assistant's
chat endpoint and starts a health probe against the default agent address. To
serve MCP without the assistant, set `agent_url` to an empty string:

```yaml
extensions:
  jaeger_query:
    ai:
      agent_url: ""
      mcp: {}
```

To disable the MCP endpoint, remove the `mcp` block. If the assistant is not
needed either, remove the whole `ai` block, because an `ai` block requires at
least one of the two. The embedded all-in-one configuration has no file to
edit, so disable both there with a command-line override:

```sh
jaeger --set extensions.jaeger_query.ai.enabled=false
```

## Tools

The tools wrap the same query service that the UI uses, and they are shaped for
a drill-down in three tiers:

- **Discovery** tools return small summaries: the services and span names in
  storage, trace summaries matching a search without span details, and the
  service dependency graph.
- **Structure** tools describe one trace without its payload: every span as a
  flat list with its ancestry path, and the ordered spans on the critical path
  with their self time.
- **Detail** tools return full span data, attributes, events, and links, for a
  small number of spans already identified as suspicious, either by name or
  because they carry an error. An agent is meant to call these last.

A fourth tool, `read_skill`, serves skills, the markdown playbooks that
[Custom Skills](../skills/) describes.

The server's `tools/list` response is the authoritative catalog, with each
tool's description and JSON schema, so an MCP client needs no configuration
beyond the endpoint URL.

## Connecting a client

Point an MCP client that supports Streamable HTTP at
`http://<host>:16686<base_path>/api/ai/mcp/`. `<base_path>` is the configured
`base_path` with its leading slash, for example `/jaeger`, and is omitted when
unset or `/`. Add any credentials the deployment requires as headers in the
client's MCP server configuration, because the endpoint sends no authentication
challenge from which a client could discover an OAuth flow.

To verify an endpoint without a client, send an `initialize` request:

```sh
curl --include \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json, text/event-stream' \
  --data '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"deployment-check","version":"1.0"}}}' \
  http://localhost:16686/api/ai/mcp/
```

A successful initialization returns HTTP 200 and an `Mcp-Session-Id` header.
Against a deployment with TLS and basic authentication, add
`--cacert /path/to/ca.crt --user <username>` and use the `https` URL. After disabling
the endpoint, the same request returns HTTP 404 while the UI and the query API
remain available.

## Securing the endpoint

Access to the MCP endpoint is access to your trace data, and the endpoint has
no TLS and no authenticator by default. Before exposing it to remote agents, see
the [security page](../../deployment/security/), which covers authentication and
TLS, limiting the AI surfaces to a group of users, and tenants and sessions.

## Transport options

The `ai.mcp.streamable_http` block holds the options of the Streamable HTTP
transport. None of them changes what the tools do. The block requires Jaeger
2.23 or later.

### Running behind a reverse proxy or sidecar

The MCP transport carries a DNS-rebinding guard for servers on a developer's
machine: a request that arrives on a loopback address with a non-loopback `Host`
header is rejected with `403 Forbidden: invalid Host header`. A reverse proxy or
service-mesh sidecar that dials the query port over `127.0.0.1` and preserves
the client's `Host` produces that shape for every request. Change the proxy to
rewrite `Host` to the upstream address where possible. Where it is not, turn the
guard off:

```yaml
extensions:
  jaeger_query:
    ai:
      mcp:
        streamable_http:
          disable_localhost_protection: true
```

### Running several replicas behind a load balancer

By default the endpoint keeps one session per client in the memory of the
`jaeger-query` process that handled `initialize`. A load balancer without
session affinity sends later requests to other replicas, which answer
`404 session not found`; and when the client's `notifications/initialized` is
the request that went astray, the replica that holds the session rejects the
next `tools/list` with `method "tools/list" is invalid during session
initialization`. Set `stateless` to make every request stand on its own:

```yaml
extensions:
  jaeger_query:
    ai:
      mcp:
        streamable_http:
          stateless: true
```

Jaeger's tools keep no state between requests, so they behave the same. A
stateless endpoint answers 405 to the GET that a client sends to open a stream
for server-initiated messages, which Jaeger never sends.

This covers external clients on the shared endpoint. The turn-scoped endpoint
of the [AI Assistant](../assistant/) has its own routing rule, described there.

### Answering with plain JSON

By default the endpoint answers every POST with a `text/event-stream` body. Set
`json_response` to answer a single-message POST with a plain `application/json`
body, which is easier for proxies, logging middleware, and command-line clients
to read. MCP clients must accept both forms, so the setting changes nothing for
them.

```yaml
extensions:
  jaeger_query:
    ai:
      mcp:
        streamable_http:
          json_response: true
```
