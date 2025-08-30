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

Please refer to [Configuration](../deployment/configuration/) page for details on configuring storage backends for Jaeger.

For large scale production deployment the Jaeger team [recommends OpenSearch backend over Cassandra](../faq/#what-is-the-recommended-storage-backend).

## Remote Storage

Jaeger supports a gRPC-based Remote Storage API v2 that allows extending the Jaeger
ecosystem with custom storage backends, not directly supported by the project.
These storage backends can be deployed as a remote gRPC server.

To use a remote storage as Jaeger storage backend, use `grpc` as the storage type
and specify the remote gRPC server address. For more information,
please refer to
[jaeger/internal/storage/v2/grpc](https://github.com/jaegertracing/jaeger/tree/main/internal/storage/v2/grpc).

Example config for remote storage [can be found here](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-remote-storage.yaml).

Known remote storage backends:

* [PostgreSQL by robbert229](https://github.com/robbert229/jaeger-postgresql)

## Archive Storage

Jaeger supports two kinds of trace storage: `primary` and `archive`. The primary storage is used as the main storage for all ingested traces, so it requires a highly scalable backend and is typically used with short TTL on trace data (e.g. two weeks) to save storage costs. However, occasionally it may be useful to save certain traces for a longer period of time, e.g. when linked to an incident or a future performance improvement task. The archive storage is used for this purpose. It can be configured with much longer retention period (even infinite) because _no traces are automatically saved_ into archive storage, a save operation must be _manually initiated by the user_ from Jaeger UI.

To configure an archive storage:

(1) define a second storage backend configuration. For example, `another_store` in the following example:

```yaml
  jaeger_storage:
    backends:
      some_store:
        memory:
          max_traces: 100000
      another_store:
        memory:
          max_traces: 100000
```

Note that the archive storage does not have to be of the same type as the primary storage.

(2) reference that new backend name in `jaeger_query::storage::traces_archive`, for example:

```yaml
  jaeger_query:
    storage:
      traces: some_store
      traces_archive: another_store
```
