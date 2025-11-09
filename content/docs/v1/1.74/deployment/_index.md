---
title: Deployment
weight: 4
children:
- title: Operator for Kubernetes
  navtitle: Kubernetes
  url: operator
- title: Frontend/UI
  url: frontend-ui
- title: CLI Flags
  url: cli
- title: Security
  url: security
- title: On Windows
  url: windows
- title: Service Performance Monitoring (SPM)
  navtitle: SPM
  url: spm
---

The main Jaeger backend components are released as Docker images on [Docker Hub](https://hub.docker.com/r/jaegertracing) and [Quay](https://quay.io/organization/jaegertracing):

Component             | Docker Hub                                                                                                   | Quay
--------------------- | -------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------
**jaeger-all-in-one**      | [hub.docker.com/r/jaegertracing/all-in-one/](https://hub.docker.com/r/jaegertracing/all-in-one/)         | [quay.io/repository/jaegertracing/all-in-one](https://quay.io/repository/jaegertracing/all-in-one)
**jaeger-collector**  | [hub.docker.com/r/jaegertracing/jaeger-collector/](https://hub.docker.com/r/jaegertracing/jaeger-collector/) | [quay.io/repository/jaegertracing/jaeger-collector](https://quay.io/repository/jaegertracing/jaeger-collector)
**jaeger-query**      | [hub.docker.com/r/jaegertracing/jaeger-query/](https://hub.docker.com/r/jaegertracing/jaeger-query/)         | [quay.io/repository/jaegertracing/jaeger-query](https://quay.io/repository/jaegertracing/jaeger-query)
**jaeger-ingester**   | [hub.docker.com/r/jaegertracing/jaeger-ingester/](https://hub.docker.com/r/jaegertracing/jaeger-ingester/)   | [quay.io/repository/jaegertracing/jaeger-ingester](https://quay.io/repository/jaegertracing/jaeger-ingester)
**jaeger-remote-storage**   | [hub.docker.com/r/jaegertracing/jaeger-remote-storage/](https://hub.docker.com/r/jaegertracing/jaeger-remote-storage/)   | [quay.io/repository/jaegertracing/jaeger-remote-storage](https://quay.io/repository/jaegertracing/jaeger-remote-storage)

The images listed above are the primary release versions. Most components have additional images published:
  * `${component}-debug` images include Delve debugger
  * `${component}-snapshot` images are published from the tip of the main branch for every commit, allowing testing of unreleased versions
  * `${component}-debug-snapshot` snapshot images that include the Delve debugger

There are orchestration templates for running Jaeger with:

  * Kubernetes: [github.com/jaegertracing/jaeger-kubernetes](https://github.com/jaegertracing/jaeger-kubernetes),
  * OpenShift: [github.com/jaegertracing/jaeger-openshift](https://github.com/jaegertracing/jaeger-openshift).

## Configuration Options

Jaeger binaries can be configured in a number of ways (in the order of decreasing priority):

  * command line arguments,
  * environment variables,
  * configuration files in JSON, TOML, YAML, HCL, or Java properties formats.

To see the complete list of options, run the binary with the `help` command or refer to the [CLI Flags](./cli/) page for more information. Options that are specific to a certain storage backend are _only listed if the storage type is selected_. For example, to see all available options in the Collector with Cassandra storage:

```sh
$ docker run --rm \
    -e SPAN_STORAGE_TYPE=cassandra \
    jaegertracing/jaeger-collector:{{< currentVersion >}} \
    help
```

In order to provide configuration parameters via environment variables, find the respective command line option and convert its name to UPPER_SNAKE_CASE, for example:

Command line option                | Environment variable
-----------------------------------|-------------------------------
`--cassandra.connections-per-host` | `CASSANDRA_CONNECTIONS_PER_HOST`
`--metrics-backend`                | `METRICS_BACKEND`

## All-in-one

Jaeger all-in-one is a special distribution that combines three Jaeger components, [collector](#collector), and [query service/UI](#query-service--ui), in a single binary or container image. It is useful for single-node deployments where your trace volume is light enough to be handled by a single instance. By default, all-in-one starts with `memory` storage, meaning it will lose all data upon restart. All other [span storage backends](#span-storage-backends) can also be used with all-in-one, but `memory` and `badger` are exclusive to all-in-one because they cannot be shared between instances.

All-in-one listens to the same ports as the components it contains (described below), with the exception of the admin port.

Port  | Protocol | Function
----- | -------  | ---
14269 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

```bash
## make sure to expose only the ports you use in your deployment scenario!
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -e COLLECTOR_ZIPKIN_HOST_PORT=:9411 \
  -p 5775:5775/udp \
  -p 6831:6831/udp \
  -p 6832:6832/udp \
  -p 5778:5778 \
  -p 16686:16686 \
  -p 14250:14250 \
  -p 14268:14268 \
  -p 14269:14269 \
  -p 4317:4317 \
  -p 4318:4318 \
  -p 9411:9411 \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

You can navigate to `http://localhost:16686` to access the Jaeger UI.

## Collector

**jaeger-collector**s are stateless and thus many instances of **jaeger-collector** can be run in parallel.
**jaeger-collector**s require almost no configuration, except for storage location, such as
`--cassandra.keyspace` and `--cassandra.servers` options, or the location of Elasticsearch cluster,
via `--es.server-urls`, depending on which storage is specified. See the [CLI Flags](./cli/) for all
command line options.

At default settings **jaeger-collector** exposes the following ports:

| Port  | Protocol | Endpoint | Function
| ----- | -------  | -------- | ----
| 4317  | gRPC     | n/a      | Accepts traces in [OpenTelemetry OTLP format][otlp] (Protobuf).
| 4318  | HTTP     | `/v1/traces` | Accepts traces in [OpenTelemetry OTLP format][otlp] (Protobuf and JSON).
| 14268 | HTTP     | `/api/sampling` | Serves sampling policies (see [Remote Sampling](../architecture/sampling/#remote-sampling)).
|       |          | `/api/traces` | Accepts spans in [jaeger.thrift][jaeger-thrift] format with `binary` thrift protocol (`POST`).
| 14269 | HTTP     | `/`      | Admin port: health check (`GET`).
|       |          | `/metrics` | Prometheus-style metrics (`GET`).
| 9411  | HTTP     | `/api/v1/spans` and `/api/v2/spans` | Accepts Zipkin spans in Thrift, JSON and Proto (disabled by default).
| 14250 | gRPC     | n/a      | Accepts spans in [model.proto][] Protobuf format.

## Ingester

**jaeger-ingester** is a service which reads span data from Kafka topic and writes it to another storage backend (Elasticsearch or Cassandra).

Port  | Protocol | Function
----- | -------  | ---
14270 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

To view all exposed configuration options run the following command:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=cassandra \
  jaegertracing/jaeger-ingester:{{< currentVersion >}}
  --help
```

## Query Service & UI

**jaeger-query** serves the API endpoints and a React/Javascript UI.
The service is stateless and is typically run behind a load balancer, such as [**NGINX**](https://www.nginx.com/).

At default settings the **jaeger-query** service exposes the following port(s):

Port  | Protocol | Function
----- | -------  | ---
16685 | gRPC     | Protobuf/gRPC [QueryService](https://github.com/jaegertracing/jaeger-idl/blob/master/proto/api_v2/query.proto)
16686 | HTTP     | `/api/*` endpoints and Jaeger UI at `/`
16687 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

### Minimal deployment example (Elasticsearch backend):
```sh
docker run -d --rm \
  -p 16685:16685 \
  -p 16686:16686 \
  -p 16687:16687 \
  -e SPAN_STORAGE_TYPE=elasticsearch \
  -e ES_SERVER_URLS=http://<ES_SERVER_IP>:<ES_SERVER_PORT> \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```

### Clock Skew Adjustment

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. **jaeger-query** service implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/v1.74.0/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to their timestamps.

Sometimes these adjustments themselves make the trace hard to understand. For example, when repositioning the server span within the bounds of its parent span, Jaeger does not know the exact relationship between the request and response latencies, so it assumes they are equal and places the child span in the middle of the parent span (see [issue #961](https://github.com/jaegertracing/jaeger/issues/961#issuecomment-453925244)).

**jaeger-query** service supports a configuration flag `--query.max-clock-skew-adjustment` that controls how much clock skew adjustment should be allowed. Setting this parameter to zero (`0s`) disables clock skew adjustment completely. This setting applies to all traces retrieved from the given query service. There is an open [ticket #197](https://github.com/jaegertracing/jaeger-ui/issues/197) to support toggling the adjustment on and off directly in the UI.

### UI Base Path

The base path for all **jaeger-query** HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running **jaeger-query** behind a reverse proxy.

The base path can be configured via the `--query.base-path` command line parameter or the `QUERY_BASE_PATH` environment variable.

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](./frontend-ui/).

## Remote Storage (component)

**jaeger-remote-storage** implements the [Remote Storage gRPC API][storage.proto] and proxies it into one of the regular Jaeger backends. It can be useful in the situation when we want to run a full deployment of Jaeger components, e.g., separate collector and query services, but use a single-node storage backend like the memory store or Badger. Without the remote storage, the single-node backends can only be used with all-in-one since they cannot be shared between multiple processes.

At default settings the service listens on the following port(s):

Port  | Protocol | Function
----- | -------  | ---
17271 | gRPC     | [Remote Storage API][storage.proto]
17270 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

## Span Storage Backends

Jaeger requires a persistent storage backend. Cassandra and Elasticsearch/OpenSearch are the primary supported distributed storage backends. Additional backends are [discussed here](https://github.com/jaegertracing/jaeger/issues/638).

The storage type can be passed via `SPAN_STORAGE_TYPE` environment variable. Valid values are `cassandra`, `elasticsearch`, `kafka` (only as a buffer), `badger` and `memory`.

As of version 1.6.0, it's possible to use multiple storage types at the same time by providing a comma-separated list of valid types to the `SPAN_STORAGE_TYPE` environment variable. It's important to note that all listed storage types are used for writing, but only the first type in the list will be used for reading and archiving.

For large scale production deployment the Jaeger team [recommends OpenSearch backend over Cassandra](../faq/#what-is-the-recommended-storage-backend).

### Memory

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

* [Upgrade Badger v1 to v3](https://github.com/jaegertracing/jaeger/blob/v1.74.0/internal/storage/v1/badger/docs/upgrade-v1-to-v3.md)
* [Badger file permissions as non-root service](https://github.com/jaegertracing/jaeger/blob/v1.74.0/internal/storage/v1/badger/docs/storage-file-non-root-permission.md)

### Cassandra
* Supported versions: 4.x, 5.x

Deploying Cassandra itself is out of scope for our documentation. One good
source of documentation is the [Apache Cassandra Docs](https://cassandra.apache.org/doc/latest/).

#### Configuration
##### Minimal
```sh
docker run \
  -e SPAN_STORAGE_TYPE=cassandra \
  -e CASSANDRA_SERVERS=<...> \
  jaegertracing/jaeger-collector:{{< currentVersion >}}
```

Note: White space characters are allowed in `CASSANDRA_SERVERS`. For Example: Servers can be passed as `CASSANDRA_SERVERS="1.2.3.4, 5.6.7.8" for better readability.

##### All options
To view the full list of configuration options, you can run the following command:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=cassandra  \
  jaegertracing/jaeger-collector:{{< currentVersion >}} \
  --help
```

#### Schema script

A script is provided to initialize Cassandra keyspace and schema
using Cassandra's interactive shell [`cqlsh`][cqlsh]:

```sh
MODE=test sh ./internal/storage/v1/cassandra/schema/create.sh | cqlsh
```

Or using the published Docker image (make sure to provide the right IP address):
```sh
docker run \
  -e CQLSH_HOST={server IP address}  \
  jaegertracing/jaeger-cassandra-schema:{{< currentVersion >}}
```

For production deployment, pass `MODE=prod DATACENTER={datacenter}` arguments to the script,
where `{datacenter}` is the name used in the Cassandra configuration / network topology.

The script also allows overriding TTL, keyspace name, replication factor, etc.
Run the script without arguments to see the full list of recognized parameters.

**Note**: See [README](https://github.com/jaegertracing/jaeger/blob/v1.74.0/internal/storage/v1/cassandra/schema/README.md) for more details on Cassandra schema management.

#### TLS support

Jaeger supports TLS client to node connections as long as you've configured
your Cassandra cluster correctly. After verifying with e.g. `cqlsh`, you can
configure the collector and query like this:

```sh
docker run \
  -e CASSANDRA_SERVERS=<...> \
  -e CASSANDRA_TLS=true \
  -e CASSANDRA_TLS_SERVER_NAME="CN-in-certificate" \
  -e CASSANDRA_TLS_KEY=<path to client key file> \
  -e CASSANDRA_TLS_CERT=<path to client cert file> \
  -e CASSANDRA_TLS_CA=<path to your CA cert file> \
  jaegertracing/jaeger-collector:{{< currentVersion >}}
```

The schema tool also supports TLS. You need to make a custom cqlshrc file like
so:

```ini
# Creating schema in a cassandra cluster requiring client TLS certificates.
#
# Create a volume for the schema docker container containing four files:
# cqlshrc: this file
# ca-cert: the cert authority for your keys
# client-key: the keyfile for your client
# client-cert: the cert file matching client-key
#
# if there is any sort of DNS mismatch and you want to ignore server validation
# issues, then uncomment validate = false below.
#
# When running the container, map this volume to /root/.cassandra and set the
# environment variable CQLSH_SSL=--ssl
[ssl]
certfile = ~/.cassandra/ca-cert
userkey = ~/.cassandra/client-key
usercert = ~/.cassandra/client-cert
# validate = false
```

#### Compatible Backends

* ScyllaDB [can be used](https://github.com/jaegertracing/jaeger/blob/v1.74.0/docker-compose/scylladb/README.md) as a drop-in replacement for Cassandra since it uses the same data model and query language.

### Elasticsearch
* Supported since Jaeger v0.6.0
* Supported ES versions: 7.x, 8.x (since Jaeger v1.52.0)

Elasticsearch version is automatically retrieved from root/ping endpoint.
Based on this version Jaeger uses compatible index mappings and Elasticsearch REST API.
The version can be explicitly provided via `--es.version=` flag.

Elasticsearch does not require initialization other than
[installing and running Elasticsearch](https://www.elastic.co/downloads/elasticsearch).
Once it is running, pass the correct configuration values to **jaeger-collector** and **jaeger-query**.

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

#### Shards and Replicas for Elasticsearch indices

Shards and replicas are some configuration values to take special attention to, because this is decided upon
index creation. [This article](https://www.elastic.co/blog/how-many-shards-should-i-have-in-my-elasticsearch-cluster) goes into
more information about choosing how many shards should be chosen for optimization.

#### Elasticsearch Rollover

[Elasticsearch rollover](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html) is an index management strategy that optimizes use of resources allocated to indices.
For example, indices that do not contain any data still allocate shards, and conversely, a single index might contain significantly more data than the others.
Jaeger by default stores data in daily indices which might not optimally utilize resources. Rollover feature can be enabled by `--es.use-aliases=true`.

Rollover lets you configure when to roll over to a new index based on one or more of the following criteria:

* `max_age` - the maximum age of the index. It uses [time units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#time-units): `d`, `h`, `m`.
* `max_docs` - the maximum documents in the index.
* `max_size` - the maximum estimated size of primary shards (since Elasticsearch 6.x). It uses [byte size units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#byte-units) `tb`, `gb`, `mb`.

Rollover index management strategy is more complex than using the default daily indices and it requires an initialization job to prepare the storage and two cron jobs to manage indices.

To learn more about rollover index management in Jaeger refer to this
[article](https://medium.com/jaegertracing/using-elasticsearch-rollover-to-manage-indices-8b3d0c77915d).

For automated rollover, please refer to [Elasticsearch ILM support](#elasticsearch-ilm-support).
##### Initialize

The following command prepares Elasticsearch for rollover deployment by creating index aliases, indices, and index templates:

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

<1> The command rolls the alias over to a new index if the age of the current write index is older than 2 days. For more conditions see [Elasticsearch docs](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html).

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


#### Elasticsearch ILM support
{{< warning >}}
Experimental feature added in [release v1.22.0](https://github.com/jaegertracing/jaeger/releases/tag/v1.22.0).

Supported Elasticsearch versions: 7.x
{{< /warning >}}
[Elasticsearch ILM](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-lifecycle-management.html) automatically manages indices according to performance, resiliency, and retention requirements.

For example:
* Rollover to a new index by size (bytes or number of documents) or age, archiving previous indices
* Delete stale indices to enforce data retention standards

###### Enabling ILM support
* Create an ILM policy in elasticsearch named jaeger-ilm-policy.

  For example, the following policy will rollover the "active" index when it is
  older than 1m and delete indices that are older than 2m.

  ```shell
  curl -X PUT http://localhost:9200/_ilm/policy/jaeger-ilm-policy \
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
  docker run -it --rm --net=host -e ES_USE_ILM=true jaegertracing/jaeger-es-rollover:latest init http://localhost:9200 # <1>
  ```

  <1> If you need to initialize archive storage, add `-e ARCHIVE=true`.

  {{< info >}}
  While initializing with ILM support, make sure that an ILM policy named `jaeger-ilm-policy` is created in Elasticsearch beforehand (see the previous step), otherwise the following error message will be shown:

  "ILM policy jaeger-ilm-policy doesn't exist in Elasticsearch. Please create it and rerun init"
  {{< /info >}}

  After the initialization, deploy Jaeger with `--es.use-ilm=true` and `--es.use-aliases=true`.


#### Upgrade Elasticsearch version

Elasticsearch defines wire and index compatibility versions. The index compatibility defines
the minimal version a node can read data from. For example Elasticsearch 8 can read indices
created by Elasticsearch 7, however it cannot read indices created by Elasticsearch 6 even
though they use the same index mappings. Therefore upgrade from Elasticsearch 7 to 8 does not require any
data migration. However, upgrade from Elasticsearch 6 to 8 has to be done through Elasticsearch 7 and wait
until indices created by ES 6.x are removed or explicitly reindexed.

Refer to the Elasticsearch [documentation](https://www.elastic.co/docs/deploy-manage/upgrade/deployment-or-cluster)
for wire and index compatibility versions. Generally this information can be retrieved from root/ping REST endpoint.

##### Reindex

Manual reindexing can be used when upgrading from Elasticsearch 6 to 8 (through Elasticsearch 7)
without waiting until indices created by Elasticsearch 6 are removed.

1. Reindex all span indices to new indices with suffix `-1`:

    ```bash
    curl -ivX POST -H "Content-Type: application/json" http://localhost:9200/_reindex -d @reindex.json
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
    curl -ivX DELETE -H "Content-Type: application/json" http://localhost:9200/jaeger-span-\*,-\*-1
    ```

3. Create indices without `-1` suffix:

    ```bash
    curl -ivX POST -H "Content-Type: application/json" http://localhost:9200/_reindex -d @reindex.json
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
    curl -ivX DELETE -H "Content-Type: application/json" http://localhost:9200/jaeger-span-\*-1
    ```

Run the commands analogically for other Jaeger indices.

There might exist more effective migration procedure. Please share with the community any findings.

### Kafka
* Supported in Jaeger since 1.6.0
* Supported Kafka versions: 0.9+

Kafka can be used as an intermediary buffer between collector and an actual storage.
**jaeger-collector** is configured with `SPAN_STORAGE_TYPE=kafka` that makes it write all received spans
into a Kafka topic. [**jaeger-ingester**](#ingester) is used to read from
Kafka and store spans in another storage backend (Elasticsearch or Cassandra).

Writing to Kafka is particularly useful for building post-processing data pipelines.

#### Configuration
##### Minimal
```sh
docker run \
  -e SPAN_STORAGE_TYPE=kafka \
  -e KAFKA_PRODUCER_BROKERS=<...> \
  -e KAFKA_TOPIC=<...> \
  jaegertracing/jaeger-collector:{{< currentVersion >}}
```

##### All options
To view the full list of configuration options, you can run the following command:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=kafka \
  jaegertracing/jaeger-collector:{{< currentVersion >}} \
  --help
```

#### Topic & partitions
Unless your Kafka cluster is configured to automatically create topics, you will need to create it ahead of time. You can refer to [the Kafka quickstart documentation](https://kafka.apache.org/documentation/#quickstart_createtopic) to learn how.

You can find more information about topics and partitions in general in the [official documentation](https://kafka.apache.org/documentation/#intro_topics). [This article](https://www.confluent.io/blog/how-to-choose-the-number-of-topicspartitions-in-a-kafka-cluster/) provide more details about how to choose the number of partitions.

### Remote Storage

Jaeger supports a gRPC-based [Remote Storage API][storage.proto] that allows extending the Jaeger ecosystem with custom storage backends, not directly supported by the project. These storage backends can be deployed as a remote gRPC server (since Jaeger v1.30). Older deployment mode as sidecar plugin will not be supported starting from v1.58.

To use a remote storage as Jaeger storage backend, use `grpc` as the storage type and specify the remote gRPC server address. For more information, please refer to [internal/storage/v1/grpc](https://github.com/jaegertracing/jaeger/tree/v1.74.0/internal/storage/v1/grpc).

Example:
```sh
docker run \
  -e SPAN_STORAGE_TYPE=grpc \
  -e GRPC_STORAGE_SERVER=<...> \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

Known remote storage backends:

* [PostgreSQL by robbert229](https://github.com/robbert229/jaeger-postgresql)

## Metrics Storage Backends

Jaeger Query is capable of querying aggregated R.E.D metrics from a storage backend,
visualizing them on the [Monitor tab](./spm/). It should be emphasized that the
configured metrics storage type is for reading _only_ and therefore, only applies
to the Jaeger Query component (and All In One, which contains Jaeger Query).

The storage type can be passed via `METRICS_STORAGE_TYPE` environment variable.
Valid values are: `prometheus`.

### Prometheus

Any PromQL-compatible backend is supported by Jaeger Query. A list of these have
been compiled by Julius Volz in:
https://promlabs.com/blog/2020/11/26/an-update-on-promql-compatibility-across-vendors

#### Configuration

##### Minimal

```sh
docker run \
  -e METRICS_STORAGE_TYPE=prometheus \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```

##### All options

To view the full list of configuration options, you can run the following command:

```sh
docker run \
  -e METRICS_STORAGE_TYPE=prometheus \
  jaegertracing/jaeger-query:{{< currentVersion >}} \
  --help
```

#### TLS support

Jaeger supports TLS client to Prometheus server connections as long as you've [configured
your Prometheus server](https://prometheus.io/docs/guides/tls-encryption/) correctly. You can
configure **jaeger-query** like so:

```sh
docker run \
  -e METRICS_STORAGE_TYPE=prometheus \
  -e PROMETHEUS_SERVER_URL=<...> \
  -e PROMETHEUS_TLS_ENABLED=true \
  -e PROMETHEUS_TLS_CA=<path to your CA cert file> \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```

## Aggregation Jobs for Service Dependencies

Production deployments need an external process that aggregates data and creates dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and writes them directly to the storage.

[cqlsh]: https://cassandra.apache.org/doc/latest/cassandra/managing/tools/cqlsh.html
[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[model.proto]: https://github.com/jaegertracing/jaeger-idl/blob/main/proto/api_v2/model.proto
[thriftrw]: https://www.npmjs.com/package/thriftrw
[storage.proto]: https://github.com/jaegertracing/jaeger/blob/v1.74.0/internal/storage/v1/grpc/proto/storage.proto
[otlp]: https://github.com/open-telemetry/opentelemetry-proto/blob/main/docs/specification.md
