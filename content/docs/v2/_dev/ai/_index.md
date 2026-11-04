---
title: AI Assistant and MCP Server
linkTitle: AI
weight: 7
children:
- title: MCP Server
  url: mcp-server
- title: AI Assistant
  url: assistant
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
- **Skills** are markdown playbooks that an agent reads through the
  `read_skill` tool before it attempts a task, such as walking a failed trace to
  its first error. Jaeger ships built-in skills, and an operator can serve their
  own from a directory, so an installation can teach the assistant about its
  domain without rebuilding Jaeger. See [Skills](./mcp-server/#skills).

Jaeger ships no agent and no model provider, and it holds no model API key. The
MCP server works on its own. The assistant works only when an operator runs an
agent and points Jaeger at it.

The tools are shaped for progressive disclosure: an agent first searches for
candidate traces, then maps a trace without span attributes, then inspects only
the spans that look suspicious. A single trace can carry thousands of spans, so
this shape keeps a whole trace out of the model's context window.

Access to either surface is access to your trace data. [MCP Server](./mcp-server/)
describes how to put authentication and TLS in front of them and how to limit
the assistant to a group of users.
