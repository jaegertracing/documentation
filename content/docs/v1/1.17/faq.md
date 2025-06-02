---
title: Frequently Asked Questions
linkTitle: FAQ
navtitle: FAQs
description: Answers to some frequently asked questions about Jaeger.
weight: 11
---

## Why is the Dependencies page empty?

The Dependencies page shows a graph of services traced by Jaeger and connections between them. When you are using `all-in-one` binary with in-memory storage, the graph is calculated on-demand from all the traces stored in memory. However, if you are using a real distributed storage like Cassandra or Elasticsearch, it is too expensive to scan all the data in the database to build the service graph. Instead, the Jaeger project provides "big data" jobs that can be used to extract the service graph data from traces:

  * https://github.com/jaegertracing/spark-dependencies - the older Spark job that can be run periodically
  * https://github.com/jaegertracing/jaeger-analytics - the new (experimental) streaming Flink jobs that run continuously and builds the service graph in smaller time intervals

## Why do I not see any spans in Jaeger?

Please refer to the [Troubleshooting](../troubleshooting/) guide.

## Do I need to run jaeger-agent?

`jaeger-agent` is not always necessary. Jaeger client libraries can be configured to export trace data directly to `jaeger-collector`. However, the following are the reasons why running `jaeger-agent` is recommended:

  * If we want Jaeger client libraries to send trace data directly to collectors, we must provide them with a URL of the HTTP endpoint. It means that our applications require additional configuration containing this parameter, especially if we are running multiple Jaeger installations (e.g. in different availability zones or regions) and want the data sent to a nearby installation. In contrast, when using the agent, the libraries require no additional configuration because the agent is always accessible via `localhost`. It acts as a sidecar and proxies the requests to the appropriate collectors.
  * The agent can be configured to enrich the tracing data with infrastructure-specific metadata by adding extra tags to the spans, such as the current zone, region, etc. If the agent is running as a host daemon, it will be shared by all applications running on the same host. If the agent is running as a true sidecar, i.e. one per application, it can provide additional functionality such as strong authentication, multi-tenancy (see [this blog post](https://medium.com/jaegertracing/jaeger-and-multitenancy-99dfa1d49dc0)), pod name, etc.
  * Agents allow implementing traffic control to the collectors. If we have thousands of hosts in the data center, each running many applications, and each application sending data directly to the collectors, there may be too many open connections for each collector to handle. The agents can load balance this traffic with fewer connections.
