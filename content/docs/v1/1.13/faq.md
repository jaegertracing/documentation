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
