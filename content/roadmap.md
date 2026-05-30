---
title: Roadmap
type: docs
weight: 70
---

The following is a summary of the major features we plan to implement.
For more details, see the [Roadmap on GitHub](https://github.com/orgs/jaegertracing/projects/4/views/1?layout=table).

## Upgrade Storage Backends to V2 Storage API

Currently, Jaeger uses a **[v1 Storage API](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v1/api/spanstore/interface.go)**, which operates on a data model specific to Jaeger. Each storage backend implements this API, requiring transformations between Jaeger's proprietary model and the OpenTelemetry Protocol (OTLP) data model, which is now the industry standard.

As part of #5079, Jaeger has introduced the more efficient **[v2 Storage API](https://github.com/jaegertracing/jaeger/tree/main/internal/storage/v2/api/tracestore)**, which natively supports the OpenTelemetry data model (OTLP), allows batching of writes and streaming of results. This effort is part of a broader alignment with the [OpenTelemetry Collector framework](https://github.com/open-telemetry/opentelemetry-collector), tracked under #4843.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/6458).

## GenAI integration with Jaeger

GenAI can provide powerful capabilities for automatic analysis of tracing data.

There can be multiple product functions, with increasing order of complexity:

  1. Free form question about a single trace. Easiest, needs chat infra in the UI.
    - Ability to use user-provided skills (nice to have). Requires agentic loop.
  1. Automated analysis of a trace. Needs agentic loop & prompt tuning on our side
  1. Free form search query. Needs ability act on the UI elements from agentic loop, and prompt tuning.
  1. Free form investigation. Ultimate, investigation agent, needs lots of prompting.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/7827).

## GenAI Observability

Jaeger will evolve beyond traditional distributed tracing to become the observability backbone for GenAI applications. This means natively handling large, multi-modal payloads with tiered storage and PII sanitization; serving as a registry for evaluation outcomes so quality metrics are traceable to specific agentic steps; enabling dataset curation and prompt/model version analytics directly from trace data; extending the query language to filter on quality scores and user feedback; and optimizing the UI for non-linear agentic workflows with DAG rendering and A/B trace comparison.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/8416).

## Support Elasticsearch/OpenSearch data stream

Data streams are the new hotness in Elasticsearch & OpenSearch to store append-only observability data. Data streams are well-suited for logs, events, metrics, and other continuously generated data.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/4708).

## Renovate Streaming Support

Bring streaming analytics support directly into Jaeger backend, instead of requiring separate Spark/Flink data pipelines.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/5910).

## Add the ability to store/retrieve incomplete/partial spans

Allow clients to export partial spans, to support two use cases:

* Flush a long running span before it is finished, in case the process crashes before finishing it
* Enrich existing span with information from other sources, e.g. to record log events not captured via tracing SDK

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/729).

## Dynamic configuration support

We need a dynamic configuration solution that comes in handy in various scenarios:

* blacklisting services
* overriding sampling probabilities
* controlling server-side downsampling rate
* black/whitelisting services for adaptive sampling
* etc.

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/355).

## AI-Powered Trace Analysis: Phase 2 - Self-Service "Skills" Framework

LFX project: <https://mentorship.lfx.linuxfoundation.org/project/4f36fd67-e77b-4c40-91be-1d3150ad34f9>

* **Description:** Jaeger is the industry-standard platform for distributed tracing. As microservice architectures grow complex, finding root causes in massive trace data becomes increasingly difficult. While Phase 1 of this initiative established a baseline AI assistant for natural language search, the system currently relies on hard-coded capabilities. This project (Phase 2\) aims to transform the Jaeger AI agent from a static chatbot into an extensible, user-programmable platform. The primary objective is to implement a "Self-Service Skills" framework, architecturally similar to "Claude Code Skills." This will allow end-users to teach the Jaeger AI new debugging workflows (e.g., "Analyze Critical Path" or "Detect N+1 Queries") by simply adding configuration files containing system prompts and logic rules, without needing to recompile the Jaeger binary. The applicant will build this extension within the Jaeger v2 (OpenTelemetry-based) architecture, utilizing **LangChainGo** to orchestrate interactions with Language Models (SLMs/LLMs). This project bridges the gap between generic AI reasoning and domain-specific observability expertise.
* **Expected Outcome:**
  * **Skills Engine Implementation:** An approach compatible with our [BYOA (bring your own agent)](https://docs.google.com/document/d/1qD0OpyRfq-JbO6MCB5gmVxsdPcpPhxz1R_pPnKDdYOg/edit?tab=t.0#heading=h.qgr5ifum0a9m) direction that dynamically discovers, validates, and loads user-defined "Skills" (prompts and tool definitions) from configuration.
  * **Smart Analysis Features:** A polished implementation of Natural Language Search and Contextual Trace Explanation that intelligently leverages these loaded skills.
  * **Local-First Support:** Verified compatibility with local model runners (e.g., Ollama, Llama.cpp) to ensure deterministic performance without sending data to public clouds.
  * **UI Integration:** Enhancements to the Jaeger React UI to expose these AI capabilities and visualize the "reasoning steps" taken by the agent.
  * **Documentation:** A complete guide for users on "How to Author Custom AI Skills for Jaeger."
* **Learning Opportunities:**
  * **Agentic AI Architecture:** Learn to design stateful AI agents in Go that utilize "Tool Calling" and "Reasoning Loops" rather than simple text generation.
  * **OpenTelemetry Internals:** Gain deep familiarity with the OpenTelemetry Collector architecture, as Jaeger v2 is built directly on top of it.
  * **Cloud-Native Engineering:** Experience contributing to a graduated CNCF project, including navigating code reviews, writing design docs (RFDs), and adhering to open-source best practices.
  * **Full-Stack Development:** Practical experience bridging a complex Go backend with a modern React frontend.
* **Recommended Skills:**
  * **Languages:** Strong proficiency in **Go (Golang)** is required. Experience with **TypeScript/React** is highly recommended.
  * **AI/LLM:** Familiarity with LLM concepts (Prompt Engineering, RAG, Function Calling) and frameworks like LangChain.
  * **Domain Knowledge:** Basic understanding of distributed systems, observability, or debugging workflows is beneficial.
* **Mentors:**
  * Jonah Kowall (@jkowall, <jkowall@kowall.net>)
  * Yuri Shkuro (@yurishkuro, <github@ysh.us>)
* Parent Issue: <https://github.com/jaegertracing/jaeger/issues/7827>

Application requirements: <https://www.jaegertracing.io/mentorship/for-mentees/>

For more information see the [issue description](https://github.com/jaegertracing/jaeger/issues/8440).
