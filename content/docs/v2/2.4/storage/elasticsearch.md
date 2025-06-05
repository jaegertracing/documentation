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

A sample configuration for Jaeger with Elasticsearch backend is available in the Jaeger repository: [config-elasticsearch.yaml](https://github.com/jaegertracing/jaeger/blob/v2.4.0/cmd/jaeger/config-elasticsearch.yaml). In the future the configuration documentation will be auto-generated from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/v2.4.0/pkg/es/config/config.go#L86) as the authoritative source.

### Shards and Replicas

Shards and replicas are some configuration values to take special attention to, because this is decided upon
index creation. [This article](https://www.elastic.co/blog/how-many-shards-should-i-have-in-my-elasticsearch-cluster) goes into
more information about choosing how many shards should be chosen for optimization.

## Index Rollover

[Elasticsearch rollover](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html) is an index management strategy that optimizes use of resources allocated to indices.
For example, indices that do not contain any data still allocate shards, and conversely, a single index might contain significantly more data than the others.
Jaeger by default stores data in daily indices which might not optimally utilize resources. Rollover feature can be enabled by `use_aliases: true` config property.

Rollover lets you configure when to roll over to a new index based on one or more of the following criteria:

* `max_age` - the maximum age of the index. It uses [time units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#time-units): `d`, `h`, `m`.
* `max_docs` - the maximum documents in the index.
* `max_size` - the maximum estimated size of primary shards (since Elasticsearch 6.x). It uses [byte size units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#byte-units) `tb`, `gb`, `mb`.

Rollover index management strategy is more complex than using the default daily indices and it requires an initialization job to prepare the storage and two cron jobs to manage indices.

To learn more about rollover index management in Jaeger refer to this
[article](https://medium.com/jaegertracing/using-elasticsearch-rollover-to-manage-indices-8b3d0c77915d).

For automated rollover, please refer to [Elasticsearch ILM support](#ilm-support).

### Initialize

The following command prepares Elasticsearch for rollover deployment by creating index aliases, indices, and index templates:

```sh
docker run -it --rm --net=host \
  jaegertracing/jaeger-es-rollover:latest \
  init http://localhost:9200 # <1>
```

If you need to initialize archive storage, add `-e ARCHIVE=true`.

After the initialization Jaeger can be deployed with `use-aliases: true`.

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
* Run elasticsearch initializer with `ES_USE_ILM=true`:

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
