---
title: Memory
hasparent: true
---

The in-memory storage is not intended for production workloads. It's intended as a simple solution to get started quickly and
data will be lost once the process exits.

By default, there's no limit in the amount of traces stored in memory but a limit can be established by passing an
integer value via `--memory.max-traces`.

### Badger - local storage

* Since Jaeger v1.9

[Badger](https://github.com/dgraph-io/badger) is an embedded local storage, only available
with **all-in-one** distribution. By default, it acts as ephemeral storage using a temporary file system.
This can be overridden by using the `--badger.ephemeral=false` option.

```sh
docker run \
  -e SPAN_STORAGE_TYPE=badger \
  -e BADGER_EPHEMERAL=false \
  -e BADGER_DIRECTORY_VALUE=/badger/data \
  -e BADGER_DIRECTORY_KEY=/badger/key \
  -v <storage_dir_on_host>:/badger \
  -p 16686:16686 \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

* [Upgrade Badger v1 to v3](https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/badger/docs/upgrade-v1-to-v3.md)
* [Badger file permissions as non-root service](https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/badger/docs/storage-file-non-root-permission.md)
