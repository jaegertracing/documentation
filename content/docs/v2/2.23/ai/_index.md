---
title: AI Assistant and MCP Server
description: How Jaeger works with AI agents, inside the UI and from your own tools.
linkTitle: AI
weight: 7
children:
- title: AI Assistant
  url: assistant
- title: MCP Server
  url: mcp-server
- title: Custom Skills
  url: skills
---

Jaeger exposes trace data to AI agents in two ways, and lets an operator teach
those agents how to analyze it. Both surfaces are served by the `jaeger_query`
extension on the query port, and both are off until the `ai` block is
configured.

- The **MCP server** serves Jaeger's telemetry tools over the
  [Model Context Protocol](https://modelcontextprotocol.io/) at
  `/api/ai/mcp/`. Any MCP client, such as a coding agent or an IDE, can use it
  to search traces, map a trace's structure, compute its critical path, and
  inspect individual spans. See [MCP Server](./mcp-server/).
- The **AI Assistant** is a bring-your-own-agent framework. A gateway in
  `jaeger_query` accepts chat turns over the
  [AG-UI protocol](https://docs.ag-ui.com/) at `/api/ai/chat`, relays them to
  an agent of the operator's choice over the
  [Agent Client Protocol (ACP)](https://agentclientprotocol.com/), and gives the
  agent the same MCP tools to answer with. The Jaeger UI's chat panel is one AG-UI
  client of that gateway; any other AG-UI client can use it directly. See
  [AI Assistant](./assistant/).
- **Skills** are markdown playbooks that teach an agent how to analyze traces.
  Jaeger ships built-in skills, and an operator can serve their own. See
  [Custom Skills](./skills/).

Jaeger ships no agent and no model provider, and it holds no model API key. The
MCP server works on its own. The assistant works only when an operator runs an
agent and points Jaeger at it.

The tools are shaped for progressive disclosure: an agent first searches for
candidate traces, then maps a trace without span attributes, then inspects only
the spans that look suspicious. A single trace can carry thousands of spans, so
this shape keeps a whole trace out of the model's context window.

Access to either surface is access to your trace data. The
[security page](../deployment/security/) describes how to put authentication
and TLS in front of them and how to limit them to a group of users.

## Configuration reference

The `ai` block of the `jaeger_query` extension configures both surfaces. Each
field is explained on the page that the row links to.

| Field | Meaning | Page |
| --- | --- | --- |
| `agent_url` | WebSocket URL of the ACP agent; an empty string serves MCP without the assistant | [AI Assistant](./assistant/) |
| `agent_headers` | Headers sent on every dial to the agent | [AI Assistant](./assistant/) |
| `health_check_interval`, `health_check_timeout` | The probe that decides whether the UI shows the chat panel | [AI Assistant](./assistant/) |
| `max_request_body_size` | Size limit of a chat request | [AI Assistant](./assistant/) |
| `auth` | Authenticator extension that gates the AI surfaces alone | [Security](../deployment/security/) |
| `mcp` | Enables the MCP endpoint; an empty block is enough | [MCP Server](./mcp-server/) |
| `mcp.base_url` | Address at which the chat agent reaches the MCP endpoint | [AI Assistant](./assistant/) |
| `mcp.skills_dir` | Directory of installation-specific skills | [Custom Skills](./skills/) |
| `mcp.streamable_http` | Transport options: proxies, replicas, plain JSON responses | [MCP Server](./mcp-server/) |

The query extension's `header_forwarding` list, outside the `ai` block, also
reaches the agent; the [security page](../deployment/security/) describes it.

## Where to Go Next
