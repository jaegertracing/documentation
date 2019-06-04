## jaeger-query

Jaeger query service provides a Web UI and an API for accessing trace data.

### Synopsis

Jaeger query service provides a Web UI and an API for accessing trace data.

```
jaeger-query [flags]
```

### Options

```
      --admin-http-port int                                The http port for the admin server, including health check, /metrics, etc. (default 16687)
      --config-file string                                 Configuration file in JSON, TOML, YAML, HCL, or Java properties formats (default none). See spf13/viper for precedence.
      --downsampling.hashsalt string                       Salt used when hashing trace id for downsampling.
      --downsampling.ratio float                           Ratio of spans passed to storage after downsampling (between 0 and 1), e.g ratio = 0.3 means we are keeping 30% of spans and dropping 70% of spans; ratio = 1.0 disables downsampling. (default 1)
      --es-archive.bulk.actions int                        The number of requests that can be enqueued before the bulk processor decides to commit
      --es-archive.bulk.flush-interval duration            A time.Duration after which bulk requests are committed, regardless of other thresholds. Set to zero to disable. By default, this is disabled. (default 0s)
      --es-archive.bulk.size int                           The number of bytes that the bulk requests can take up before the bulk processor decides to commit
      --es-archive.bulk.workers int                        The number of workers that are able to receive bulk requests and eventually commit them to Elasticsearch
      --es-archive.enabled                                 Enable extra storage
      --es-archive.index-prefix string                     Optional prefix of Jaeger indices. For example "production" creates "production-jaeger-*".
      --es-archive.max-num-spans int                       The maximum number of spans to fetch at a time per query in Elasticsearch
      --es-archive.max-span-age duration                   The maximum lookback for spans in Elasticsearch (default 0s)
      --es-archive.num-replicas int                        The number of replicas per index in Elasticsearch
      --es-archive.num-shards int                          The number of shards per index in Elasticsearch
      --es-archive.password string                         The password required by Elasticsearch
      --es-archive.server-urls string                      The comma-separated list of Elasticsearch servers, must be full url i.e. http://localhost:9200
      --es-archive.sniffer                                 The sniffer config for Elasticsearch; client uses sniffing process to find all nodes automatically, disable if not required
      --es-archive.tags-as-fields.all                      (experimental) Store all span and process tags as object fields. If true .tags-as-fields.config-file is ignored. Binary tags are always stored as nested objects.
      --es-archive.tags-as-fields.config-file string       (experimental) Optional path to a file containing tag keys which will be stored as object fields. Each key should be on a separate line.
      --es-archive.tags-as-fields.dot-replacement string   (experimental) The character used to replace dots (".") in tag keys stored as object fields.
      --es-archive.timeout duration                        Timeout used for queries. A Timeout of zero means no timeout (default 0s)
      --es-archive.tls                                     Enable TLS with client certificates.
      --es-archive.tls.ca string                           Path to TLS CA file
      --es-archive.tls.cert string                         Path to TLS certificate file
      --es-archive.tls.key string                          Path to TLS key file
      --es-archive.tls.skip-host-verify                    (insecure) Skip server's certificate chain and host name verification
      --es-archive.token-file string                       Path to a file containing bearer token. This flag also loads CA if it is specified.
      --es-archive.use-aliases                             (experimental) Use read and write aliases for indices. Use this option with Elasticsearch rollover API. It requires an external component to create aliases before startup and then performing its management. Note that es-archive.max-span-age is not taken into the account and has to be substituted by external component managing read alias.
      --es-archive.username string                         The username required by Elasticsearch. The basic authentication also loads CA if it is specified.
      --es.bulk.actions int                                The number of requests that can be enqueued before the bulk processor decides to commit (default 1000)
      --es.bulk.flush-interval duration                    A time.Duration after which bulk requests are committed, regardless of other thresholds. Set to zero to disable. By default, this is disabled. (default 200ms)
      --es.bulk.size int                                   The number of bytes that the bulk requests can take up before the bulk processor decides to commit (default 5000000)
      --es.bulk.workers int                                The number of workers that are able to receive bulk requests and eventually commit them to Elasticsearch (default 1)
      --es.index-prefix string                             Optional prefix of Jaeger indices. For example "production" creates "production-jaeger-*".
      --es.max-num-spans int                               The maximum number of spans to fetch at a time per query in Elasticsearch (default 10000)
      --es.max-span-age duration                           The maximum lookback for spans in Elasticsearch (default 72h0m0s)
      --es.num-replicas int                                The number of replicas per index in Elasticsearch (default 1)
      --es.num-shards int                                  The number of shards per index in Elasticsearch (default 5)
      --es.password string                                 The password required by Elasticsearch
      --es.server-urls string                              The comma-separated list of Elasticsearch servers, must be full url i.e. http://localhost:9200 (default "http://127.0.0.1:9200")
      --es.sniffer                                         The sniffer config for Elasticsearch; client uses sniffing process to find all nodes automatically, disable if not required
      --es.tags-as-fields.all                              (experimental) Store all span and process tags as object fields. If true .tags-as-fields.config-file is ignored. Binary tags are always stored as nested objects.
      --es.tags-as-fields.config-file string               (experimental) Optional path to a file containing tag keys which will be stored as object fields. Each key should be on a separate line.
      --es.tags-as-fields.dot-replacement string           (experimental) The character used to replace dots (".") in tag keys stored as object fields. (default "@")
      --es.timeout duration                                Timeout used for queries. A Timeout of zero means no timeout (default 0s)
      --es.tls                                             Enable TLS with client certificates.
      --es.tls.ca string                                   Path to TLS CA file
      --es.tls.cert string                                 Path to TLS certificate file
      --es.tls.key string                                  Path to TLS key file
      --es.tls.skip-host-verify                            (insecure) Skip server's certificate chain and host name verification
      --es.token-file string                               Path to a file containing bearer token. This flag also loads CA if it is specified.
      --es.use-aliases                                     (experimental) Use read and write aliases for indices. Use this option with Elasticsearch rollover API. It requires an external component to create aliases before startup and then performing its management. Note that es.max-span-age is not taken into the account and has to be substituted by external component managing read alias.
      --es.username string                                 The username required by Elasticsearch. The basic authentication also loads CA if it is specified.
      --health-check-http-port int                         (deprecated) see --admin-http-port
  -h, --help                                               help for jaeger-query
      --log-level string                                   Minimal allowed log Level. For more levels see https://github.com/uber-go/zap (default "info")
      --metrics-backend string                             Defines which metrics backend to use for metrics reporting: expvar, prometheus, none (default "prometheus")
      --metrics-http-route string                          Defines the route of HTTP endpoint for metrics backends that support scraping (default "/metrics")
      --query.base-path string                             The base path for all HTTP routes, e.g. /jaeger; useful when running behind a reverse proxy (default "/")
      --query.port int                                     The port for the query service (default 16686)
      --query.static-files string                          The directory path override for the static assets for the UI
      --query.ui-config string                             The path to the UI configuration file in JSON format
      --span-storage.type string                           (deprecated) please use SPAN_STORAGE_TYPE environment variable. Run this binary with "env" command for help.
```

### SEE ALSO

* [jaeger-query docs](../jaeger-query_docs_elasticsearch)	 - Generates documentation
* [jaeger-query env](../jaeger-query_env_elasticsearch)	 - Help about environment variables
* [jaeger-query version](../jaeger-query_version_elasticsearch)	 - Print the version

###### Auto generated by spf13/cobra on 4-Jun-2019
