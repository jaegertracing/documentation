---
title: Tools
navtitle: Tools
description: Extra Jaeger utilities.
weight: 12
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

## Remote Storage (component)

**jaeger-remote-storage** implements the [Remote Storage gRPC API][storage.proto] and proxies it into one of the regular Jaeger backends. It can be useful in the situation when we want to run a full deployment of Jaeger components, e.g., separate collector and query services, but use a single-node storage backend like the memory store or Badger. Without the remote storage, the single-node backends can only be used with all-in-one since they cannot be shared between multiple processes.

At default settings the service listens on the following port(s):

Port  | Protocol | Function
----- | -------  | ---
17271 | gRPC     | [Remote Storage API][storage.proto]
17270 | HTTP     | admin port: health check at `/` and metrics at `/metrics`