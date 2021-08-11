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
---

The main Jaeger backend components are released as Docker images on [Docker Hub](https://hub.docker.com/r/jaegertracing) and [Quay](https://quay.io/organization/jaegertracing):

Component             | Docker Hub                                                                                                   | Quay
--------------------- | -------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------
**jaeger-agent**      | [hub.docker.com/r/jaegertracing/jaeger-agent/](https://hub.docker.com/r/jaegertracing/jaeger-agent/)         | [quay.io/repository/jaegertracing/jaeger-agent](https://quay.io/repository/jaegertracing/jaeger-agent)
**jaeger-collector**  | [hub.docker.com/r/jaegertracing/jaeger-collector/](https://hub.docker.com/r/jaegertracing/jaeger-collector/) | [quay.io/repository/jaegertracing/jaeger-collector](https://quay.io/repository/jaegertracing/jaeger-collector)
**jaeger-query**      | [hub.docker.com/r/jaegertracing/jaeger-query/](https://hub.docker.com/r/jaegertracing/jaeger-query/)         | [quay.io/repository/jaegertracing/jaeger-query](https://quay.io/repository/jaegertracing/jaeger-query)
**jaeger-ingester**   | [hub.docker.com/r/jaegertracing/jaeger-ingester/](https://hub.docker.com/r/jaegertracing/jaeger-ingester/)   | [quay.io/repository/jaegertracing/jaeger-ingester](https://quay.io/repository/jaegertracing/jaeger-ingester)

There are orchestration templates for running Jaeger with:

  * Kubernetes: [github.com/jaegertracing/jaeger-kubernetes](https://github.com/jaegertracing/jaeger-kubernetes),
  * OpenShift: [github.com/jaegertracing/jaeger-openshift](https://github.com/jaegertracing/jaeger-openshift).

## Configuration Options

Jaeger binaries can be configured in a number of ways (in the order of decreasing priority):

  * command line arguments,
  * environment variables,
  * configuration files in JSON, TOML, YAML, HCL, or Java properties formats.

To see the complete list of options, run the binary with `help` command or refer to the [CLI Flags](../cli/) page for more information. Options that are specific to a certain storage backend are only listed if the storage type is selected. For example, to see all available options in the Collector with Cassandra storage:

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
14271 | HTTP     | admin port: health check at `/` and metrics at `/metrics`

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

When using gRPC, you have several options for load balancing and name resolution:

* Single connection and no load balancing. This is the default if you specify a single `host:port`. (example: `--reporter.grpc.host-port=jaeger-collector.jaeger-infra.svc:14250`)
* Static list of hostnames and round-robin load balancing. This is what you get with a comma-separated list of addresses. (example: `reporter.grpc.host-port=jaeger-collector1:14250,jaeger-collector2:14250,jaeger-collector3:14250`)
* Dynamic DNS resolution and round-robin load balancing. To get this behaviour, prefix the address with `dns:///` and gRPC will attempt to resolve the hostname using SRV records (for [external load balancing](https://github.com/grpc/grpc/blob/master/doc/load-balancing.md)), TXT records (for [service configs](https://github.com/grpc/grpc/blob/master/doc/service_config.md)), and A records. Refer to the [gRPC Name Resolution docs](https://github.com/grpc/grpc/blob/master/doc/naming.md) and the [dns_resolver.go implementation](https://github.com/grpc/grpc-go/blob/master/resolver/dns/dns_resolver.go) for more info. (example: `--reporter.grpc.host-port=dns:///jaeger-collector.jaeger-infra.svc:14250`)

### Agent level tags

Jaeger supports agent level tags, that can be added to the process tags of all spans passing through the agent. This is supported through the command line flag `--agent.tags=key1=value1,key2=value2,...,keyn=valuen`. Tags can also be set through an environment flag like so - `--agent.tags=key=${envFlag:defaultValue}` - The tag value will be set to the value of the `envFlag` environment key and `defaultValue` if not set.

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
14250 | gRPC     | used by **jaeger-agent** to send spans in model.proto format
14268 | HTTP     | can accept spans directly from clients in jaeger.thrift format over binary thrift protocol
9411  | HTTP     | can accept Zipkin spans in Thrift, JSON and Proto (disabled by default)
14269 | HTTP     | admin port: health check at `/` and metrics at `/metrics`


## Storage Backends

Collectors require a persistent storage backend. Cassandra and Elasticsearch are the primary supported storage backends. Additional backends are [discussed here](https://github.com/jaegertracing/jaeger/issues/638).

The storage type can be passed via `SPAN_STORAGE_TYPE` environment variable. Valid values are `cassandra`, `elasticsearch`, `kafka` (only as a buffer), `grpc-plugin`, `badger` (only with all-in-one) and `memory` (only with all-in-one).

As of version 1.6.0, it's possible to use multiple storage types at the same time by providing a comma-separated list of valid types to the `SPAN_STORAGE_TYPE` environment variable. It's important to note that all listed storage types are used for writing, but only the first type in the list will be used for reading and archiving.

For large scale production deployment the Jaeger team [recommends Elasticsearch backend over Cassandra](../faq/#what-is-the-recommended-storage-backend).

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

#### Upgrade Badger v1 to v3

In Jaeger 1.24.0, Badger is upgraded from v1.6.2 to v3.2103.0 which changes the underlying data format. Following steps will help in migrating your data:

1. In Badger v1, the data looks like:

```sh
❯ ls /tmp/badger/
data  key
❯ ls /tmp/badger/data/
000001.vlog  000004.vlog  000005.vlog  000008.vlog  000011.vlog  000012.vlog  000013.vlog  000014.vlog  000015.vlog  000016.vlog  000017.vlog
❯ ls /tmp/badger/key/
000038.sst  000048.sst  000049.sst  000050.sst  000051.sst  000059.sst  000060.sst  000061.sst  000063.sst  000064.sst  000065.sst  000066.sst  MANIFEST
```

2. Make a backup of your data directory to have a copy incase migration didn't work successfully.

```sh
❯ cp -r /tmp/badger /tmp/badger.bk
```

3. Download, extract and compile the source code of badger v1: https://github.com/dgraph-io/badger/archive/refs/tags/v1.6.2.tar.gz

```sh
❯ tar xvzf badger-1.6.2.tar
❯ cd badger-1.6.2/badger/
❯ go install
```

This will install the badger command line utility into your $GOBIN path eg ~/go/bin/badger.

4. Use badger utility to take backup of data.

```sh
❯ ~/go/bin/badger backup --dir /tmp/badger/key --vlog-dir /tmp/badger/data/
Listening for /debug HTTP requests at port: 8080
badger 2021/06/24 22:04:30 INFO: All 12 tables opened in 907ms
badger 2021/06/24 22:04:30 INFO: Replaying file id: 17 at offset: 64584535
badger 2021/06/24 22:04:30 INFO: Replay took: 12.303µs
badger 2021/06/24 22:04:30 DEBUG: Value log discard stats empty
badger 2021/06/24 22:04:30 INFO: DB.Backup Created batch of size: 9.7 kB in 75.907µs.
badger 2021/06/24 22:04:31 INFO: DB.Backup Created batch of size: 4.3 MB in 8.003592ms.
....
....
badger 2021/06/24 22:04:31 INFO: DB.Backup Created batch of size: 30 MB in 74.808075ms.
badger 2021/06/24 22:04:36 INFO: DB.Backup Sent 15495232 keys
badger 2021/06/24 22:04:36 INFO: Got compaction priority: {level:0 score:1.73 dropPrefixes:[]}
```

This will create a badger.bak file in the current directory.

5. Download, extract and compile the source code of badger v3: https://github.com/dgraph-io/badger/archive/refs/tags/v3.2103.0.tar.gz

```sh
❯ tar xvzf badger-3.2103.0.tar
❯ cd badger-3.2103.0/badger/
❯ go install
```

This will install the badger command line utility into your $GOBIN path eg ~/go/bin/badger.

6. Restore the data from backup.

```sh
❯ ~/go/bin/badger restore --dir jaeger-v3
Listening for /debug HTTP requests at port: 8080
jemalloc enabled: false
Using Go memory
badger 2021/06/24 22:08:29 INFO: All 0 tables opened in 0s
badger 2021/06/24 22:08:29 INFO: Discard stats nextEmptySlot: 0
badger 2021/06/24 22:08:29 INFO: Set nextTxnTs to 0
badger 2021/06/24 22:08:37 INFO: [0] [E] LOG Compact 0->6 (5, 0 -> 50 tables with 1 splits). [00001 00002 00003 00004 00005 . .] -> [00006 00007 00008 00009 00010 00011 00012 00013 00014 00015 00016 00017 00018 00019 00020 00021 00022 00023 00024 00025 00026 00028 00029 00030 00031 00032 00033 00034 00035 00036 00037 00038 00039 00040 00041 00043 00044 00045 00046 00047 00048 00049 00050 00051 00052 00053 00054 00055 00056 00057 .], took 2.597s
badger 2021/06/24 22:08:53 INFO: Lifetime L0 stalled for: 0s
badger 2021/06/24 22:08:55 INFO:
Level 0 [ ]: NumTables: 00. Size: 0 B of 0 B. Score: 0.00->0.00 StaleData: 0 B Target FileSize: 64 MiB
Level 1 [ ]: NumTables: 00. Size: 0 B of 10 MiB. Score: 0.00->0.00 StaleData: 0 B Target FileSize: 2.0 MiB
Level 2 [ ]: NumTables: 00. Size: 0 B of 10 MiB. Score: 0.00->0.00 StaleData: 0 B Target FileSize: 2.0 MiB
Level 3 [ ]: NumTables: 00. Size: 0 B of 10 MiB. Score: 0.00->0.00 StaleData: 0 B Target FileSize: 2.0 MiB
Level 4 [B]: NumTables: 45. Size: 86 MiB of 10 MiB. Score: 8.64->10.21 StaleData: 0 B Target FileSize: 2.0 MiB
Level 5 [ ]: NumTables: 08. Size: 29 MiB of 34 MiB. Score: 0.00->0.00 StaleData: 0 B Target FileSize: 4.0 MiB
Level 6 [ ]: NumTables: 63. Size: 340 MiB of 340 MiB. Score: 0.00->0.00 StaleData: 0 B Target FileSize: 8.0 MiB
Level Done
Num Allocated Bytes at program end: 0 B
```

This will restore the data in jaeger-v3 directory. It will look like this

```sh
❯ ls ./jaeger-v3
000001.vlog  000180.sst  000257.sst  000276.sst  000294.sst  000327.sst  000336.sst  000349.sst  000356.sst  000364.sst  000371.sst  000378.sst  000385.sst  000392.sst  000399.sst  000406.sst  000413.sst   MANIFEST
000006.sst   000181.sst  000259.sst  000277.sst  000302.sst  000328.sst  000339.sst  000350.sst  000357.sst  000365.sst  000372.sst  000379.sst  000386.sst  000393.sst  000400.sst  000407.sst  000414.sst
000007.sst   000195.sst  000261.sst  000278.sst  000305.sst  000330.sst  000340.sst  000351.sst  000359.sst  000366.sst  000373.sst  000380.sst  000387.sst  000394.sst  000401.sst  000408.sst  000415.sst
000008.sst   000218.sst  000265.sst  000279.sst  000315.sst  000331.sst  000341.sst  000352.sst  000360.sst  000367.sst  000374.sst  000381.sst  000388.sst  000395.sst  000402.sst  000409.sst  000416.sst
000061.sst   000227.sst  000267.sst  000282.sst  000324.sst  000332.sst  000343.sst  000353.sst  000361.sst  000368.sst  000375.sst  000382.sst  000389.sst  000396.sst  000403.sst  000410.sst  000417.sst
000134.sst   000249.sst  000272.sst  000285.sst  000325.sst  000333.sst  000344.sst  000354.sst  000362.sst  000369.sst  000376.sst  000383.sst  000390.sst  000397.sst  000404.sst  000411.sst  DISCARD
000154.sst   000255.sst  000275.sst  000289.sst  000326.sst  000334.sst  000348.sst  000355.sst  000363.sst  000370.sst  000377.sst  000384.sst  000391.sst  000398.sst  000405.sst  000412.sst  KEYREGISTRY
```

7. Separate out the key and data directories.

```sh
❯ rm -rf /tmp/badger
❯ mv ./jaeger-v3 /tmp/badger
❯ mkdir /tmp/badger/data /tmp/badger/key
❯ mv /tmp/badger/*.vlog /tmp/badger/data/
❯ mv /tmp/badger/*.sst /tmp/badger/key/
❯ mv /tmp/badger/MANIFEST /tmp/badger/DISCARD /tmp/badger/KEYREGISTRY /tmp/badger/key/
```

8. Start Jaeger v1.24.0. It should start well.

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
index creation. [This article](https://qbox.io/blog/optimizing-elasticsearch-how-many-shards-per-index) goes into
more information about choosing how many shards should be chosen for optimization.

#### Elasticsearch Rollover

[Elasticsearch rollover](https://www.elastic.co/guide/en/elasticsearch/reference/master/indices-rollover-index.html) is an index management strategy that optimizes use of resources allocated to indices.
For example, indices that do not contain any data still allocate shards, and conversely, a single index might contain significantly more data than the others.
Jaeger by default stores data in daily indices which might not optimally utilize resources. Rollover feature can be enabled by `--es.use-aliases=true`.

Rollover lets you configure when to roll over to a new index based on one or more of the following criteria:

* `max_age` - the maximum age of the index. It uses [time units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#time-units): `d`, `h`, `m`.
* `max_docs` - the maximum documents in the index.
* `max_size` - the maximum estimated size of primary shards (since Elasticsearch 6.x). It uses [byte size units](https://www.elastic.co/guide/en/elasticsearch/reference/master/common-options.html#byte-units) `tb`, `gb`, `mb`.

Rollover index management strategy is more complex than using the default daily indices and it requires an initialisation job to prepare the storage and two cron jobs to manage indices.

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
the minimal version a node can read data from. For example Elasticsearch 7 can read indices
created by Elasticsearch 6, however it cannot read indices created by Elasticsearch 5 even
though they use the same index mappings. Therefore upgrade from Elasticsearch 6 to 7 does not require any
data migration. However, upgrade from Elasticsearch 5 to 7 has to be done through Elasticsearch 6 and wait
until indices created by ES 5.x are removed or explicitly reindexed.

Refer to the Elasticsearch [documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current//setup-upgrade.html)
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

Jaeger supports gRPC based storage plugins. For more information refer to [jaeger/plugin/storage/grpc](https://github.com/jaegertracing/jaeger/tree/master/plugin/storage/grpc)

Available plugins:

* [InfluxDB](https://github.com/influxdata/influxdb-observability/tree/main/jaeger-query-plugin) - time series database.
* [Logz.io](https://github.com/logzio/jaeger-logzio) - secure, scalable, managed, cloud-based ELK storage.
* [ClickHouse](https://github.com/jaegertracing/jaeger-clickhouse) - fast open-source OLAP DBMS.

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

At default settings the query service exposes the following port(s):

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

Jaeger backend combines trace data from applications that are usually running on different hosts. The hardware clocks on the hosts often experience relative drift, known as the [clock skew effect](https://en.wikipedia.org/wiki/Clock_skew). Clock skew can make it difficult to reason about traces, for example, when a server span may appear to start earlier than the client span, which should not be possible. The query service implements a clock skew adjustment algorithm ([code](https://github.com/jaegertracing/jaeger/blob/master/model/adjuster/clockskew.go)) to correct for clock drift, using the knowledge about causal relationships between spans. All adjusted spans have a warning displayed in the UI that provides the exact clock skew delta applied to its timestamps.

Sometimes these adjustments themselves make the trace hard to understand. For example, when repositioning the server span within the bounds of its parent span, Jaeger does not know the exact relationship between the request and response latencies, so it assumes then to be equal and places the child span in the middle of the parent span (see [issue #961](https://github.com/jaegertracing/jaeger/issues/961#issuecomment-453925244)).

The query service supports a configuration flag `--query.max-clock-skew-adjustment` that controls how much clock skew adjustment should be allowed. Setting this parameter to zero (`0s`) disables clock skew adjustment completely. This setting applies to all traces retrieved from the given query service. There is an open [ticket #197](https://github.com/jaegertracing/jaeger-ui/issues/197) to support toggling the adjustment on and off directly in the UI.

### UI Base Path

The base path for all **jaeger-query** HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running **jaeger-query** behind a reverse proxy.

The base path can be configured via the `--query.base-path` command line parameter or the `QUERY_BASE_PATH` environment variable.

### UI Customization and Embedding

Please refer to the [dedicated Frontend/UI page](../frontend-ui/).

## Aggregation Jobs for Service Dependencies

Production deployments need an external process which aggregates data and creates dependency links between services. Project [spark-dependencies](https://github.com/jaegertracing/spark-dependencies) is a Spark job which derives dependency links and stores them directly to the storage.

[cqlsh]: http://cassandra.apache.org/doc/latest/tools/cqlsh.html
[zipkin-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/zipkincore.thrift
[jaeger-thrift]: https://github.com/jaegertracing/jaeger-idl/blob/master/thrift/jaeger.thrift
[thriftrw]: https://www.npmjs.com/package/thriftrw
