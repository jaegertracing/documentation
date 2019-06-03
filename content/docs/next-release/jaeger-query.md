## jaeger-query

Jaeger query service provides a Web UI and an API for accessing trace data.

### Synopsis

Jaeger query service provides a Web UI and an API for accessing trace data.

```
jaeger-query [flags]
```

### Options

```
      --admin-http-port int                             The http port for the admin server, including health check, /metrics, etc. (default 16687)
      --cassandra-archive.connections-per-host int      The number of Cassandra connections from a single backend instance
      --cassandra-archive.consistency string            The Cassandra consistency level, e.g. ANY, ONE, TWO, THREE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM, LOCAL_ONE (default LOCAL_ONE)
      --cassandra-archive.enable-dependencies-v2        (deprecated) Jaeger will automatically detect the version of the dependencies table
      --cassandra-archive.enabled                       Enable extra storage
      --cassandra-archive.keyspace string               The Cassandra keyspace for Jaeger data
      --cassandra-archive.local-dc string               The name of the Cassandra local data center for DC Aware host selection
      --cassandra-archive.max-retry-attempts int        The number of attempts when reading from Cassandra
      --cassandra-archive.password string               Password for password authentication for Cassandra
      --cassandra-archive.port int                      The port for cassandra
      --cassandra-archive.proto-version int             The Cassandra protocol version
      --cassandra-archive.reconnect-interval duration   Reconnect interval to retry connecting to downed hosts (default 0s)
      --cassandra-archive.servers string                The comma-separated list of Cassandra servers
      --cassandra-archive.socket-keep-alive duration    Cassandra's keepalive period to use, enabled if > 0 (default 0s)
      --cassandra-archive.timeout duration              Timeout used for queries. A Timeout of zero means no timeout (default 0s)
      --cassandra-archive.tls                           Enable TLS
      --cassandra-archive.tls.ca string                 Path to TLS CA file
      --cassandra-archive.tls.cert string               Path to TLS certificate file
      --cassandra-archive.tls.key string                Path to TLS key file
      --cassandra-archive.tls.server-name string        Override the TLS server name
      --cassandra-archive.tls.verify-host               Enable (or disable) host key verification
      --cassandra-archive.username string               Username for password authentication for Cassandra
      --cassandra.connections-per-host int              The number of Cassandra connections from a single backend instance (default 2)
      --cassandra.consistency string                    The Cassandra consistency level, e.g. ANY, ONE, TWO, THREE, QUORUM, ALL, LOCAL_QUORUM, EACH_QUORUM, LOCAL_ONE (default LOCAL_ONE)
      --cassandra.enable-dependencies-v2                (deprecated) Jaeger will automatically detect the version of the dependencies table
      --cassandra.keyspace string                       The Cassandra keyspace for Jaeger data (default "jaeger_v1_test")
      --cassandra.local-dc string                       The name of the Cassandra local data center for DC Aware host selection
      --cassandra.max-retry-attempts int                The number of attempts when reading from Cassandra (default 3)
      --cassandra.password string                       Password for password authentication for Cassandra
      --cassandra.port int                              The port for cassandra
      --cassandra.proto-version int                     The Cassandra protocol version (default 4)
      --cassandra.reconnect-interval duration           Reconnect interval to retry connecting to downed hosts (default 1m0s)
      --cassandra.servers string                        The comma-separated list of Cassandra servers (default "127.0.0.1")
      --cassandra.socket-keep-alive duration            Cassandra's keepalive period to use, enabled if > 0 (default 0s)
      --cassandra.span-store-write-cache-ttl duration   The duration to wait before rewriting an existing service or operation name (default 12h0m0s)
      --cassandra.timeout duration                      Timeout used for queries. A Timeout of zero means no timeout (default 0s)
      --cassandra.tls                                   Enable TLS
      --cassandra.tls.ca string                         Path to TLS CA file
      --cassandra.tls.cert string                       Path to TLS certificate file
      --cassandra.tls.key string                        Path to TLS key file
      --cassandra.tls.server-name string                Override the TLS server name
      --cassandra.tls.verify-host                       Enable (or disable) host key verification (default true)
      --cassandra.username string                       Username for password authentication for Cassandra
      --config-file string                              Configuration file in JSON, TOML, YAML, HCL, or Java properties formats (default none). See spf13/viper for precedence.
      --downsampling.hashsalt string                    Salt used when hashing trace id for downsampling.
      --downsampling.ratio float                        Ratio of spans passed to storage after downsampling (between 0 and 1), e.g ratio = 0.3 means we are keeping 30% of spans and dropping 70% of spans; ratio = 1.0 disables downsampling. (default 1)
      --health-check-http-port int                      (deprecated) see --admin-http-port
  -h, --help                                            help for jaeger-query
      --log-level string                                Minimal allowed log Level. For more levels see https://github.com/uber-go/zap (default "info")
      --metrics-backend string                          Defines which metrics backend to use for metrics reporting: expvar, prometheus, none (default "prometheus")
      --metrics-http-route string                       Defines the route of HTTP endpoint for metrics backends that support scraping (default "/metrics")
      --query.base-path string                          The base path for all HTTP routes, e.g. /jaeger; useful when running behind a reverse proxy (default "/")
      --query.port int                                  The port for the query service (default 16686)
      --query.static-files string                       The directory path override for the static assets for the UI
      --query.ui-config string                          The path to the UI configuration file in JSON format
      --span-storage.type string                        (deprecated) please use SPAN_STORAGE_TYPE environment variable. Run this binary with "env" command for help.
```

### SEE ALSO

* [jaeger-query docs](../jaeger-query_docs)	 - Generates documentation
* [jaeger-query env](../jaeger-query_env)	 - Help about environment variables
* [jaeger-query version](../jaeger-query_version)	 - Print the version

###### Auto generated by spf13/cobra on 3-Jun-2019
