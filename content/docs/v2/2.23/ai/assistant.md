---
title: AI Assistant
hasparent: true
weight: 1
---

The AI Assistant is a bring-your-own-agent framework in Jaeger. The
`jaeger_query` extension contains a gateway that accepts chat turns over the
[AG-UI protocol](https://docs.ag-ui.com/) that agent user interfaces
speak, relays each turn to an AI agent of the operator's choice over the
[Agent Client Protocol](https://agentclientprotocol.com/) (ACP), and gives that
agent Jaeger's [MCP tools](../mcp-server/) to answer with. Jaeger ships no agent
and selects no model provider.

The Jaeger UI is one AG-UI client of that gateway: the "Ask Jaeger" box in the
top bar opens a chat panel, a person asks a question about their traces, and the
agent answers by querying telemetry. The agent can also drive the UI, for
example by opening the trace it found. Any other AG-UI client can call the same
endpoint directly, without the Jaeger UI involved.

## How it works

{{<mermaid align="center">}}
graph LR
    UI[Jaeger UI<br/>Ask Jaeger chat panel]
    CLIENT[Other AG-UI client<br/>no Jaeger UI involved]
    AGENT[ACP agent<br/>run by the operator<br/>with its own model provider]

    subgraph jaeger_query
        GATEWAY[AI gateway<br/>POST /api/ai/chat]
        MCP[MCP endpoint<br/>/api/ai/mcp/ and /api/ai/mcp/#lt;id#gt;/]
        QUERY[Query service<br/>trace storage]
    end

    UI --> |AG-UI request, SSE events| GATEWAY
    CLIENT --> |AG-UI request, SSE events| GATEWAY
    GATEWAY --> |ACP over WebSocket| AGENT
    AGENT --> |MCP tool calls| MCP
    GATEWAY --> |UI tools for the turn| MCP
    MCP --> QUERY
{{< /mermaid >}}

The operator runs an agent that serves ACP over WebSocket and points Jaeger at
it. For each chat turn:

1. The client sends the turn to `POST /api/ai/chat` as an AG-UI request. The
   Jaeger UI includes the UI actions the current page offers as tools; another
   client sends whatever tools it can execute, or none.
2. The gateway opens an ACP session to the agent over WebSocket and announces a
   turn-scoped MCP endpoint, `/api/ai/mcp/<id>/`, which serves Jaeger's
   telemetry tools plus the UI tools of that turn.
3. The agent calls tools over MCP and reports progress over ACP. The gateway
   translates the progress into AG-UI server-sent events that the UI renders
   as streamed text and tool calls.
4. A UI tool call does not return data to the agent. The gateway acknowledges it
   and forwards it to the browser, which performs the action.

The gateway probes the agent's health periodically with an ACP `initialize`
request. The Jaeger UI shows the chat panel only while that probe succeeds, so a
Jaeger whose agent is down looks like a Jaeger without an assistant rather than
one whose assistant fails. No UI configuration is involved; the backend
advertises the capability to the UI.

## Configuration

```yaml
extensions:
  jaeger_query:
    ai:
      agent_url: ws://127.0.0.1:17000/acp
      agent_headers:
        Authorization: Bearer ${env:MY_AGENT_TOKEN}
      mcp: {}
```

- `agent_url` is the agent's WebSocket URL. The path and the port are whatever
  the agent serves. The default is `ws://localhost:16688`, so any `ai` block,
  including one that only enables MCP, registers the chat endpoint and starts
  the health probe against that address. Set `agent_url: ""` to run the MCP
  server without the assistant.
- `agent_headers` are sent on every dial to the agent, for agents that require
  a credential on the WebSocket upgrade. The header name is the agent's choice.
  The values are redacted from logs and configuration dumps; prefer `${env:VAR}`
  over an inline secret.
- `mcp: {}` enables the MCP tools the agent calls. Without it the agent runs
  every turn with no Jaeger tools and answers from its own knowledge.
- `mcp.base_url` is the address at which the agent reaches Jaeger's MCP
  endpoint. See [Running the agent elsewhere](#running-the-agent-elsewhere).
- `health_check_interval` and `health_check_timeout` control the probe. The
  defaults are 30 seconds and 2 seconds. An interval of 0 disables the probe, and
  the UI then never shows the panel.
- `max_request_body_size` limits the size of a chat request. The default is
  1 MiB.
- `auth` restricts the assistant and the MCP endpoint to an admitted group of
  users, and `header_forwarding` passes the caller's identity to the agent. See
  [AI Agents to Query](../../deployment/security/#ai-agents-to-query) on the
  security page.

### Running the agent elsewhere

When the agent and Jaeger run on the same host without TLS, the gateway infers
the MCP URL it announces to the agent. In every other deployment, set
`ai.mcp.base_url` to the scheme and authority at which the agent reaches the
query port, for example `https://jaeger.example.com:16686`. Jaeger appends
`base_path` and the MCP path, so do not include them. This applies to an agent
behind a proxy, in another network namespace or container, and to any Jaeger
with TLS on its query listener.

The turn-scoped MCP endpoint lives in the memory of the `jaeger-query` process
that is streaming that chat to the browser. With several replicas, `base_url`
must name the process that owns the turn, such as its pod address, or the load
balancer must route by the `<id>` path segment.

## Running Goose as the agent

[Goose](https://github.com/aaif-goose/goose) serves ACP over WebSocket natively,
so it works as the agent with no Jaeger-specific code. Any other agent that
meets the [agent contract](#agent-contract) works the same way; only
`agent_url`, the header name, and the launch command change.

1. Install Goose v1.55.0 or later from
   [Goose releases](https://github.com/aaif-goose/goose/releases).

2. Configure a model provider in Goose's environment. Goose reads the provider
   settings from environment variables, not from `~/.config/goose/config.yaml`;
   a key set only in the config file leaves Goose reporting `Provider not set`.
   The model must support tool calling, or the agent answers from prior
   knowledge and never queries telemetry.

   ```sh
   export GOOSE_PROVIDER=openrouter
   export GOOSE_MODEL=<a model that supports tools>
   export OPENROUTER_API_KEY=...
   ```

   [OpenRouter](https://openrouter.ai)'s free tier is a zero-cost way to try
   this. This command lists its free models that support tool calling:

   ```sh
   curl -s https://openrouter.ai/api/v1/models \
     -H "Authorization: Bearer $OPENROUTER_API_KEY" |
     jq -r '.data[] | select(.supported_parameters | index("tools"))
            | select((.pricing.prompt|tonumber) == 0) | .id'
   ```

3. Start Goose with authentication on. It then requires the secret as an
   `X-Secret-Key` header on the WebSocket upgrade and serves ACP at `/acp`.
   Goose also accepts `--dangerously-unauthenticated`, which disables that
   check; do not use it, because Jaeger can send the header.

   ```sh
   export GOOSE_SERVER__SECRET_KEY=$(openssl rand -hex 16)
   goose serve --host 127.0.0.1 --port 17000
   ```

4. Point Jaeger at it, with the same variable set in Jaeger's environment:

   ```yaml
   extensions:
     jaeger_query:
       ai:
         agent_url: ws://127.0.0.1:17000/acp
         agent_headers:
           X-Secret-Key: ${env:GOOSE_SERVER__SECRET_KEY}
         mcp: {}
   ```

5. Open the Jaeger UI. The "Ask Jaeger" box appears once the health probe
   reaches the agent. Ask something that needs telemetry, such as "list the
   services you can see". The streamed tool calls carry a `jaeger:` prefix when
   they come from Jaeger's MCP endpoint rather than from a tool the agent
   brought itself.

Goose ships general-purpose extensions, including shell access, and runs its
own agent loop. Anything it can reach on its host is reachable from a chat turn,
so run it with the same care as any other process holding your provider
credentials.

## Agent contract

Any ACP agent that meets these requirements works with the gateway.

- **Transport.** The agent serves ACP JSON-RPC over a WebSocket at `agent_url`,
  one JSON-RPC object per WebSocket message. It accepts the `agent_headers` and
  the forwarded identity headers on the upgrade.
- **Health.** The agent answers an `initialize` request on a fresh connection
  that carries `agent_headers` but no forwarded request headers.
- **Capabilities.** The `initialize` response advertises
  `agentCapabilities.mcpCapabilities.http`. Without it the gateway announces no
  MCP server. The gateway advertises no `fs` and no `terminal` client capability,
  so the agent must not depend on either.
- **Sessions.** Each chat turn is one `initialize`, one `session/new`, and one
  `session/prompt` on a fresh connection. `session/new` carries one Streamable
  HTTP MCP server, the turn-scoped endpoint. The agent uses that URL for this
  turn only and does not cache the tool list across turns, because the UI tools
  differ per request.
- **Tools.** Telemetry tools and UI tools arrive together in one `tools/list`.
  UI tools are namespaced `ui__<name>` so they cannot shadow a telemetry tool.
  A UI tool returns an acknowledgement, not data.
- **Streaming.** The gateway translates `agent_message_chunk` notifications
  into text and `tool_call` and `tool_call_update` notifications into tool
  progress. It drops thought chunks and plans. It answers
  `session/request_permission` by selecting the first `allow_once` or
  `allow_always` option, so an agent may ask but must not depend on a human.
- **Tracing.** `session/prompt` carries `traceparent` and `tracestate` in
  `_meta`, using the keys that
  [SEP-414](https://modelcontextprotocol.io/seps/414-request-meta) defines. An
  agent that re-injects them into `_meta` on each MCP `tools/call` joins its
  spans to the chat request's trace. This is optional, and it is what makes the
  agent visible in Jaeger's own traces.

The gateway implementation is the reference for any detail this page leaves
out; see the
[gateway README](https://github.com/jaegertracing/jaeger/blob/v2.23.0/cmd/jaeger/internal/extension/jaegerquery/internal/jaegerai/README.md).

## Verifying an integration

1. Start the agent with its own provider credentials and authentication.
2. Start Jaeger with `agent_url`, the required `agent_headers`, and `mcp: {}`.
3. Confirm that the health probe passes. The query service injects the result
   into the UI page as `JAEGER_BACKEND_CAPABILITIES`, and `aiAssistant` is
   `true` once the agent answers `initialize`:

   ```sh
   curl -s http://127.0.0.1:16686/ | grep -o 'JAEGER_BACKEND_CAPABILITIES = {[^;]*'
   ```

4. Send a chat request without the browser:

   ```sh
   curl -N -X POST http://127.0.0.1:16686/api/ai/chat \
     -H 'Content-Type: application/json' \
     -d '{
       "threadId": "t1",
       "runId": "r1",
       "messages": [{"role": "user", "content": "what services are running?"}],
       "tools": []
     }'
   ```

   The response is a stream of AG-UI events: `RUN_STARTED`,
   `TEXT_MESSAGE_START`, one or more `TEXT_MESSAGE_CONTENT`, `TOOL_CALL_*`
   frames for each Jaeger tool the agent called, then `TEXT_MESSAGE_END` and
   `RUN_FINISHED`.

## Troubleshooting

**The "Ask Jaeger" box is missing.** The health probe cannot reach the agent.
The probe dials separately from the chat endpoint and sends the same
`agent_headers`, so a missing or wrong header value hides the panel even though
nothing else looks broken. The `jaeger-query` log reports
`AI health state changed` with `healthy=false` when the probe starts failing,
and logs each failed probe as `AI health check failed` at debug level. The
`JAEGER_BACKEND_CAPABILITIES` value in the UI page shows the current flag.

**`401 Unauthorized` on dial.** The header is missing, misnamed, or its value
does not match what the agent expects. With `${env:VAR}` values, confirm the
variable is set in Jaeger's environment, not only in the agent's.

**`404 Not Found` on dial.** The path is wrong. Goose, for example, serves ACP
at `/acp`, and its bare host and port return 404.

**The agent answers without any Jaeger tool calls.** It is using its own tools.
Confirm the `mcp` block is present; without it the gateway announces no MCP
endpoint. If Jaeger runs with TLS or the agent is not on the same host, confirm
`ai.mcp.base_url` is set, because the gateway announces no endpoint it cannot
infer.
