---
title: Utilities
description: Load generator, trace anonymizer, schema management scripts and the standalone remote storage service.
aliases: [../tools]
hasparent: true
---

## Tracegen

It is a powerful utility that can be used to generate continuous stream of simple spans. This is specially useful for stress testing. It supports flags to control the number of workers and number of traces to generate in each worker. Not only that, it can generate spans in firehose mode (a flag set on spans to skip indexing).

```sh
docker run \
  --rm \
  jaegertracing/jaeger-tracegen:{{< currentVersion >}} 
```

## Anonymizer

It is a small utility that expects a trace-id and outputs an anonymized json version of that trace. This is useful in case you want to share your span with someone for purposes like debugging. By anonymized version, we mean that it removes or hashes details which are particular to your environment and you're not comfortable sharing them.

```sh
docker run \
  --rm \
  --volume /tmp:/tmp \
  jaegertracing/jaeger-anonymizer:{{< currentVersion >}} \
  --trace-id <TRACE_ID> \
  --query-host-port <JAEGER_QUERY_HOST_PORT>
```

## Schema Management

The storage backends that need their schema created or maintained outside Jaeger ship with their own scripts, distributed as binaries and container images on the [Download](/download/) page:

* `jaeger-cassandra-schema` creates the Cassandra keyspace and tables. The [Cassandra](../../storage/cassandra/#initializing-schema) page explains when it is needed, since Jaeger can also create the schema on start-up.
* `jaeger-es-index-cleaner` deletes Elasticsearch and OpenSearch indices older than a retention period, because those stores have no data TTL of their own.
* `jaeger-es-rollover` initializes and rolls over aliased indices. The [Elasticsearch](../../storage/elasticsearch/#index-management-strategies) page compares the index management strategies and shows how both scripts are run.

## Remote Storage (component)

**jaeger-remote-storage** implements the [Remote Storage gRPC API](../../architecture/apis/#remote-storage-api) and proxies it into one of the regular Jaeger backends. It can be useful in the situation when we want to run a full deployment of Jaeger components, e.g., separate collector and query services, but use a single-node storage backend like the memory store or Badger. Without the remote storage, the single-node backends can only be used with all-in-one since they cannot be shared between multiple processes.

At default settings the service listens on the following port(s):

Port  | Protocol | Function
----- | -------  | ---
17271 | gRPC     | [Remote Storage API](../../architecture/apis/#remote-storage-api)
17270 | HTTP     | admin port: health check at `/` and metrics at `/metrics`
