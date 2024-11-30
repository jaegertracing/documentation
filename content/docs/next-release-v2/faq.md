---
title: Frequently Asked Questions
navtitle: FAQs
description: Answers to some frequently asked questions about Jaeger.
weight: 7
---

## Why is the Dependencies page empty?

The Dependencies page shows a graph of services traced by Jaeger and connections between them. When you are using  in-memory storage, the graph is calculated on-demand from all the traces stored in memory. However, if you are using  real distributed storage like Cassandra, Elasticsearch, or OpenSearch it is too expensive to scan all the data in the database to build the service graph. Instead, the Jaeger project provides "big data" jobs that can be used to extract the service graph data from traces:

  * https://github.com/jaegertracing/spark-dependencies - the older Spark job that can be run periodically
  * https://github.com/jaegertracing/jaeger-analytics - the new (experimental) streaming Flink jobs that run continuously and builds the service graph in smaller time intervals

## Why do I not see any spans in Jaeger?

Please refer to the [Troubleshooting](../troubleshooting/) guide.

## What is the recommended storage backend?

The Jaeger team recommends Elasticsearch or OpenSearch as the storage backend over Cassandra, for the following reasons:

  * Cassandra is a key-value database, so it is more efficient for retrieving traces by trace ID, but it does not provide the same powerful search capabilities as OpenSearch. Effectively, the Jaeger backend implements the search functionality on the client side, on top of k-v storage, which is limited and may produce inconsistent results (see [issue-166][issue-166] for more details). OpenSearch does not suffer from these issues, resulting in better usability. OpenSearch can also be queried directly, e.g. from Kibana dashboards, and provide useful analytics and aggregations.

  * Based on past performance experiments we observed single writes to be much faster in Cassandra than OpenSearch, which might suggest that it may sustain higher write throughput. However, because the Jaeger backend needs to implement search capability on top of k-v storage, writing spans to Cassandra is actually subject to large write amplification: in addition to writing a record for the span itself, Jaeger performs extra writes for service name and operation name indexing, as well as extra index writes for every tag. In contrast, saving a span to OpenSearch is a single write, and all indexing takes place inside the OpenSearch node. As a result, the overall throughput to Cassandra is comparable with OpenSearch.

One benefit of Cassandra backend is simplified maintenance due to its native support for data TTL. In OpenSearch the data expiration is managed through index rotation, which requires additional setup (see [Elasticsearch Rollover](../elasticsearch/#index-rollover)).

[issue-166]: https://github.com/jaegertracing/jaeger/issues/166

## How should I upgrade to a new version?

Jaeger is stateless for the services themselves, the state all lives in the data store. We try to avoid any kinds of breaking changes in our upgrades, so typically the order does not matter. However, upgrades should be done with the following order of operations. If you are running Jaeger in a fully distributed environment you should upgrade the Jaeger query role first, followed by the collector role. You should note that upgrading both sides of the Kafka data flow should be done as close to simultaneous as possible to avoid issues with data being written and read by different binaries.  

## Why do Jaeger trace IDs look differently in Kafka and in the UI?

Under the hood, at the data model level, the Jaeger trace IDs are a sequence of 16 bytes. However, these 16 bytes can be represented in many different ways:

  * in the UI, we historically represented them as hex-encoded strings, e.g., `7e90c0eca22784ec7e90c0eca22784ec`. These strings can be either 32 characters long when using the 128-bit IDs (as more common in OpenTelemetry), or 16 characters if the IDs are generated in the legacy 64-bit mode.
  * in the [domain model][trace-id-domain] in the Jaeger backend code, we represent trace ID as a pair of unsigned 64-bit integers using big-endian encoding. This was done for efficiency because a byte slice in Go requires an extra memory allocation.
  * in the original [Thrift model][trace-id-thrift] we also represented them as a pair of unsigned 64-bit integers
  * in the [Protobuf model][trace-id-proto], the ID is represented as a byte sequence. When Protobuf is serialized as a binary payload, these bytes are transmitted as is. However, Protobuf also supports a JSON encoding, where byte sequences are serialized using base64 encoding. So if you configure collector-Kafka-ingester pipeline to use the JSON encoding, you will see trace IDs that look like `fpDA7KInhOx+kMDsoieE7A==`. These can be converted to hex-encoded IDs that are recognized by the UI using online tools like https://base64.guru/converter/encode/hex.

[trace-id-domain]: https://github.com/jaegertracing/jaeger/blob/7872d1b07439c3f2d316065b1fd53e885b26a66f/model/ids.go#L82
[trace-id-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/05fe64e9c305526901f70ff692030b388787e388/thrift/jaeger.thrift#L53
[trace-id-proto]: https://github.com/jaegertracing/jaeger-idl/blob/05fe64e9c305526901f70ff692030b388787e388/proto/api_v2/model.proto#L97

## Do I need to run multiple collectors?

> Does having high availability of **jaeger-collector** improve the overall system performance like decreasing the dropped span count and having the less outage for trace collection? Is it recommended? If yes, why?

These are the reasons to run multiple instances:
  * Your clients send so much data that a single **jaeger-collector** is not able to accept it fast enough.
  * You want higher availability, e.g., when you do rolling restarts of **jaeger-collector**s for upgrade, to have some instances still running and able to process inbound data.

These are NOT the reasons to run multiple instances:
  * To avoid data loss. Jaeger drops data when the backend storage is not able to save it fast enough. Increasing the number of **jaeger-collector** instances, with more memory allocated to their internal queues, could provide a small, temporary relief, but does not remove the bottleneck of the storage backend.

## How do I configure authentication for Jaeger UI

Jaeger UI does not support any notion of accounts or roles, so there is no need to authenticate the users. If you need authentication in order to simply restrict who can access Jaeger UI, we recommend running a reverse proxy in front of it, such as HAProxy, NGINX, Keycloak, etc. The advantage of using standard reverse proxies is that they support a wide variety of integrations with various authentication and single sign-on services, something we would never be able to match in Jaeger UI.

For example, refer to this blog post for an example of [protecting Jaeger UI with Keycloak](https://medium.com/jaegertracing/protecting-jaeger-ui-with-an-oauth-sidecar-proxy-34205cca4bb1).
