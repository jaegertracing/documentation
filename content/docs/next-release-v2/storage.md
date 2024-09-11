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
- title: Metrics
  url: metrics.md
---

Jaeger requires a persistent storage backend. Cassandra and Elasticsearch/OpenSearch are the primary supported distributed storage backends. Additional backends are [discussed here](https://github.com/jaegertracing/jaeger/issues/638).

The storage type can be passed via `SPAN_STORAGE_TYPE` environment variable. Valid values are `cassandra`, `elasticsearch`, `kafka` (only as a buffer), `badger` and `memory`.

As of version 1.6.0, it's possible to use multiple storage types at the same time by providing a comma-separated list of valid types to the `SPAN_STORAGE_TYPE` environment variable. It's important to note that all listed storage types are used for writing, but only the first type in the list will be used for reading and archiving.

For large scale production deployment the Jaeger team [recommends OpenSearch backend over Cassandra](../faq/#what-is-the-recommended-storage-backend).

## Remote Storage

Jaeger supports a gRPC-based [Remote Storage API][storage.proto] that allows extending the Jaeger ecosystem with custom storage backends, not directly supported by the project. These storage backends can be deployed as a remote gRPC server (since Jaeger v1.30). Older deployment mode as sidecar plugin will not be supported starting from v1.58.

To use a remote storage as Jaeger storage backend, use `grpc` as the storage type and specify the remote gRPC server address. For more information, please refer to [jaeger/plugin/storage/grpc](https://github.com/jaegertracing/jaeger/tree/master/plugin/storage/grpc).

Example:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=grpc \
  -e GRPC_STORAGE_SERVER=<...> \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

Known remote storage backends:

* [PostgreSQL by robbert229](https://github.com/robbert229/jaeger-postgresql)
