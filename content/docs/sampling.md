---
title: Sampling
weight: 9
---

Jaeger libraries implement consistent upfront (or head-based) sampling. For example, assume we have a simple call graph where service A calls service B, and B calls service C: `A -> B -> C`. When service A receives a request that contains no tracing information, Jaeger tracer will start a new {{< tip "trace" >}}, assign it a random trace ID, and make a sampling decision based on the currently installed sampling strategy. The sampling decision will be propagated with the requests to B and to C, so those services will not be making the sampling decision again but instead will respect the decision made by the top service A. This approach guarantees that if a trace is sampled, all its {{< tip "spans" "span" >}} will be recorded in the backend. If each service was making its own sampling decision we would rarely get complete traces in the backend.

## Client Sampling Configuration

When using configuration object to instantiate the tracer, the type of sampling can be selected via `sampler.type` and `sampler.param` properties. Jaeger libraries support the following samplers:

* **Constant** (`sampler.type=const`) sampler always makes the same decision for all traces. It either samples all traces (`sampler.param=1`) or none of them (`sampler.param=0`).
* **Probabilistic** (`sampler.type=probabilistic`) sampler makes a random sampling decision with the probability of sampling equal to the value of `sampler.param` property. For example, with `sampler.param=0.1` approximately 1 in 10 traces will be sampled.
* **Rate Limiting** (`sampler.type=ratelimiting`) sampler uses a leaky bucket rate limiter to ensure that traces are sampled with a certain constant rate. For example, when `sampler.param=2.0` it will sample requests with the rate of 2 traces per second.
* **Remote** (`sampler.type=remote`, which is also the default) sampler consults Jaeger agent for the appropriate sampling strategy to use in the current service. This allows controlling the sampling strategies in the services from a [central configuration](#collector-sampling-configuration) in Jaeger backend, or even dynamically (see [Adaptive Sampling](https://github.com/jaegertracing/jaeger/issues/365)).

### Adaptive Sampler

Adaptive sampler is a composite sampler that combines two functions:

  * It makes sampling decisions on a per-operation basis, i.e. based on {{< tip "span" >}} operation name. This is especially useful in the API services whose endpoints may have very different traffic volumes and using a single probabilistic sampler for the whole service might starve (never sample) some of the low QPS endpoints.
  * It supports a minimum guaranteed rate of sampling, such as always allowing up to N {{< tip "traces" "trace" >}} per seconds and then sampling anything above that with a certain probability (everything is per-operation, not per-service).

Per-operation parameters can be configured statically or pulled periodically from Jaeger backend with the help of Remote sampler. Adaptive sampler is designed to work with the upcoming [Adaptive Sampling](https://github.com/jaegertracing/jaeger/issues/365) feature of the Jaeger backend.

## Collector Sampling Configuration

Collectors can be instantiated with static sampling strategies (which are propagated to the respective service if configured with Remote sampler) via the `--sampling.strategies-file` option. This option requires a path to a json file which have the sampling strategies defined.

Example `strategies.json`
```json
{
  "service_strategies": [
    {
      "service": "foo",
      "type": "probabilistic",
      "param": 0.8
    },
    {
      "service": "bar",
      "type": "ratelimiting",
      "param": 5
    }
  ],
  "default_strategy": {
    "type": "probabilistic",
    "param": 0.5
  }
}
```

`service_strategies` defines service specific sampling strategies. There are 2 types of strategies possible: `probabilistic` and `ratelimiting` which are described [above](#client-sampling-configuration). `default_strategy` defines the catch-all sampling strategy that is propagated if the service is not included as part of `service_strategies`.
