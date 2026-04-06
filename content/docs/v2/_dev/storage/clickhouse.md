---
title: ClickHouse
aliases: [../clickhouse]
hasparent: true
---

{{< warning >}}
ClickHouse storage is **experimental** and must be explicitly enabled via the `storage.clickhouse` feature gate. The schema is subject to breaking changes in future releases.
{{< /warning >}}

* Supported ClickHouse versions: 25.x

[ClickHouse](https://clickhouse.com/) is a column-oriented analytical database optimized for high-throughput ingestion and fast queries over large datasets.

## Configuration

A sample configuration for Jaeger with ClickHouse backend is available in the Jaeger repository: [config-clickhouse.yaml](https://github.com/jaegertracing/jaeger/blob/main/cmd/jaeger/config-clickhouse.yaml). In the future the configuration documentation will be auto-generated from the schema. Meanwhile, please refer to [config.go](https://github.com/jaegertracing/jaeger/blob/main/internal/storage/v2/clickhouse/config.go) as the authoritative source.

## Schema

All SQL definitions are available in the [sql/ directory](https://github.com/jaegertracing/jaeger/tree/main/internal/storage/v2/clickhouse/sql) in the Jaeger repository.

All tables are automatically created on startup when `create_schema: true` is set. Auxiliary tables are populated via [materialized views](https://clickhouse.com/docs/materialized-view) that transform and insert data whenever new spans arrive.

## Quick Start

### 1. Start ClickHouse

```bash
docker compose -f docker-compose/clickhouse/docker-compose.yml up -d
```

This starts a ClickHouse server on ports `9000` (native) and `8123` (HTTP) with database `jaeger`.

### 2. Run Jaeger

```bash
docker run --rm --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  -p 4318:4318 \
  -v /path/to/config-clickhouse.yaml:/jaeger/config.yaml \
  cr.jaegertracing.io/jaegertracing/jaeger:{{< currentVersion >}} \
  --config /jaeger/config.yaml \
  --feature-gates=storage.clickhouse
```

The config enables automatic schema creation (`create_schema: true`), so tables and materialized views are created on startup.

### 3. Generate Test Data

```bash
docker run --rm --net=host cr.jaegertracing.io/jaegertracing/jaeger-tracegen:{{< currentVersion >}}
```

Then open the Jaeger UI at http://localhost:16686.
