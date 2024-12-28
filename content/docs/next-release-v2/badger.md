---
title: Badger
hasparent: true
---

[Badger](https://github.com/dgraph-io/badger) is an embeddable persistent key-value database, similar to RocksBD. The Jaeger binary embeds Badger and can use it as a storage backend without external dependencies.

**Pros**:
  * Badger stores data in the local file system and therefore can survive process restarts.
  * A single node can sustain high throughput.
  
**Cons**:
  * It is only suitable for a _single-node deployment_, so it cannot scale horizontally for higher data volumes.
  * It is not possible to share a single Badger instance between multiple Jaeger processes, such as **jaeger-collector** and **jaeger-query**, therefore it is usually only used in the **all-in-one** configuration.
    * NB: it is possible to share a single Badger instance between multiple processes if you use Badger with the [remote storage](../tools/#remote-storage-component) component.

## Configuration

See [sample configuration](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-badger.yaml).

## Troubleshooting

* [Badger file permissions as non-root service](https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/badger/docs/storage-file-non-root-permission.md)
