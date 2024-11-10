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

To use a remote storage as Jaeger storage backend, use `grpc` as the storage type and specify the remote gRPC server address. For more information, please refer to [jaeger/plugin/storage/grpc](https://github.com/jaegertracing/jaeger/tree/master/plugin/storage/grpc).

Example config for remote storage [can be found here](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-remote-storage.yaml).

Known remote storage backends:

* [PostgreSQL by robbert229](https://github.com/robbert229/jaeger-postgresql)
