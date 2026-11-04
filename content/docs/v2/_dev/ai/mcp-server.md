---
title: MCP Server
hasparent: true
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

A fourth tool, `read_skill`, serves the [skills](#skills).

The server's `tools/list` response is the authoritative catalog, with each
tool's description and JSON schema, so an MCP client needs no configuration
beyond the endpoint URL. The
[tool implementations](https://github.com/jaegertracing/jaeger/tree/main/cmd/jaeger/internal/extension/jaegerquery/internal/mcptools)
are in the Jaeger repository.

## Skills

A skill is a markdown playbook that an agent reads before it attempts a task,
such as walking a failed trace to its first error or detecting an N+1 query
pattern. Agents reach skills through `read_skill`. They start at the root
`SKILL.md`, which lists the available skills with one line each on when to use
them, and follow its links, so a skill is read only when it looks relevant.

Jaeger compiles its built-in skills into the binary. An operator can serve
installation-specific skills without rebuilding Jaeger by pointing
`ai.mcp.skills_dir` at a directory on the query server's disk:

```yaml
extensions:
  jaeger_query:
    ai:
      mcp:
        skills_dir: /etc/jaeger/skills
```

On the embedded all-in-one configuration, set the same field with
`--set extensions.jaeger_query.ai.mcp.skills_dir=<path>`.

The directory must contain a `SKILL.md`, which becomes the index of your skills.
Jaeger serves its contents under the `custom/` prefix beside the built-in skills,
so an agent that reads `custom/SKILL.md` gets your index. Links inside a skill
are written relative to the skills root, for example
`custom/your-skill/SKILL.md`, because an agent passes the link text straight
back to `read_skill`. The directory is read live: an edit takes effect on the
next `read_skill` call. Jaeger refuses to start when the directory or its
`SKILL.md` cannot be read, and it caps each served file at 512 KiB.

Anyone who can write to `skills_dir` can steer the behavior of an agent that
already holds your telemetry tools. Treat the directory as part of the trusted
configuration surface and review changes to it as you would review a
configuration change.

For how to write a skill that an agent will choose to read, see the
[authoring guide](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/internal/extension/jaegerquery/internal/mcptools/AUTHORING.md)
in the Jaeger repository. The built-in skills are worked examples.

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

## Exposure and access to trace data

The tools use the same query service as the UI and the query API, and they
return span attributes, events, and errors. Read-only access can still expose
sensitive telemetry, so treat access to the MCP endpoint as access to your trace
data. `read_skill` also exposes any installation-specific skills.

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
public `Host` header (see [Running behind a reverse proxy](#running-behind-a-reverse-proxy-or-sidecar)).
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

The turn-scoped endpoint, `/api/ai/mcp/<id>/`, that the gateway hands to the
chat agent is not covered. The chat request that created the turn was already
admitted, and only that agent receives the route id.

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
that the AI Assistant's gateway hands to a chat agent is held in the memory of
the process that is streaming that chat, so an agent that is not co-located with
`jaeger-query` must reach that replica. See
[Running the agent elsewhere](../assistant/#running-the-agent-elsewhere).

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
