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
