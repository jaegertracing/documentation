---
title: Commands
weight: 5
description: Jaeger all-in-one flags
children:
- title: Env command
  url: jaeger-all-in-one_env
- title: Version command
  url: jaeger-all-in-one_version
  
---


## jaeger-all-in-one

Jaeger all-in-one distribution with agent, collector and query in one process.

### Synopsis

Jaeger all-in-one distribution with agent, collector and query. Use with caution this version
		 uses only in-memory database.

```
jaeger-all-in-one [flags]
```

### Options

```
      --admin-http-port int                                       The http port for the admin server, including health check, /metrics, etc. (default 14269)
      --collector.grpc-port int                                   The gRPC port for the collector service (default 14250)
      --collector.grpc.tls                                        Enable TLS
      --collector.grpc.tls.cert string                            Path to TLS certificate file
      --collector.grpc.tls.key string                             Path to TLS key file
      --collector.host-port string                                (deprecated) see --reporter.tchannel.host-port
      --collector.http-port int                                   The HTTP port for the collector service (default 14268)
      --collector.num-workers int                                 The number of workers pulling items from the queue (default 50)
      --collector.port int                                        The TChannel port for the collector service (default 14267)
      --collector.queue-size int                                  The queue size of the collector (default 2000)
      --collector.zipkin.allowed-headers string                   Allowed headers for the Zipkin collector service, default content-type (default "content-type")
      --collector.zipkin.allowed-origins string                   Allowed origins for the Zipkin collector service, default accepts all (default "*")
      --collector.zipkin.http-port int                            The HTTP port for the Zipkin collector service e.g. 9411
      --config-file string                                        Configuration file in JSON, TOML, YAML, HCL, or Java properties formats (default none). See spf13/viper for precedence.
      --discovery.conn-check-timeout duration                     (deprecated) see --reporter.tchannel.discovery.conn-check-timeout (default 250ms)
      --discovery.min-peers int                                   (deprecated) see --reporter.tchannel.discovery.min-peers (default 3)
      --downsampling.hashsalt string                              Salt used when hashing trace id for downsampling.
      --downsampling.ratio float                                  Ratio of spans passed to storage after downsampling (between 0 and 1), e.g ratio = 0.3 means we are keeping 30% of spans and dropping 70% of spans; ratio = 1.0 disables downsampling. (default 1)
      --health-check-http-port int                                (deprecated) see --admin-http-port
  -h, --help                                                      help for jaeger-all-in-one
      --http-server.host-port string                              host:port of the http server (e.g. for /sampling point and /baggageRestrictions endpoint) (default ":5778")
      --jaeger.tags string                                        One or more tags to be added to the Process tags of all spans passing through this agent. Ex: key1=value1,key2=${envVar:defaultValue}
      --log-level string                                          Minimal allowed log Level. For more levels see https://github.com/uber-go/zap (default "info")
      --memory.max-traces int                                     The maximum amount of traces to store in memory
      --metrics-backend string                                    Defines which metrics backend to use for metrics reporting: expvar, prometheus, none (default "prometheus")
      --metrics-http-route string                                 Defines the route of HTTP endpoint for metrics backends that support scraping (default "/metrics")
      --processor.jaeger-binary.server-host-port string           host:port for the UDP server (default ":6832")
      --processor.jaeger-binary.server-max-packet-size int        max packet size for the UDP server (default 65000)
      --processor.jaeger-binary.server-queue-size int             length of the queue for the UDP server (default 1000)
      --processor.jaeger-binary.workers int                       how many workers the processor should run (default 10)
      --processor.jaeger-compact.server-host-port string          host:port for the UDP server (default ":6831")
      --processor.jaeger-compact.server-max-packet-size int       max packet size for the UDP server (default 65000)
      --processor.jaeger-compact.server-queue-size int            length of the queue for the UDP server (default 1000)
      --processor.jaeger-compact.workers int                      how many workers the processor should run (default 10)
      --processor.zipkin-compact.server-host-port string          host:port for the UDP server (default ":5775")
      --processor.zipkin-compact.server-max-packet-size int       max packet size for the UDP server (default 65000)
      --processor.zipkin-compact.server-queue-size int            length of the queue for the UDP server (default 1000)
      --processor.zipkin-compact.workers int                      how many workers the processor should run (default 10)
      --query.base-path string                                    The base path for all HTTP routes, e.g. /jaeger; useful when running behind a reverse proxy (default "/")
      --query.port int                                            The port for the query service (default 16686)
      --query.static-files string                                 The directory path override for the static assets for the UI
      --query.ui-config string                                    The path to the UI configuration file in JSON format
      --reporter.grpc.discovery.min-peers int                     Max number of collectors to which the agent will try to connect at any given time (default 3)
      --reporter.grpc.host-port string                            Comma-separated string representing host:port of a static list of collectors to connect to directly.
      --reporter.grpc.retry.max uint                              Sets the maximum number of retries for a call. (default 3)
      --reporter.grpc.tls                                         Enable TLS.
      --reporter.grpc.tls.ca string                               Path to a TLS CA file. (default use the systems truststore)
      --reporter.grpc.tls.server-name string                      Override the TLS server name.
      --reporter.tchannel.discovery.conn-check-timeout duration   sets the timeout used when establishing new connections (default 250ms)
      --reporter.tchannel.discovery.min-peers int                 if using service discovery, the min number of connections to maintain to the backend (default 3)
      --reporter.tchannel.host-port string                        comma-separated string representing host:ports of a static list of collectors to connect to directly (e.g. when not using service discovery)
      --reporter.tchannel.report-timeout duration                 sets the timeout used when reporting spans (default 1s)
      --reporter.type string                                      Reporter type to use e.g. grpc, tchannel (default "grpc")
      --sampling.strategies-file string                           The path for the sampling strategies file in JSON format. See sampling documentation to see format of the file
      --span-storage.type string                                  (deprecated) please use SPAN_STORAGE_TYPE environment variable. Run this binary with "env" command for help.
```

### SEE ALSO

* [jaeger-all-in-one env](jaeger-all-in-one_env.md)	 - Help about environment variables
* [jaeger-all-in-one version](jaeger-all-in-one_version.md)	 - Print the version

###### Auto generated by spf13/cobra on 29-May-2019
