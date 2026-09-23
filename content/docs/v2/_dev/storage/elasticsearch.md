---
title: Elasticsearch
aliases: [../elasticsearch]
hasparent: true
---

## Introduction

* Supported ES versions: 7.x, 8.x

Elasticsearch version is automatically retrieved from root/ping endpoint. Based on this version Jaeger uses compatible index mappings and Elasticsearch REST API. The version can be explicitly provided via `version:` config property.

Elasticsearch does not require initialization other than [installing and running Elasticsearch](https://www.elastic.co/downloads/elasticsearch). Once it is running, pass the correct configuration values to Jaeger.

Elasticsearch also has the following officially supported resources available from the community and Elastic:
- [Docker container](https://hub.docker.com/_/elasticsearch) from Elastic for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/elastic/elasticsearch) from Elastic
- [Kubernetes Operator](https://github.com/openshift/elasticsearch-operator) from RedHat

## Configuration

A sample configuration for Jaeger with Elasticsearch backend is available in the Jaeger repository: [config-elasticsearch.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-elasticsearch.yaml). In the future the configuration documentation will be auto-generated from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/elasticsearch/config/config.go#L86) as the authoritative source.

### Shards and Replicas

Shards and replicas are some configuration values to take special attention to, because this is decided upon
index creation. [This article](https://www.elastic.co/blog/how-many-shards-should-i-have-in-my-elasticsearch-cluster) goes into
more information about choosing how many shards should be chosen for optimization.

## Write Modes

Jaeger writes spans to Elasticsearch with the `_bulk` API in one of two modes, selected by the `write_mode` property of the storage backend:

```yaml
elasticsearch:
  write_mode: async           # async (default) | sync
  poison_pill_handling: fail  # fail (default) | drop; only used in sync mode
  bulk_processing:
    max_bytes: 5000000        # per-request cap in both modes
    flush_interval: 200ms     # async mode only
    workers: 1                # async mode only
```

| | `async` (default) | `sync` |
|---|---|---|
| How a batch is written | Spans are appended to a client-side buffer that a background worker flushes to `_bulk` | Each batch the pipeline hands to the storage becomes one blocking `_bulk` request |
| What the pipeline learns | The write returns before the data is durable. A failed flush is logged and counted, but the pipeline has already moved on | The write returns only after Elasticsearch acknowledged the request, and returns an error if any span was not persisted |
| Trade-off | Highest throughput and lowest request latency, at the cost of write failures that nobody upstream ever hears about | A write failure is returned to the pipeline, at the cost of one `_bulk` round trip of latency per batch. Whether it reaches the sender depends on the pipeline, see [Delivery Guarantees](../../deployment/delivery-guarantees/) |
| `bulk_processing` settings | All apply | Only `max_bytes` applies. A batch larger than it is split into several `_bulk` requests |

Async mode is the default because it costs the least, not because it is the safer choice. Its weakness is that a write failure is invisible upstream: the sender has already been told the spans were accepted, so it has no reason to retry them and no signal to slow down. Sync mode returns the failure to the pipeline instead. What the pipeline has to do with it, for direct OTLP ingest and for the Kafka ingester alike, is described on the [Delivery Guarantees](../../deployment/delivery-guarantees/) page.

### Idempotent writes

Every span document has a deterministic `_id` derived from the content of the span, in both write modes. Writing the same span again overwrites the existing document instead of creating a duplicate, so a batch that is retried after a lost acknowledgement leaves exactly one copy of each span. Elasticsearch enforces `_id` uniqueness within one index, so a retry that lands after an alias or data stream rolled over writes a second copy into the new index. A span whose document cannot be JSON-encoded, for example an attribute holding NaN, is logged and skipped rather than written or reported. Client-supplied ids disable the auto-id fast path in Elasticsearch, which adds a small per-document indexing cost.

### Durability versus searchability

A successful `_bulk` response means the documents are durable, not that they are searchable yet. This holds under the default `index.translog.durability: request`; an index set to `durability: async` acknowledges before the translog is synced to disk, and a backend crash can then lose acknowledged documents. Search visibility is governed by the refresh interval of the index, one second by default, and Jaeger does not ask Elasticsearch to refresh on write because forced refreshes reduce indexing throughput without improving durability. In sync mode a span is therefore acknowledged up to one refresh interval before it appears in search results.

### Poison pills

A poison pill is a document that Elasticsearch rejects on every attempt, for example a span whose attribute conflicts with the type in the index mapping. The synchronous writer reads the per-item status in every `_bulk` response and separates transient failures, such as `429` back-pressure or an unavailable node, from terminal rejections that would fail identically on a retry. A transient failure makes the whole batch return an error so the pipeline retries it. What happens to a terminal rejection is chosen with `poison_pill_handling`:

| Value | Behavior | Use when |
|---|---|---|
| `fail` (default) | The batch returns an error, so the pipeline retries it and the rejected span blocks everything behind it until the document or the mapping is fixed | No span may ever be lost and someone watches the pipeline |
| `drop` | The rejected documents are discarded and logged, and the batch completes | Losing a rare malformed span is acceptable and the pipeline must never stall |

A third disposition, forwarding the rejected spans to a dead-letter pipeline instead of dropping them, is selected by the pipeline topology rather than by this property. The storage stays in `fail` mode and `jaeger_storage_exporter` is declared under `connectors:` instead of `exporters:`, which gives it an output pipeline for the rejected spans; see [Dead-letter pipeline for rejected spans](../../deployment/delivery-guarantees/#dead-letter-pipeline-for-rejected-spans).

Both dispositions act on documents Elasticsearch rejects individually inside an otherwise successful `_bulk` response. A document that makes the whole request fail, such as one larger than `http.max_content_length` (HTTP 413), is retried like any other request failure until an operator removes it or raises the limit.

In async mode this setting has no effect: a rejected document is logged by the bulk buffer and not retried.

## Index Management Strategies

Jaeger supports three index management strategies:

| | **Time-based indices** (default) | **Manual rollover** | **Rollover with ILM** (recommended) |
|---|----------------------------------|--------------|------------------------|
| How indices are created | Jaeger creates daily or hourly indices (e.g., `jaeger-span-2024-06-18`) | Operator runs `jaeger-es-rollover init` to create the first numbered index (e.g., `jaeger-span-000001`); cron job creates subsequent ones | Operator runs `jaeger-es-rollover init` to create the first index; Elasticsearch creates subsequent ones |
| Rollover trigger | Automatic (new time period) | `jaeger-es-rollover rollover` cron job | Elasticsearch ILM policy |
| Retention cleanup | `jaeger-es-index-cleaner` cron job | `jaeger-es-rollover lookback` (optional) + `jaeger-es-index-cleaner` cron jobs | Elasticsearch ILM policy |
| External tooling required | None | `jaeger-es-rollover init` (one-time) | `jaeger-es-rollover init` (one-time) + ILM policy |

The relevant configuration options are:

| Config property | Default | Relevant strategy | Description |
|-----------------|---------|-------------------|-------------|
| `date_layout` | `2006-01-02` | Time-based | Date format for index names (e.g., `2006-01-02-15` for hourly indices) |
| `use_aliases` | `false` | Manual rollover, ILM | Use read/write aliases instead of time-based indices (enables rollover mode) |
| `use_ilm` | `false` | ILM | Delegate rollover and retention to Elasticsearch ILM (requires `use_aliases: true`) |
| `create_mappings` | `true` | All | Create index templates at Jaeger startup. Must be `false` when `use_ilm: true` |

{{< info >}}
The `create_mappings` option is orthogonal to the index management strategy. In any mode, you can set it to `false` if you prefer to manage index templates externally (e.g., via `jaeger-es-rollover init` or your own automation). When using ILM, it **must** be `false` because `jaeger-es-rollover init` already creates the templates as part of index initialization.
{{< /info >}}

## Index Rollover

[Elasticsearch rollover](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html) is an index management strategy that optimizes use of resources allocated to indices.
For example, indices that do not contain any data still allocate shards, and conversely, a single index might contain significantly more data than the others.
Jaeger by default stores data in daily indices which might not optimally utilize resources. Rollover feature can be enabled by `use_aliases: true` config property.

Rollover lets you configure when to roll over to a new index based on one or more of the following criteria:

* `max_age` - the maximum age of the index. It uses [time units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#time-units): `d`, `h`, `m`.
* `max_docs` - the maximum documents in the index.
* `max_size` - the maximum estimated size of primary shards (since Elasticsearch 6.x). It uses [byte size units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#byte-units) `tb`, `gb`, `mb`.

Rollover index management strategy is more complex than using the default daily indices and it requires an initialization job to prepare the storage and cron jobs to manage indices.

To learn more about rollover index management in Jaeger refer to this
[article](https://medium.com/jaegertracing/using-elasticsearch-rollover-to-manage-indices-8b3d0c77915d).

For automated rollover, please refer to [ILM Support](#ilm-support) section.

{{< info >}}
The examples for `jaeger-es-rollover` and `jaeger-es-index-cleaner` tools below are shown using
Docker invocations, but they are also available as standalone binaries on the
[Jaeger GitHub releases page](https://github.com/jaegertracing/jaeger/releases).
{{< /info >}}

### Initialize

The following command prepares Elasticsearch for rollover deployment:

```sh
docker run -it --rm --net=host \
  jaegertracing/jaeger-es-rollover:latest \
  init http://localhost:9200 # <1>
```

<1> If you need to initialize archive storage, add `-e ARCHIVE=true`.

The initializer performs the following steps for each index type (spans, services, dependencies):

1. **Creates index templates** that define field mappings, shard/replica settings, and index patterns (e.g., `jaeger-span-*`). All future rollover indices inherit their schema from these templates.
2. **Creates the first rollover index** (e.g., `jaeger-span-000001`). Subsequent rollovers increment this number.
3. **Creates read and write aliases** (e.g., `jaeger-span-read` and `jaeger-span-write`) pointing to the initial index. Jaeger queries via the read alias and writes via the write alias.

After the initialization, Jaeger can be deployed with `use_aliases: true`.

### Roll over

The next step is to periodically execute the rollover API which rolls the write alias to a new index based on supplied conditions. The command also adds a new index to the read alias to make new data available for search.

```shell
docker run -it --rm --net=host \
  -e CONDITIONS='{"max_age": "2d"}' \
  jaegertracing/jaeger-es-rollover:latest \
  rollover  http://localhost:9200 # <1>
```

<1> The command rolls the alias over to a new index if the age of the current write index is older than 2 days. For more conditions see [Elasticsearch docs](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html).

The next step is to remove old indices from read aliases. It means that old data will not be available for search. This imitates the behavior of `max_span_age:` config property used in the default index-per-day deployment. This step could be optional and old indices could be simply removed by index cleaner in the next step.

```sh
docker run -it --rm --net=host \
  -e UNIT=days -e UNIT_COUNT=7 \
  jaegertracing/jaeger-es-rollover:latest \
  lookback http://localhost:9200 # <1>
```

<1> Removes indices older than 7 days from read alias.

### Remove old data

The historical data can be removed with the `jaeger-es-index-cleaner` that is also used for daily indices.

```shell
docker run -it --rm --net=host \
  -e ROLLOVER=true \
  jaegertracing/jaeger-es-index-cleaner:latest \
  14 http://localhost:9200 # <1>
```

<1> Remove indices older than 14 days.


## ILM support

[Elasticsearch ILM](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html) automatically manages indices according to performance, resiliency, and retention requirements.

ILM support is an alternative to the manual rollover + lookback +
index-cleaner workflow described above. When ILM is enabled,
Elasticsearch manages rollover and retention automatically
according to the configured policy.

For example:
* Rollover to a new index by size (bytes or number of documents) or age, archiving previous indices
* Delete stale indices to enforce data retention standards

To enable ILM support:

* Create an ILM policy in elasticsearch named jaeger-ilm-policy.

  For example, the following policy will rollover the "active" index when it is
  older than 1m and delete indices that are older than 2m.

  ```shell
  curl -X PUT \
  http://localhost:9200/_ilm/policy/jaeger-ilm-policy \
  -H 'Content-Type: application/json; charset=utf-8' \
  --data-binary @- << EOF
  {
    "policy": {
      "phases": {
        "hot": {
          "min_age": "0ms",
          "actions": {
            "rollover": {
              "max_age": "1m"
            },
            "set_priority": {
              "priority": 100
            }
          }
        },
        "delete": {
          "min_age": "2m",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }
  EOF
  ```

* Run rollover initializer with `ES_USE_ILM=true`:

  ```shell
  docker run -it --rm --net=host\
    -e ES_USE_ILM=true \
    jaegertracing/jaeger-es-rollover:latest \
    init http://localhost:9200 # <1>
  ```

  <1> If you need to initialize archive storage, add `-e ARCHIVE=true`.

  {{< info >}}
  While initializing with ILM support, make sure that an ILM policy named `jaeger-ilm-policy` is created in Elasticsearch beforehand (see the previous step), otherwise the following error message will be shown:

  "ILM policy jaeger-ilm-policy doesn't exist in Elasticsearch. Please create it and rerun init"
  {{< /info >}}

  The initializer performs the same steps as [described above](#initialize) (creates index templates, seed indices, and aliases), with the following ILM-specific additions:

  * Validates that the ILM policy (`jaeger-ilm-policy`) exists in Elasticsearch.
  * Embeds `index.lifecycle.name` and `index.lifecycle.rollover_alias` in the index templates, so Elasticsearch automatically applies the ILM policy to every new rollover index.
  * Sets `is_write_index: true` on the write aliases, which is required for Elasticsearch to perform ILM-triggered rollovers.

  With ILM enabled, Elasticsearch manages rollovers and retention automatically — you no longer need the `rollover`, `lookback`, or `index-cleaner` cron jobs described above.

  After the initialization, deploy Jaeger with `use_ilm: true` and `use_aliases: true`.


## Upgrading

Elasticsearch defines wire and index compatibility versions. The index compatibility defines
the minimal version a node can read data from. For example Elasticsearch 8 can read indices
created by Elasticsearch 7, however it cannot read indices created by Elasticsearch 6 even
though they use the same index mappings. Therefore upgrade from Elasticsearch 7 to 8 does not require any
data migration. However, upgrade from Elasticsearch 6 to 8 has to be done through Elasticsearch 7 and wait
until indices created by ES 6.x are removed or explicitly reindexed.

Refer to the Elasticsearch [documentation](https://www.elastic.co/docs/deploy-manage/upgrade/deployment-or-cluster)
for wire and index compatibility versions. Generally this information can be retrieved from root/ping REST endpoint.

### Reindex

Manual reindexing can be used when upgrading from Elasticsearch 6 to 8 (through Elasticsearch 7)
without waiting until indices created by Elasticsearch 6 are removed.

1. Reindex all span indices to new indices with suffix `-1`:

```bash
curl -ivX POST -H "Content-Type: application/json" \
  http://localhost:9200/_reindex -d @reindex.json
{
  "source": {
    "index": "jaeger-span-*"
  },
  "dest": {
    "index": "jaeger-span"
  },
  "script": {
    "lang": "painless",
    "source": "ctx._index = 'jaeger-span-' + (ctx._index.substring('jaeger-span-'.length(), ctx._index.length())) + '-1'"
  }
}
```

2. Delete indices with old mapping:

    ```bash
    curl -ivX DELETE -H "Content-Type: application/json" \
      http://localhost:9200/jaeger-span-\*,-\*-1
    ```

3. Create indices without `-1` suffix:

    ```bash
    curl -ivX POST -H "Content-Type: application/json" \
      http://localhost:9200/_reindex -d @reindex.json
    {
      "source": {
        "index": "jaeger-span-*"
      },
      "dest": {
        "index": "jaeger-span"
      },
      "script": {
        "lang": "painless",
        "source": "ctx._index = 'jaeger-span-' + (ctx._index.substring('jaeger-span-'.length(), ctx._index.length() - 2))"
      }
    }
    ```

4. Remove suffixed indices:

    ```bash
    curl -ivX DELETE -H "Content-Type: application/json" \
      http://localhost:9200/jaeger-span-\*-1
    ```

Run the commands analogically for other Jaeger indices.

There might exist more effective migration procedure. Please share with the community any findings.
