---
title: Cassandra
aliases: [../cassandra]
hasparent: true
---

* Supported versions: 4+

{{< danger >}}
TODO update examples to use config properties, not CLI flags.
{{< /danger >}}

Deploying Cassandra itself is out of scope for our documentation. One good
source of documentation is the [Apache Cassandra Docs](https://cassandra.apache.org/doc/latest/).

Cassandra also has the following officially supported resources available from the community:
- [Docker container](https://hub.docker.com/_/cassandra) for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/bitnami/cassandra) from Bitnami
- [Kubernetes Operator](https://github.com/k8ssandra/cass-operator) from DataStax

#### Configuration

Configuration example for [Jaeger writing to Cassandra](https://github.com/jaegertracing/jaeger/blob/v2.0.0/cmd/jaeger/config-cassandra.yaml).

#### Schema script

A script is provided to initialize Cassandra keyspace and schema
using Cassandra's interactive shell [`cqlsh`][cqlsh]:

```sh
MODE=test sh ./plugin/storage/cassandra/schema/create.sh | cqlsh
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

**Note**: See [README](https://github.com/jaegertracing/jaeger/blob/v2.0.0/plugin/storage/cassandra/schema/README.md) for more details on Cassandra schema management.

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

#### Compatible Backends

* ScyllaDB [can be used](https://github.com/jaegertracing/jaeger/blob/v2.0.0/plugin/storage/scylladb/README.md) as a drop-in replacement for Cassandra since it uses the same data model and query language.
