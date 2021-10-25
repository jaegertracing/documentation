---
title: Sampling
hasparent: true
---

Jaeger libraries implement consistent upfront (or head-based) sampling. For example, assume we have a simple call graph where service A calls service B, and B calls service C: `A -> B -> C`. When service A receives a request that contains no tracing information, Jaeger tracer will start a new {{< tip "trace" >}}, assign it a random trace ID, and make a sampling decision based on the currently installed sampling strategy. The sampling decision will be propagated with the requests to B and to C, so those services will not be making the sampling decision again but instead will respect the decision made by the top service A. This approach guarantees that if a trace is sampled, all its {{< tip "spans" "span" >}} will be recorded in the backend. If each service was making its own sampling decision we would rarely get complete traces in the backend.

## Client Sampling Configuration

When using configuration object to instantiate the tracer, the type of sampling can be selected via `sampler.type` and `sampler.param` properties. Jaeger libraries support the following samplers:

* **Constant** (`sampler.type=const`) sampler always makes the same decision for all traces. It either samples all traces (`sampler.param=1`) or none of them (`sampler.param=0`).
* **Probabilistic** (`sampler.type=probabilistic`) sampler makes a random sampling decision with the probability of sampling equal to the value of `sampler.param` property. For example, with `sampler.param=0.1` approximately 1 in 10 traces will be sampled.
* **Rate Limiting** (`sampler.type=ratelimiting`) sampler uses a leaky bucket rate limiter to ensure that traces are sampled with a certain constant rate. For example, when `sampler.param=2.0` it will sample requests with the rate of 2 traces per second.
* **Remote** (`sampler.type=remote`, which is also the default) sampler consults Jaeger agent for the appropriate sampling strategy to use in the current service. This allows controlling the sampling strategies in the services from a [central configuration](#collector-sampling-configuration) in Jaeger backend, or even dynamically (see [Adaptive Sampling](#adaptive-sampling)).

## Collector Sampling Configuration

If your clients are configured to use remote sampling then sampling rates can be centrally controlled via the collectors. In a remote sampling setup a json document is served to the Jaeger client that describes endpoints and their sampling probabilities. This document can be generated two different ways: [periodically loaded from a file](#file-sampling) or [dynamically based on traffic](#adaptive-sampling). The method of document generation is controlled by the environment variable `SAMPLING_CONFIG_TYPE` which can be set to either `file`(default) or `adaptive`.

### File Sampling

Collectors can be instantiated with the `--sampling.strategies-file` option that points to a file containing sampling strategies to be served to Jaeger clients. The option's value can contain a path to a JSON file, which will be automatically reloaded if its contents change, or an HTTP URL from where the file will be periodically retrieved, with reload frequency controlled by the `--sampling.strategies-reload-interval` option.

If no configuration is provided, the collectors will return the default probabilistic sampling policy with probability 0.001 (0.1%) for all services.

Example `strategies.json`:
```json
{
  "service_strategies": [
    {
      "service": "foo",
      "type": "probabilistic",
      "param": 0.8,
      "operation_strategies": [
        {
          "operation": "op1",
          "type": "probabilistic",
          "param": 0.2
        },
        {
          "operation": "op2",
          "type": "probabilistic",
          "param": 0.4
        }
      ]
    },
    {
      "service": "bar",
      "type": "ratelimiting",
      "param": 5
    }
  ],
  "default_strategy": {
    "type": "probabilistic",
    "param": 0.5,
    "operation_strategies": [
      {
        "operation": "/health",
        "type": "probabilistic",
        "param": 0.0
      },
      {
        "operation": "/metrics",
        "type": "probabilistic",
        "param": 0.0
      }
    ]
  }
}
```

`service_strategies` element defines service specific sampling strategies and `operation_strategies` defines operation specific sampling strategies. There are 2 types of strategies possible: `probabilistic` and `ratelimiting` which are described [above](#client-sampling-configuration) (NOTE: `ratelimiting` is not supported for `operation_strategies`). `default_strategy` defines the catch-all sampling strategy that is propagated if the service is not included as part of `service_strategies`.

In the above example:

* All operations of service `foo` are sampled with probability 0.8 except for operations `op1` and `op2` which are probabilistically sampled with probabilities 0.2 and 0.4 respectively.
* All operations for service `bar` are rate-limited at 5 traces per second.
* Any other service will be sampled with probability 0.5 defined by the `default_strategy`.
* The `default_strategy` also includes shared per-operation strategies. In this example we disable tracing on `/health` and `/metrics` endpoints for all services by using probability 0. These per-operation strategies will apply to any new service not listed in the config, as well as to the `foo` and `bar` services unless they define their own strategies for these two operations.

### Adaptive Sampling

Since Jaeger v1.27.

Adaptive sampling works in the Jaeger collector by observing the spans received from services and recalculating sampling probabilities for each service/endpoint combination to ensure that the volume of collected traces matches `--sampling.target-samples-per-second`. When a new service or endpoint is detected, it is initially sampled with `--sampling.initial-sampling-probability` until enough data is collected to calculate the rate appropriate for the traffic going through the endpoint.

Adaptive sampling requires a storage backend to store the observed traffic data and computed probabilities. At the moment `memory` (for all-in-one deployment) and `cassandra` are supported as sampling storage backends. We are seeking help in implementing support for other backends (https://github.com/jaegertracing/jaeger/issues/3305).
