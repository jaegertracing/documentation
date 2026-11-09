---
title: MCP Server
description: Jaeger's trace analysis tools served over the Model Context Protocol for any MCP client.
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

To verify an endpoint without a client, list its tools. The endpoint speaks
MCP revision 2026-07-28, which has no handshake: a request names the revision
in the `MCP-Protocol-Version` header and in `_meta`, repeats its method in the
`Mcp-Method` header, and is served on its own.

```sh
curl --include \
  --header 'Content-Type: application/json' \
  --header 'Accept: application/json, text/event-stream' \
  --header 'MCP-Protocol-Version: 2026-07-28' \
  --header 'Mcp-Method: tools/list' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientCapabilities":{}}}}' \
  http://localhost:16686/api/ai/mcp/
```

A working endpoint returns HTTP 200 and the tool list, with no `Mcp-Session-Id`
header. A client on an older revision may still send `initialize` first; the
endpoint answers it without a session id and serves the next request on its
own. Against a deployment with TLS and basic authentication, add
`--cacert /path/to/ca.crt --user <username>` and use the `https` URL. After disabling
the endpoint, the same request returns HTTP 404 while the UI and the query API
remain available.

## Securing the endpoint

Access to the MCP endpoint is access to your trace data, and the endpoint has
no TLS and no authenticator by default. Before exposing it to remote agents, see
the [security page](../../deployment/security/), which covers authentication and
TLS, limiting the AI surfaces to a group of users, and tenants and identity.

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

The endpoint keeps no session: every request is served from its own headers
and body, and nothing is held in the memory of one `jaeger-query` process that
a later request depends on. Any replica therefore serves any request, and a
load balancer needs no session affinity for the endpoint. Jaeger's tools keep
no state between requests either, so they behave the same on every replica.
The endpoint answers 405 to the `GET` that a client on an older revision sends
to open a stream for server-initiated messages, which Jaeger never sends, and
to `DELETE`, which ended a session.

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
