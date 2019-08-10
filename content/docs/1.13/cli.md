---
title: CLI flags
widescreen: true
hasparent: true
---

This is auto-generated documentation for CLI flags supported by Jaeger binaries.

  * CLI flags for some binaries change depending on the `SPAN_STORAGE_TYPE` environment variable. Relevant variations are included below.
  * Some binaries support _commands_ (mostly informational), such as `env`, `docs`, and `version`. These commands are not included here.
  * All parameters can be also provided via environment variables, by changing all letters to upper-case and replacing all punctuation characters with underscore `_`. For example, the value for the flag `--cassandra.connections-per-host` can be  provided via `CASSANDRA_CONNECTIONS_PER_HOST` environment variable.

{{< tabset cookie-name="cli-blah" >}}

{{< tab name="default" cookie-value="default" >}}

CLI flags for some binaries change depending on the `SPAN_STORAGE_TYPE` environment variable. Relevant variations are included below.

{{< /tab >}}

{{< tab name="demo" cookie-value="demo" >}}

Some binaries support _commands_ (mostly informational), such as `env`, `docs`, and `version`. These commands are not included here.

{{< /tab >}}

{{< /tabset >}}

{{< cli/tools-list >}}
