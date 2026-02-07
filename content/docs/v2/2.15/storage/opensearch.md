---
title: OpenSearch
aliases: [../opensearch]
hasparent: true
---

## Introduction

* Supported OpenSearch versions: 1.x, 2.x, 3.x

OpenSearch maintains API compatibility between versions and remains compatible primarily with Elasticsearch v7.10.2 this version compatibility is automatically retrieved from root/ping endpoint. Based on this version Jaeger uses compatible index mappings and OpenSearch REST API.

OpenSearch does not require initialization other than
[installing and running OpenSearch](https://opensearch.org/downloads.html).
Once it is running, pass the correct configuration values to Jaeger.

OpenSearch also has the following officially supported resources available from the community:
- [Docker container](https://hub.docker.com/r/opensearchproject/opensearch) for getting a single node up quickly
- [Helm chart](https://artifacthub.io/packages/helm/opensearch-project-helm-charts/opensearch)
- [Kubernetes Operator](https://github.com/opensearch-project/opensearch-k8s-operator)

## Configuration

Here is [example configuration](https://github.com/jaegertracing/jaeger/blob/v2.15.0/cmd/jaeger/config-opensearch.yaml) for OpenSearch. Overall Jaeger uses the same implementation for OpenSearch as for Elasticsearch, so most of the discussion on the [Elasticsearch page](../elasticsearch/#configuration) applies.
