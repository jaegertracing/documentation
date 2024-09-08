---
title: OpenSearch
hasparent: true
---

* Supported since Jaeger v0.6.0
* Supported OpenSearch versions: 1.x, 2.x

OpenSearch maintains API compatibility between versions and remains compatible primarily with Elasticsearch v7.10.2 this version compatibility is automatically retrieved from root/ping endpoint.
Based on this version Jaeger uses compatible index mappings and OpenSearch REST API.

OpenSearch does not require initialization other than
[installing and running OpenSearch](https://opensearch.org/downloads.html).
Once it is running, pass the correct configuration values to **jaeger**.

OpenSearch also has the following offically supported resources available from the community:
- [Docker container](https://hub.docker.com/r/opensearchproject/opensearch) for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/opensearch-project-helm-charts/opensearch)
- [Kubernetes Operator](https://github.com/opensearch-project/opensearch-k8s-operator)

#### Configuration
##### Minimal
```sh
docker run \
  -e SPAN_STORAGE_TYPE=elasticsearch \
  -e ES_SERVER_URLS=<...> \
  jaegertracing/jaeger-collector:{{< currentVersion >}}
```

##### All options
To view the full list of configuration options, you can run the following command:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=elasticsearch \
  jaegertracing/jaeger-collector:{{< currentVersion >}} \
  --help
```

#### Shards and Replicas for OpenSearch indices

Shards and replicas are some configuration values to take special attention to, because this is decided upon
index creation. [This article](https://opster.com/guides/opensearch/opensearch-capacity-planning/how-to-choose-the-correct-number-of-shards-per-index-in-opensearch) goes into
more information about choosing how many shards should be chosen for optimization.

#### OpenSearch Rollover

[OpenSearch rollover](https://opensearch.org/docs/latest/api-reference/index-apis/rollover/) is an index management strategy that optimizes use of resources allocated to indices.
For example, indices that do not contain any data still allocate shards, and conversely, a single index might contain significantly more data than the others.
Jaeger by default stores data in daily indices which might not optimally utilize resources. Rollover feature can be enabled by `--es.use-aliases=true`.

Rollover lets you configure when to roll over to a new index based on one or more of the following criteria:

* `max_age` - the maximum age of the index. It uses [time units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#time-units): `d`, `h`, `m`.
* `max_docs` - the maximum documents in the index.
* `max_size` - the maximum estimated size of primary shards (since Elasticsearch 6.x). It uses [byte size units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#byte-units) `tb`, `gb`, `mb`.

Rollover index management strategy is more complex than using the default daily indices and it requires an initialization job to prepare the storage and two cron jobs to manage indices.

To learn more about rollover index management in Jaeger refer to this
[article](https://medium.com/jaegertracing/using-elasticsearch-rollover-to-manage-indices-8b3d0c77915d).

##### Initialize

The following command prepares OpenSearch for rollover deployment by creating index aliases, indices, and index templates:

```sh
docker run -it --rm --net=host jaegertracing/jaeger-es-rollover:latest init http://localhost:9200 # <1>
```

If you need to initialize archive storage, add `-e ARCHIVE=true`.

After the initialization Jaeger can be deployed with `--es.use-aliases=true`.

##### Rolling over to a new index

The next step is to periodically execute the rollover API which rolls the write alias to a new index based on supplied conditions. The command also adds a new index to the read alias to make new data available for search.

```shell
docker run -it --rm --net=host -e CONDITIONS='{"max_age": "2d"}' jaegertracing/jaeger-es-rollover:latest rollover  http://localhost:9200 # <1>
```

<1> The command rolls the alias over to a new index if the age of the current write index is older than 2 days. For more conditions see [OpenSearch documentation](https://opensearch.org/docs/latest/api-reference/index-apis/rollover/).

The next step is to remove old indices from read aliases. It means that old data will not be available for search. This imitates the behavior of `--es.max-span-age` flag used in the default index-per-day deployment. This step could be optional and old indices could be simply removed by index cleaner in the next step.

```sh
docker run -it --rm --net=host -e UNIT=days -e UNIT_COUNT=7 jaegertracing/jaeger-es-rollover:latest lookback  http://localhost:9200 # <1>
```

<1> Removes indices older than 7 days from read alias.

##### Remove old data

The historical data can be removed with the `jaeger-es-index-cleaner` that is also used for daily indices.

```shell
docker run -it --rm --net=host -e ROLLOVER=true jaegertracing/jaeger-es-index-cleaner:latest 14 http://localhost:9200 # <1>
```

<1> Remove indices older than 14 days.