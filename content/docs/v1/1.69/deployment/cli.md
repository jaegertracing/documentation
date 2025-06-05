---
title: CLI flags
aliases: [../cli]
widescreen: true
hasparent: true
---

This is auto-generated documentation for CLI flags supported by Jaeger binaries.

  * CLI flags for some binaries change depending on the `SPAN_STORAGE_TYPE` environment variable. Relevant variations are included below.
  * Some binaries support _commands_ (mostly informational), such as `env`, `docs`, `version`, and `status`. These commands are not included here.
  * All parameters can be provided via environment variables, by changing all letters to upper-case and replacing all punctuation characters with the underscore `_`. For example, the value for the flag `--cassandra.connections-per-host` can be  provided via the `CASSANDRA_CONNECTIONS_PER_HOST` environment variable.

{{< cli/tools-list >}}
