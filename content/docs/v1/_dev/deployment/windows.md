---
title: Windows Service Deployment
aliases: [../windows]
hasparent: true
---

In Windows environments, Jaeger processes can be hosted and managed as Windows services controlled via the `sc` utility.  To configure such services on Windows, download [nssm.exe](https://nssm.cc/download) for the appropriate architecture, and issue commands similar to how Jaeger is typically run.  The example below showcases a basic Elasticsearch setup, configured using both environment variables and process arguments.

## Collector
```bat
nssm install JaegerCollector C:\Jaeger\jaeger-collector.exe --es.server-urls=http://localhost:9200 --es.username=jaeger --es.password=PASSWORD

nssm set JaegerCollector AppStdout C:\Jaeger\jaeger-collector.out.log
nssm set JaegerCollector AppStderr C:\Jaeger\jaeger-collector.err.log
nssm set JaegerCollector Description Jaeger Collector service
nssm set JaegerCollector AppEnvironmentExtra SPAN_STORAGE_TYPE=elasticsearch

nssm start JaegerCollector
```

## Query UI
```bat
nssm install JaegerUI C:\Jaeger\jaeger-query.exe --es.server-urls=http://localhost:9200 --es.username=jaeger --es.password=PASSWORD

nssm set JaegerUI AppStdout C:\Jaeger\jaeger-ui.out.log
nssm set JaegerUI AppStderr C:\Jaeger\jaeger-ui.err.log
nssm set JaegerUI Description Jaeger Query service
nssm set JaegerUI AppEnvironmentExtra SPAN_STORAGE_TYPE=elasticsearch

nssm start JaegerUI
```

For additional information & docs, please see [the NSSM usage guide.](https://nssm.cc/usage)
