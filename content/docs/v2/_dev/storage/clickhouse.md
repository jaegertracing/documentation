---
title: ClickHouse
aliases: [../clickhouse]
hasparent: true
---

{{< warning >}}
ClickHouse storage is **experimental** and must be explicitly enabled via the `storage.clickhouse` [feature gate](https://github.com/open-telemetry/opentelemetry-collector/blob/main/featuregate/README.md). The schema is subject to breaking changes in future releases.
{{< /warning >}}

* Supported ClickHouse versions: 25.x

[ClickHouse](https://clickhouse.com/) is a column-oriented analytical database optimized for high-throughput ingestion and fast queries over large datasets. Its columnar storage, data compression, and vectorized query execution make it well-suited for storing and analyzing trace data at scale.

ClickHouse also has the following officially supported resources available from the community:
- [Docker container](https://hub.docker.com/r/clickhouse/clickhouse-server) from ClickHouse for getting a single node up quickly
- [Helm chart](https://clickhouse.com/docs/use-cases/observability/clickstack/deployment/helm) from ClickHouse

## Configuration

A sample configuration for Jaeger with ClickHouse backend is available in the Jaeger repository: [config-clickhouse.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-clickhouse.yaml). In the future the configuration documentation will be auto-generated from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v2/clickhouse/config.go) as the authoritative source.

## Schema

All SQL definitions are available in the [sql/ directory](https://github.com/jaegertracing/jaeger/tree/main/internal/storage/v2/clickhouse/sql) in the Jaeger repository.

All tables are automatically created on startup when `create_schema: true` is set. Auxiliary tables are populated via [materialized views](https://clickhouse.com/docs/materialized-view) that transform and insert data whenever new spans arrive.

## Quick Start

From the [Jaeger repository](https://github.com/jaegertracing/jaeger) root:

### 1. Start ClickHouse

```bash
docker compose -f docker-compose/clickhouse/docker-compose.yml up -d
```

This starts a ClickHouse server on ports `9000` (native) and `8123` (HTTP) with database `jaeger`.

### 2. Run Jaeger

```bash
go run ./cmd/jaeger --config cmd/jaeger/config-clickhouse.yaml --feature-gates=storage.clickhouse
```

The config enables automatic schema creation (`create_schema: true`), so tables and materialized views are created on startup.

### 3. Generate Test Data

In a separate terminal:

```bash
go run ./cmd/tracegen -duration 10s -workers 3 -pause 250ms
```

Then open the Jaeger UI at http://localhost:16686.
