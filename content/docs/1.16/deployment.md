---
title: Deployment
weight: 4
children:
- title: Operator for Kubernetes
  navtitle: Kubernetes
  url: operator
- title: Frontend/UI
  url: frontend-ui
- title: Windows
  url: windows
- title: CLI Flags
  url: cli
---

The main Jaeger backend components are released as Docker images on Docker Hub:

Component             | Repository
--------------------- | ---
**jaeger-agent**      | [hub.docker.com/r/jaegertracing/jaeger-agent/](https://hub.docker.com/r/jaegertracing/jaeger-agent/)
**jaeger-collector**  | [hub.docker.com/r/jaegertracing/jaeger-collector/](https://hub.docker.com/r/jaegertracing/jaeger-collector/)
**jaeger-query**      | [hub.docker.com/r/jaegertracing/jaeger-query/](https://hub.docker.com/r/jaegertracing/jaeger-query/)
**jaeger-ingester**   | [hub.docker.com/r/jaegertracing/jaeger-ingester/](https://hub.docker.com/r/jaegertracing/jaeger-ingester/)

There are orchestration templates for running Jaeger with:

  * Kubernetes: [github.com/jaegertracing/jaeger-kubernetes](https://github.com/jaegertracing/jaeger-kubernetes),
  * OpenShift: [github.com/jaegertracing/jaeger-openshift](https://github.com/jaegertracing/jaeger-openshift).

## Configuration Options

Jaeger binaries can be configured in a number of ways (in the order of decreasing priority):

  * command line arguments,
  * environment variables,
  * configuration files in JSON, TOML, YAML, HCL, or Java properties formats.

To see the complete list of options, run the binary with `help` command. Options that are specific to a certain storage backend are only listed if the storage type is selected. For example, to see all available options in the Collector with Cassandra storage:

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

## Agent

Jaeger client libraries expect **jaeger-agent** process to run locally on each host.
The agent exposes the following ports:

Port  | Protocol | Function
----- | -------  | ---
6831  | UDP      | accept [jaeger.thrift][jaeger-thrift] in `compact` Thrift protocol used by most current Jaeger clients
6832  | UDP      | accept [jaeger.thrift][jaeger-thrift] in `binary` Thrift protocol used by Node.js Jaeger client (because [thriftrw][thriftrw] npm package does not support `compact` protocol)
5778  | HTTP     | serve configs, sampling strategies
5775  | UDP      | accept [zipkin.thrift][zipkin-thrift] in `compact` Thrift protocol (deprecated; only used by very old Jaeger clients, circa 2016)
14271 | HTTP     | Healthcheck at `/` and metrics at `/metrics`

It can be executed directly on the host or via Docker, as follows:

```sh
## make sure to expose only the ports you use in your deployment scenario!
docker run \
  --rm \
  -p6831:6831/udp \
  -p6832:6832/udp \
  -p5778:5778/tcp \
  -p5775:5775/udp \
  jaegertracing/jaeger-agent:{{< currentVersion >}}
```

### Discovery System Integration

The agents can connect point to point to a single collector address, which could be
load balanced by another infrastructure component (e.g. DNS) across multiple collectors.
The agent can also be configured with a static list of collector addresses.

On Docker, a command like the following can be used:

```sh
docker run \
  --rm \
  -p5775:5775/udp \
  -p6831:6831/udp \
  -p6832:6832/udp \
  -p5778:5778/tcp \
  jaegertracing/jaeger-agent:{{< currentVersion >}} \
  --reporter.grpc.host-port=jaeger-collector.jaeger-infra.svc:14250
```

Or use `--reporter.tchannel.host-port=jaeger-collector.jaeger-infra.svc:14267` to use
legacy tchannel reporter.

When using gRPC, you have several options for load balancing and name resolution:

* Single connection and no load balancing. This is the default if you specify a single `host:port`. (example: `--reporter.grpc.host-port=jaeger-collector.jaeger-infra.svc:14250`)
* Static list of hostnames and round-robin load balancing. This is what you get with a comma-separated list of addresses. (example: `reporter.grpc.host-port=jaeger-collector1:14250,jaeger-collector2:14250,jaeger-collector3:14250`)
* Dynamic DNS resolution and round-robin load balancing. To get this behavior, prefix the address with `dns:///` and gRPC will attempt to resolve the hostname using SRV records (for [external load balancing](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md)), TXT records (for [service configs](https://github.com/grpc/grpc/blob/master/doc/service_config.md)), and A records. Refer to the [gRPC Name Resolution docs](https://github.com/grpc/grpc/blob/master/doc/naming.md) and the [dns_resolver.go implementation](https://github.com/grpc/grpc-go/blob/master/resolver/dns/dns_resolver.go) for more info. (example: `--reporter.grpc.host-port=dns:///jaeger-collector.jaeger-infra.svc:14250`)

### Agent level tags

Jaeger supports agent level tags, that can be added to the process tags of all spans passing through the agent. This is supported through the command line flag `--agent.tags=key1=value1,key2=value2,...,keyn=valuen`. Tags can also be set through an environment flag like so - `--agent.tags=key=${envFlag:defaultValue}` - The tag value will be set to the value of the `envFlag` environment key and `defaultValue` if not set. This feature is not supported for the tchannel reporter, enabled using the flags `--collector.host-port` or `--reporter.tchannel.host-port`.

## Collectors

The collectors are stateless and thus many instances of **jaeger-collector** can be run in parallel.
Collectors require almost no configuration, except for the location of Cassandra cluster,
via `--cassandra.keyspace` and `--cassandra.servers` options, or the location of Elasticsearch cluster, via
`--es.server-urls`, depending on which storage is specified. To see all command line options run

```sh
go run ./cmd/collector/main.go -h
```

or, if you don't have the source code

```sh
docker run -it --rm jaegertracing/jaeger-collector:{{< currentVersion >}} -h
```

At default settings the collector exposes the following ports:

Port  | Protocol | Function
----- | -------  | ---
14267 | TChannel | used by **jaeger-agent** to send spans in jaeger.thrift format
14250 | gRPC     | used by **jaeger-agent** to send spans in model.proto format
14268 | HTTP     | can accept spans directly from clients in jaeger.thrift format over binary thrift protocol
9411  | HTTP     | can accept Zipkin spans in Thrift, JSON and Proto (disabled by default)
14269 | HTTP     | Healthcheck at `/` and metrics at `/metrics`


## Storage Backends

Collectors require a persistent storage backend. Cassandra and Elasticsearch are the primary supported storage backends. Additional backends are [discussed here](https://github.com/jaegertracing/jaeger/issues/638).

The storage type can be passed via `SPAN_STORAGE_TYPE` environment variable. Valid values are `cassandra`, `elasticsearch`, `kafka` (only as a buffer), `grpc-plugin`, `badger` (only with all-in-one) and `memory` (only with all-in-one).

As of version 1.6.0, it's possible to use multiple storage types at the same time by providing a comma-separated list of valid types to the `SPAN_STORAGE_TYPE` environment variable.
It's important to note that all listed storage types are used for writing, but only the first type in the list will be used for reading and archiving.

### Memory

The in-memory storage is not intended for production workloads. It's intended as a simple solution to get started quickly and
data will be lost once the process is gone.

By default, there's no limit in the amount of traces stored in memory but a limit can be established by passing an
integer value via `--memory.max-traces`.

### Badger - local storage
Experimental since Jaeger 1.9

[Badger](https://github.com/dgraph-io/badger) is an embedded local storage, only available
with **all-in-one** distribution. By default it acts as an ephemeral storage using a temporary filesystem.
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

### Cassandra
Supported versions: 3.4+

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
MODE=test sh ./plugin/storage/cassandra/schema/create.sh | cqlsh
```

For production deployment, pass `MODE=prod DATACENTER={datacenter}` arguments to the script,
where `{datacenter}` is the name used in the Cassandra configuration / network topology.

The script also allows overriding TTL, keyspace name, replication factor, etc.
Run the script without arguments to see the full list of recognized parameters.

#### TLS support

Jaeger supports TLS client to node connections as long as you've configured
your Cassandra cluster correctly. After verifying with e.g. `cqlsh`, you can
configure the collector and query like so:

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

```
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

### Elasticsearch
Supported in Jaeger since 0.6.0
Supported versions: 5.x, 6.x, 7.x

Elasticsearch version is automatically retrieved from root/ping endpoint.
Based on this version Jaeger uses compatible index mappings and Elasticsearch REST API.
The version can be explicitly provided via `--es.version=` flag.

Elasticsearch does not require initialization other than
[installing and running Elasticsearch](https://www.elastic.co/downloads/elasticsearch).
Once it is running, pass the correct configuration values to the Jaeger collector and query service.

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

#### Upgrade Elasticsearch version

Elasticsearch defines wire and index compatibility versions. The index compatibility defines
the minimal version a node can read data from. For example Elasticsearch 7 can read indices
created by Elasticsearch 6, however it cannot read indices created by Elasticsearch 5 even
though they use the same index mappings. Therefore upgrade from Elasticsearch 6 to 7 does not require any
data migration. However, upgrade from Elasticsearch 5 to 7 has to be done through Elasticsearch 6 and wait
until indices created by ES 5.x are removed or explicitly reindexed.

Refer to the Elasticsearch [documentation](https://www.elastic.co/docs/deploy-manage/upgrade/deployment-or-cluster)
for wire and index compatibility versions. Generally this information can be retrieved from root/ping REST endpoint.

##### Reindex

Manual reindexing can be used when upgrading from Elasticsearch 5 to 7 (through Elasticsearch 6)
without waiting until indices created by Elasticsearch 5 are removed.

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
Supported in Jaeger since 1.6.0
Supported Kafka versions: 0.9+

Kafka can be used as an intermediary buffer between collector and an actual storage.
The collector is configured with `SPAN_STORAGE_TYPE=kafka` that makes it write all received spans
into a Kafka topic. A new component [Ingester](#ingester), added in version 1.7.0, is used to read from
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

### Storage plugin

Jaeger supports gRPC based storage plugins. For more information refer to [jaeger/plugin/storage/grpc](https://github.com/jaegertracing/jaeger/tree/v1.16.0/plugin/storage/grpc)

Available plugins:

* [InfluxDB](https://github.com/influxdata/jaeger-influxdb/)

```sh
docker run \
  -e SPAN_STORAGE_TYPE=grpc-plugin \
  -e GRPC_STORAGE_PLUGIN_BINARY=<...> \
  -e GRPC_STORAGE_PLUGIN_CONFIGURATION_FILE=<...> \
  jaegertracing/all-in-one:{{< currentVersion >}}
```

## Ingester
**jaeger-ingester** is a service which reads span data from Kafka topic and writes it to another storage backend (Elasticsearch or Cassandra).

Port  | Protocol | Function
----- | -------  | ---
14270 | HTTP     | Healthcheck at `/` and metrics at `/metrics`

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

At default settings the query service exposes the following port(s):

Port  | Protocol | Function
----- | -------  | ---
16686 | HTTP     | `/api/*` endpoints and Jaeger UI at `/`
16687 | HTTP     | Healthcheck at `/` and metrics at `/metrics`

### Minimal deployment example (Elasticsearch backend):
```sh
docker run -d --rm \
  -p 16686:16686 \
  -p 16687:16687 \
  -e SPAN_STORAGE_TYPE=elasticsearch \
  -e ES_SERVER_URLS=http://<ES_SERVER_IP>:<ES_SERVER_PORT> \
  jaegertracing/jaeger-query:{{< currentVersion >}}
```

### UI Base Path

The base path for all **jaeger-query** HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running **jaeger-query** behind a reverse proxy.

The base path can be configured via the `--query.base-path` command line parameter or the `QUERY_BASE_PATH` environment variable.

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](../frontend-ui/).

## Aggregation Jobs for Service Dependencies

Production deployments need an external process which aggregates data and creates dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and stores them directly to the storage.

## Configuration

All binaries accepts command line properties and environmental variables, power by [viper](https://github.com/spf13/viper) and [cobra](https://github.com/spf13/cobra) libraries. Please refer to the [CLI Flags](../cli/) page for more information.

[cqlsh]: http://cassandra.apache.org/doc/latest/tools/cqlsh.html
[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[thriftrw]: https://www.npmjs.com/package/thriftrw
