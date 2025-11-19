---
title: Badger
aliases: [../badger]
hasparent: true
---

[Badger](https://github.com/dgraph-io/badger) is an embeddable persistent key-value database, similar to RocksDB. The Jaeger binary embeds Badger and can use it as a storage backend without external dependencies.

**Pros**:
  * Badger stores data in the local file system and therefore can survive process restarts.
  * A single node can sustain high throughput.

**Cons**:
  * It is only suitable for a _single-node deployment_, so it cannot scale horizontally for higher data volumes.
  * If Badger backend is enabled in **jaeger-collector**, it cannot be accessed from **jaeger-query**, and vice versa. Therefore, Badger can only used either in the **all-in-one** configuration or with the [remote storage](../../operations/tools/#remote-storage-component) component.

## Configuration

See [sample configuration](https://github.com/jaegertracing/jaeger/blob/v2.12.0/cmd/jaeger/config-badger.yaml).

## Troubleshooting

* [Badger file permissions as non-root service](https://github.com/jaegertracing/jaeger/blob/v2.12.0/internal/storage/v1/badger/docs/storage-file-non-root-permission.md)
