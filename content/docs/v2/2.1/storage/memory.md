---
title: Memory
aliases: [../memory]
hasparent: true
---

The in-memory storage is not intended for production workloads. It's intended as a simple solution to get started quickly and data will be lost once the process exits.

By default, there's no limit in the amount of traces stored in memory but a limit can be established via `max_traces` parameter:

```yaml
  jaeger_storage:
    backends:
      some_store:
        memory:
          max_traces: 100000
```
