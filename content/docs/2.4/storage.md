---
title: Storage Backends
weight: 5
children:
- title: Memory
  url: memory
- title: Badger
  url: badger
- title: Cassandra
  url: cassandra
- title: ElasticSearch
  url: elasticsearch
- title: Kafka
  url: kafka
- title: OpenSearch
  url: opensearch
---

## Introduction

Jaeger requires a persistent storage backend. Cassandra, Elasticsearch, and OpenSearch are the primary supported distributed storage backends. Additional backends are [discussed here](https://github.com/jaegertracing/jaeger/issues/638).

Please refer to [Configuration](../configuration/) page for details on configuring storage backends for Jaeger.

For large scale production deployment the Jaeger team [recommends OpenSearch backend over Cassandra](../faq/#what-is-the-recommended-storage-backend).

## Remote Storage

Jaeger supports a gRPC-based [Remote Storage API][storage.proto] that allows extending the Jaeger ecosystem with custom storage backends, not directly supported by the project. These storage backends can be deployed as a remote gRPC server.

To use a remote storage as Jaeger storage backend, use `grpc` as the storage type and specify the remote gRPC server address. For more information, please refer to [jaeger/internal/storage/v1/grpc](https://github.com/jaegertracing/jaeger/tree/v2.4.0/internal/storage/v1/grpc).

Example config for remote storage [can be found here](https://github.com/jaegertracing/jaeger/blob/v2.4.0/cmd/jaeger/config-remote-storage.yaml).

Known remote storage backends:

* [PostgreSQL by robbert229](https://github.com/robbert229/jaeger-postgresql)

## Archive Storage

Jaeger supports two kinds of trace storage: `primary` and `archive`. The primary storage is used as the main storage for all ingested traces, so it requires a highly scalable backend and is typically used with short TTL on trace data (e.g. two weeks) to save storage costs. However, occasionally it may be useful to save certain traces for a longer period of time, e.g. when linked to an incident or a future performance improvement task. The archive storage is used for this purpose. It can be configured with much longer retention period (even infinite) because no traces are automatically saved into archive storage, a save operation must be manually initiated by the user from Jaeger UI. In Jaeger v2 it is possible to mix and match different backends for primary and archive storage roles.

To configure an archive storage:
  * define a storage backend configuration as you see fit
  * reference the backend name in the `traces_archive:` property of the `jaeger_storage` extension.
