---
title: Cassandra
hasparent: true
---

* Supported Cassandra versions: 4.x, 5.x

This page describes how to configure Jaeger to use an existing Cassandra cluster as a storage backend for traces. For instructions on how to deploy a Cassandra cluster, please refer to [Apache Cassandra Documentation](https://cassandra.apache.org/doc/latest/).

Cassandra also has the following officially supported resources available from the community:
- [Docker container](https://hub.docker.com/_/cassandra) for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/bitnami/cassandra) from Bitnami
- [Kubernetes Operator](https://github.com/k8ssandra/cass-operator) from DataStax

## Configuration

A sample configuration for Jaeger with Cassandra backend is available in the Jaeger repository: [config-cassandra.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-cassandra.yaml). In the future the configuration documentation will be auto-generated from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/main/pkg/cassandra/config/config.go#L21) as the authoritative source.

## Initializing Schema

Before Jaeger can use a Cassandra cluster as a storage backend, a keyspace and database schema
must be initilized. As of v2.1.0, Jaeger can automatically create the schema on start-up. It defaults to the equivalent of the following configuration:

```yaml
extensions:
  jaeger_storage:
    backends:
      some_storage:
        cassandra:
          schema:
            create: true
            keyspace: jaeger_dc1
            datacenter: dc1
            trace_ttl: 48h
            dependencies_ttl: 48d
            compaction_window: 2h
            replication_factor: 1
```

It is recommended to customize these values to match your needs, for example, for longer retention or higher replication factor.

If `schema.create` is set to `false`, the schema must be initialized manually. There is a script in the [jaeger](https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/cassandra/schema/create.sh) repository that generates the initialization instruction that can be executed using Cassandra's interactive shell [cqlsh][cqlsh]:

```sh
MODE=test sh ./plugin/storage/cassandra/schema/create.sh | cqlsh
```

The same script is packaged as a container image (make sure to provide the right IP address):
```sh
docker run \
  -e CQLSH_HOST={server IP address}  \
  -e MODE=prod \
  jaegertracing/jaeger-cassandra-schema:{{< currentVersion >}}
```

For production deployment, pass `MODE=prod DATACENTER={datacenter}` arguments to the script,
where `{datacenter}` is the name used in the Cassandra configuration / network topology.

The script also allows overriding TTL, keyspace name, replication factor, etc.
Run the script without arguments to see the full list of recognized parameters.

See [this README](https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/cassandra/schema/README.md) for more details on Cassandra schema management.

## TLS support

Jaeger supports TLS client-to-node connections as long as you've configured
your Cassandra cluster correctly. You can specify paths to the TLS certificates (`.pem` files) un the `tls:` section under `connection:`. See [configtls.ClientConfig](https://github.com/open-telemetry/opentelemetry-collector/blob/main/config/configtls/README.md#client-configuration) in the OpenTelemetry Collector repository for available properties.

**Tip**: verify the correctness of your TLS certificates using `cqlsh` first.

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

## Compatible Backends

* ScyllaDB [can be used](https://github.com/jaegertracing/jaeger/blob/main/plugin/storage/scylladb/README.md) as a drop-in replacement for Cassandra since it uses the same data model and query language.

[cqlsh]: http://cassandra.apache.org/doc/latest/tools/cqlsh.html
