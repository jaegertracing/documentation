---
title: Windows Service Deployment
aliases: [../windows]
hasparent: true
widescreen: true
---

In Windows environments, Jaeger processes can be hosted and managed as Windows services controlled via the `nssm` utility. To configure such services on Windows, download [nssm.exe](https://nssm.cc/download) for the appropriate architecture, and issue commands similar to how Jaeger is typically run.

It is easiest to run Jaeger in the **all-in-mode** mode. You can run it without a configuration file, and it will use the default in-memory storage. To customize its behavior or to connect to a more resilient storage, a configuration file is required. See [Configuration](../configuration/) for more details.

Here's how to set Jaeger up as a Windows service:

1. Create a configuration file, e.g., `C:\Jaeger\config.yaml`.
2. Install and configure the Jaeger service:

```bat
nssm install Jaeger C:\Jaeger\jaeger.exe --config=C:\Jaeger\config.yaml

nssm set Jaeger AppStdout C:\Jaeger\jaeger.out.log
nssm set Jaeger AppStderr C:\Jaeger\jaeger.err.log
nssm set Jaeger Description Jaeger All-in-One

nssm start Jaeger
```

For additional information & docs, please see [the NSSM usage guide](https://nssm.cc/usage) and [Jaeger Configuration](../configuration/).