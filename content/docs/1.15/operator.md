---
title: Operator for Kubernetes
hasparent: true
---

# Understanding Operators

The Jaeger Operator is an implementation of a [Kubernetes Operator](https://coreos.com/operators/).  Operators are pieces of software that ease the operational complexity of running another piece of software. More technically, _Operators_ are a method of packaging, deploying, and managing a Kubernetes application.

A Kubernetes application is an application that is both deployed on Kubernetes and managed using the Kubernetes APIs and `kubectl` (kubernetes) or `oc` (OKD) tooling. To be able to make the most of Kubernetes, you need a set of cohesive APIs to extend in order to service and manage your apps that run on Kubernetes. Think of Operators as the runtime that manages this type of app on Kubernetes.

# Installing the Operator

{{< info >}}
The Jaeger Operator version tracks one version of the Jaeger components (Query, Collector, Agent). When a new version of the Jaeger components is released, a new version of the operator will be released that understands how running instances of the previous version can be upgraded to the new version.
{{< /info >}}

## Installing the Operator on Kubernetes

The following instructions will create the `observability` namespace and install the Jaeger Operator.

{{< info >}}
Make sure your `kubectl` command is properly configured to talk to a valid Kubernetes cluster. If you don't have a cluster, you can create one locally using [`minikube`](https://kubernetes.io/docs/tasks/tools/install-minikube/).
{{< /info >}}

To install the operator, run:
<!--TODO - Does Kubernetes have privileged users? Needs to be run as a system:admin on OKD/OpenShift.-->

```bash
kubectl create namespace observability # <1>
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/crds/jaegertracing.io_jaegers_crd.yaml # <2>
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/service_account.yaml
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role.yaml
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role_binding.yaml
kubectl create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/operator.yaml
```
<1> This creates the namespace used by default in the deployment files. If you want to install the Jaeger operator in a different namespace, you must edit the deployment files to change `observability` to the desired namespace value.

<2> This installs the "Custom Resource Definition" for the `apiVersion: jaegertracing.io/v1`

At this point, there should be a `jaeger-operator` deployment available.  You can view it by running the following command:

```bash
$ kubectl get deployment jaeger-operator -n observability

NAME              DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
jaeger-operator   1         1         1            1           48s
```

The operator is now ready to create Jaeger instances.

## Installing the Operator on OKD/OpenShift

<!-- TODO: Add instructions for installing via the operatorhub? -->

The instructions from the previous section also work for installing the operator on OKD or OpenShift. Make sure you are logged in as a privileged user, when you install the role based acces control (RBAC) rules, the custom resource definition, and the operator.

```bash
oc login -u <privileged user>

oc new-project observability # <1>
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/crds/jaegertracing.io_jaegers_crd.yaml # <2>
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/service_account.yaml
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role.yaml
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role_binding.yaml
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/operator.yaml
```
<1> This creates the namespace used by default in the deployment files. If you want to install the Jaeger operator in a different namespace, you must edit the deployment files to change `observability` to the desired namespace value.

<2> This installs the "Custom Resource Definition" for the `apiVersion: jaegertracing.io/v1`

Once the operator is installed, grant the role `jaeger-operator` to users who should be able to install individual Jaeger instances. The following example creates a role binding allowing the user `developer` to create Jaeger instances:

```bash
oc create \
  rolebinding developer-jaeger-operator \
  --role=jaeger-operator \
  --user=developer
```

After the role is granted, switch back to a non-privileged user.

# Quick Start - Deploying the AllInOne image

The simplest possible way to create a Jaeger instance is by creating a YAML file like the following example.  This will install the default AllInOne strategy, which deploys the "all-in-one" image (agent, collector, query, ingester, Jaeger UI) in a single pod, using in-memory storage by default.

{{< info >}}
This default strategy is intended for development, testing, and demo purposes, not for production.
{{< /info >}}

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: simplest
```

The YAML file can then be used with `kubectl`:
<!-- TODO - Add OKD commands and tabs shortcode. -->

```bash
kubectl apply -f simplest.yaml
```

In a few seconds, a new in-memory all-in-one instance of Jaeger will be available, suitable for quick demos and development purposes. To check the instances that were created, list the `jaeger` objects:

```bash
$ kubectl get jaegers
NAME        CREATED AT
simplest    28s
```

To get the pod name, query for the pods belonging to the `simplest` Jaeger  instance:


```bash
$ kubectl get pods -l app.kubernetes.io/instance=simplest
NAME                        READY     STATUS    RESTARTS   AGE
simplest-6499bb6cdd-kqx75   1/1       Running   0          2m
```

Similarly, the logs can be queried either from the pod directly using the pod name obtained from the previous example, or from all pods belonging to our instance:

```bash
$ kubectl logs -l app.kubernetes.io/instance=simplest
...
{"level":"info","ts":1535385688.0951214,"caller":"healthcheck/handler.go:133","msg":"Health Check state change","status":"ready"}
```

{{< info >}}
On OKD/OpenShift the container name must be specified.
{{< /info >}}

```bash
$ kubectl logs -l app.kubernetes.io/instance=simplest -c jaeger
...
{"level":"info","ts":1535385688.0951214,"caller":"healthcheck/handler.go:133","msg":"Health Check state change","status":"ready"}
```

# Deployment Strategies

When you create a Jaeger instance, it is associated with a strategy.  The strategy is defined in the custom resource file, and determines the architecture to be used for the Jaeger backend.  The default strategy is `allInOne`. The other possible values are `production` and `streaming`.

The available strategies are described in the following sections.

## AllInOne (Default) strategy

This strategy is intended for development, testing, and demo purposes.

The main backend components, agent, collector and query service, are all packaged into a single executable which is configured (by default) to use in-memory storage.

## Production strategy

The `production` strategy is intended (as the name suggests) for production environments, where long term storage of trace data is important, as well as a more scalable and highly available architecture is required. Each of the backend components is therefore separately deployed.

The agent can be injected as a sidecar on the instrumented application or as a daemonset.

The query and collector services are configured with a supported storage type - currently Cassandra or Elasticsearch. Multiple instances of each of these components can be provisioned as required for performance and resilience purposes.

The main additional requirement is to provide the details of the storage type and options, for example:

```yaml
    storage:
      type: elasticsearch
      options:
        es:
          server-urls: http://elasticsearch:9200
```

## Streaming strategy

The `streaming` strategy is designed to augment the `production` strategy by providing a streaming capability that effectively sits between the collector and the backend storage (Cassandra or Elasticsearch). This provides the benefit of reducing the pressure on the backend storage, under high load situations, and enables other trace post-processing capabilities to tap into the real time span data directly from the streaming platform (Kafka).

The only additional information required is to provide the details for accessing the Kafka platform, which is configured in the `collector` component (as producer) and `ingester` component (as consumer):

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: simple-streaming
spec:
  strategy: streaming
  collector:
    options:
      kafka: # <1>
        producer:
          topic: jaeger-spans
          brokers: my-cluster-kafka-brokers.kafka:9092
  ingester:
    options:
      kafka: # <1>
        consumer:
          topic: jaeger-spans
          brokers: my-cluster-kafka-brokers.kafka:9092
      ingester:
        deadlockInterval: 0 # <2>
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200
```
<1> Identifies the Kafka configuration used by the collector, to produce the messages, and the ingester to consume the messages.

<2> The deadlock interval can be disabled to avoid the ingester being terminated when no messages arrive within the default 1 minute period

{{< info >}}
A Kafka environment can be configured using [Strimzi's Kafka operator](https://strimzi.io/).
{{< /info >}}

# Understanding Custom Resource Definitions

In the Kubernetes API, a resource is an endpoint that stores a collection of API objects of a certain kind. For example, the built-in Pods resource contains a collection of Pod objects. A _Custom Resource Definition_ (CRD) object defines a new, unique object `Kind` in the cluster and lets the Kubernetes API server handle its entire lifecycle.

To create _Custom Resource_ (CR) objects, cluster administrators must first create a Custom Resource Definition (CRD). The CRDs allow cluster users to create CRs to add the new resource types into their projects. An Operator watches for custom resource objects to be created, and when it sees a custom resource being created, it creates the application based on the parameters defined in the custom resource object.

{{< info >}}
While only cluster administrators can create CRDs, developers can create the CR from an existing CRD if they have read and write permission to it.
{{< /info >}}

<!--
## Jaeger Custom Resource Parameters

TODO Create a TABLE  with all the parameters, descriptions/notes, valid values, and defaults.
Figure out if we can generate the options?  Can we filter them in any way?
https://github.com/jaegertracing/jaeger/issues/1537
https://github.com/jaegertracing/documentation/issues/250-->

For reference, here's how you can create a more complex all-in-one instance:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: my-jaeger
spec:
  strategy: allInOne # <1>
  allInOne:
    image: jaegertracing/all-in-one:latest # <2>
    options: # <3>
      log-level: debug # <4>
  storage:
    type: memory # <5>
    options: # <6>
      memory: # <7>
        max-traces: 100000
  ingress:
    enabled: false # <8>
  agent:
    strategy: DaemonSet # <9>
  annotations:
    scheduler.alpha.kubernetes.io/critical-pod: "" # <10>
```

<1> The default strategy is `allInOne`. The other possible values are `production` and `streaming`.

<2> The image to use, in a regular Docker syntax.

<3> The (non-storage related) options to be passed verbatim to the underlying binary. Refer to the Jaeger documentation and/or to the `--help` option from the related binary for all the available options.

<4> The option is a simple `key: value` map. In this case, we want the option `--log-level=debug` to be passed to the binary.

<5> The storage type to be used. By default it will be `memory`, but can be any other supported storage type (Cassandra, Elasticsearch, Kafka).

<6> All storage related options should be placed here, rather than under the 'allInOne' or other component options.

<7> Some options are namespaced and we can alternatively break them into nested objects. We could have specified `memory.max-traces: 100000`.

<8> By default, an ingress object is created for the query service. It can be disabled by setting its `enabled` option to `false`. If deploying on OpenShift, this will be represented by a Route object.

<9> By default, the operator assumes that agents are deployed as sidecars within the target pods. Specifying the strategy as "DaemonSet" changes that and makes the operator deploy the agent as DaemonSet. Note that your tracer client will probably have to override the "JAEGER_AGENT_HOST" environment variable to use the node's IP.

<10> Define annotations to be applied to all deployments (not services). These can be overridden by annotations defined on the individual components.

You can view example custom resources for different Jaeger configurations [on GitHub](https://github.com/jaegertracing/jaeger-operator/tree/master/deploy/examples).

# Configuring the Custom Resource

<!--TODO
esIndexCleaner
Spark dependencies
-->

You can use the simplest example (shown above) and create a Jaeger instance using the defaults, or you can create your own custom resource file.

## Storage options

### Cassandra storage

When the storage type is set to Cassandra, the operator will automatically create a batch job that creates the required schema for Jaeger to run. This batch job will block the Jaeger installation, so that it starts only after the schema is successfuly created. The creation of this batch job can be disabled by setting the `enabled` property to `false`:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: cassandra-without-create-schema
spec:
  strategy: allInOne
  storage:
    type: cassandra
    cassandraCreateSchema:
      enabled: false # <1>
```
<1> Defaults to `true`

Further aspects of the batch job can be configured as well. An example with all the possible options is shown below:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: cassandra-with-create-schema
spec:
  strategy: allInOne # <1>
  storage:
    type: cassandra
    options: # <2>
      cassandra:
        servers: cassandra
        keyspace: jaeger_v1_datacenter3
    cassandraCreateSchema: # <3>
      datacenter: "datacenter3"
      mode: "test"
```
<1> The same works for `production` and `streaming`.

<2> These options are for the regular Jaeger components, like `collector` and `query`.

<3> The options for the `create-schema` job.

{{< info >}}
The default create-schema job uses `MODE=prod`, which implies a replication factor of `2`, using `NetworkTopologyStrategy` as the class, effectively meaning that at least 3 nodes are required in the Cassandra cluster. If a `SimpleStrategy` is desired, set the mode to `test`, which then sets the replication factor of `1`. Refer to the [create-schema script](https://github.com/jaegertracing/jaeger/blob/master/plugin/storage/cassandra/schema/create.sh) for more details.
{{< /info >}}

### Elasticsearch storage

By default Elasticsearch storage does not require any initialization job to be run. However Elasticsearch
storage requires a cron job to be run to clean old data from the storage.
 
When rollover (`es.use-aliases`) is enabled, Jaeger operator also deploys a job to initialize Elasticsearch storage
and another two cron jobs to perform required index management actions.

#### External Elasticsearch

Jaeger can be used with an external Elasticsearch cluster.
The following example shows a Jaeger CR using an external Elasticsearch cluster
with TLS CA certificate mounted from a volume and user/password stored in a secret.

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: simple-prod
spec:
  strategy: production
  storage:
    type: elasticsearch # <1>
    options:
      es:
        server-urls: https://elasticsearch.default.svc:9200 # <2>
        tls: # <3>
          ca: /es/certificates/root-ca.pem
    secretName: jaeger-secret # <4>
  volumeMounts: # <5>
    - name: certificates
      mountPath: /es/certificates/
      readOnly: true
  volumes:
    - name: certificates
      secret:
        secretName: quickstart-es-http-certs-public
```

<1> Storage type Elasticsearch.

<2> Url to Elasticsearch service running in default namespace.

<3> TLS configuration. In this case only CA certificate, but it can also contain `es.tls.key` and `es.tls.cert` when using mutual TLS.

<4> Secret which defines environment variables `ES_PASSWORD` and `ES_USERNAME`. Created by `kubectl create secret generic jaeger-secret --from-literal=ES_PASSWORD=changeme --from-literal=ES_USERNAME=elastic`

<5> Volume mounts and volumes which are mounted into all storage components.

#### Self provisioned
Under some circumstances, the Jaeger Operator can make use of the [Elasticsearch Operator](https://github.com/openshift/elasticsearch-operator) to provision a suitable Elasticsearch cluster.

{{< warning >}}
This feature is supported only on OKD/OpenShift clusters. Spark dependencies are not supported with this feature [Issue #294](https://github.com/jaegertracing/jaeger-operator/issues/294).
{{< /warning >}}

When there is no `es.server-urls` option as part of a Jaeger `production` instance and `elasticsearch` is set as the storage type, the Jaeger Operator creates an Elasticsearch cluster via the Elasticsearch Operator by creating a Custom Resource based on the configuration provided in storage section. The Elasticsearch cluster is meant to be dedicated for a single Jaeger instance.

The self-provision of an Elasticsearch cluster can be disabled by setting the flag `--es-provision` to `false`. The default value is `auto`, which will make the Jaeger Operator query the Kubernetes cluster for its ability to handle a `Elasticsearch` custom resource. This is usually set by the Elasticsearch Operator during its installation process, so, if the Elasticsearch Operator is expected to run *after* the Jaeger Operator, the flag can be set to `true`.

{{< danger >}}
At the moment there can be only one Jaeger with self-provisioned Elasticsearch instance per namespace.
{{< /danger >}}

#### Elasticsearch index cleaner job

When using `elasticsearch` storage by default a cron job is created to clean old traces from it, the options for it are listed below so you can configure it to your use case.
The connection configuration is derived from the storage options.

```yaml
storage:
  type: elasticsearch
  esIndexCleaner:
    enabled: true                                 // turn the cron job deployment on and off
    numberOfDays: 7                               // number of days to wait before deleting a record
    schedule: "55 23 * * *"                       // cron expression for it to run
```

The connection configuration to storage is derived from storage options.

#### Elasticsearch rollover

This index management strategy is more complicated than using the default daily indices and
it requires an initialisation job to prepare the storage and two cron jobs to manage indices.
The first cron job is used for rolling-over to a new index and the second for removing
indices from read alias. The rollover feature is used when storage option `es.use-aliases` is enabled.

To learn more about rollover index management in Jaeger refer to this
[article](https://medium.com/jaegertracing/using-elasticsearch-rollover-to-manage-indices-8b3d0c77915d).

```yaml
storage:
  type: elasticsearch
  options:
    es:
      use-aliases: true
  esRollover:
    enabled: true                                // turn the cron job deployment on and off
    conditions: "{\"max_age\": \"2d\"}"          // conditions when to rollover to a new index
    readTTL: 7d                                  // how long should be old data available for reading
    schedule: "55 23 * * *"                      // cron expression for it to run
```

The connection configuration to storage is derived from storage options.

## Deriving dependencies

The processing to derive dependencies will collect spans from storage, analyzes links between services and store them for later presentation in the UI.
This job can only be used with the `production` strategy and storage type `cassandra` or `elasticsearch`.

```yaml
storage:
  type: elasticsearch
  dependencies:
    enabled: true                                 // turn the job deployment on and off
    schedule: "55 23 * * *"                       // cron expression for it to run
    sparkMaster:                                  // spark master connection string, when empty spark runs in embedded local mode
```

The connection configuration to storage is derived from storage options.

## Auto-injecting Jaeger Agent Sidecars

The operator can inject Jaeger Agent sidecars in `Deployment` workloads, provided that the deployment has the annotation `sidecar.jaegertracing.io/inject` with a suitable value. The values can be either `"true"` (as string), or the Jaeger instance name, as returned by `kubectl get jaegers`. When `"true"` is used, there should be exactly *one* Jaeger instance for the same namespace as the deployment, otherwise, the operator can't figure out automatically which Jaeger instance to use.

The following snippet shows a simple application that will get a sidecar injected, with the Jaeger Agent pointing to the single Jaeger instance available in the same namespace:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  annotations:
    "sidecar.jaegertracing.io/inject": "true" # <1>
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: acme/myapp:myversion
```
<1> Either `"true"` (as string) or the Jaeger instance name.

A complete sample deployment is available at [`deploy/examples/business-application-injected-sidecar.yaml`](https://github.com/jaegertracing/jaeger-operator/blob/master/deploy/examples/business-application-injected-sidecar.yaml).

When the sidecar is injected, the Jaeger Agent can then be accessed at its default location on `localhost`.

## Installing the Agent as DaemonSet
By default, the Operator expects the agents to be deployed as sidecars to the target applications. This is convenient for several purposes, like in a multi-tenant scenario or to have better load balancing, but there are scenarios where you might want to install the agent as a `DaemonSet`. In that case, specify the Agent's strategy to `DaemonSet`, as follows:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: my-jaeger
spec:
  agent:
    strategy: DaemonSet
```

{{< danger >}}
If you attempt to install two Jaeger instances on the same cluster with `DaemonSet` as the strategy, only *one* will end up deploying a `DaemonSet`, as the agent is required to bind to well-known ports on the node. Because of that, the second daemon set will fail to bind to those ports.
{{< /danger >}}

Your tracer client will then most likely need to be told where the agent is located. This is usually done by setting the environment variable `JAEGER_AGENT_HOST` to the value of the Kubernetes node's IP, for example:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
      - name: myapp
        image: acme/myapp:myversion
        env:
        - name: JAEGER_AGENT_HOST
          valueFrom:
            fieldRef:
              fieldPath: status.hostIP
```

### OpenShift

In OpenShift, a `HostPort` can only be set when a special security context is set. A separate service account can be used by the Jaeger Agent with the permission to bind to `HostPort`, as follows:

```bash
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/examples/openshift/hostport-scc-daemonset.yaml # <1>
oc new-project myappnamespace
oc create -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/examples/openshift/service_account_jaeger-agent-daemonset.yaml # <2>
oc adm policy add-scc-to-user daemonset-with-hostport -z jaeger-agent-daemonset # <3>
oc apply -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/examples/openshift/agent-as-daemonset.yaml # <4>
```
<1> The `SecurityContextConstraints` with the `allowHostPorts` policy

<2> The `ServiceAccount` to be used by the Jaeger Agent

<3> Adds the security policy to the service account

<4> Creates the Jaeger Instance using the `serviceAccount` created in the steps above

{{< warning >}}
Without such a policy, errors like the following will prevent a `DaemonSet` to be created: `Warning FailedCreate 4s (x14 over 45s) daemonset-controller Error creating: pods "agent-as-daemonset-agent-daemonset-" is forbidden: unable to validate against any security context constraint: [spec.containers[0].securityContext.containers[0].hostPort: Invalid value: 5775: Host ports are not allowed to be used`
{{< /warning >}}

After a few seconds, the `DaemonSet` should be up and running:

```bash
$ oc get daemonset agent-as-daemonset-agent-daemonset
NAME                                 DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE
agent-as-daemonset-agent-daemonset   1         1         1         1            1
```

## Secrets Support

The Operator supports passing secrets to the Collector, Query and All-In-One deployments. This can be used for example, to pass credentials (username/password) to access the underlying storage backend (for example: Elasticsearch).
The secrets are available as environment variables in the (Collector/Query/All-In-One) nodes.

```yaml
    storage:
      type: elasticsearch
      options:
        es:
          server-urls: http://elasticsearch:9200
      secretName: jaeger-secrets
```

The secret itself would be managed outside of the `jaeger-operator` custom resource.

## Configuring the UI

Information on various configuration options for the UI can be found [here](../frontend-ui/#configuration), defined in json format.

To apply UI configuration changes within the Custom Resource, the same information can be included in yaml format as shown below:

```yaml
    ui:
      options:
        dependencies:
          menuEnabled: false
        tracking:
          gaID: UA-000000-2
        menu:
        - label: "About Jaeger"
          items:
            - label: "Documentation"
              url: "https://www.jaegertracing.io/docs/latest"
        linkPatterns:
        - type: "logs"
          key: "customer_id"
          url: /search?limit=20&lookback=1h&service=frontend&tags=%7B%22customer_id%22%3A%22#{customer_id}%22%7D
          text: "Search for other traces for customer_id=#{customer_id}"
```

## Defining Sampling Strategies

{{< info >}}
This is not relevant if a trace was started by the Istio proxy as the sampling decision is made there. And the Jaeger sampling decisions are only relevant when you are using the Jaeger tracer (client).
{{< /info >}}

The operator can be used to define sampling strategies that will be supplied to tracers that have been configured to use a remote sampler:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: with-sampling
spec:
  strategy: allInOne
  sampling:
    options:
      default_strategy:
        type: probabilistic
        param: 0.5
```

This example defines a default sampling strategy that is probabilistic, with a 50% chance of the trace instances being sampled.

Refer to the Jaeger documentation on [Collector Sampling Configuration](https://www.jaegertracing.io/docs/latest/sampling/#collector-sampling-configuration) to see how service and endpoint sampling can be configured. The JSON representation described in that documentation can be used in the operator by converting to YAML.

## Finer grained configuration

The custom resource can be used to define finer grained Kubernetes configuration applied to all Jaeger components or at the individual component level.

When a common definition (for all Jaeger components) is required, it is defined under the `spec` node. When the definition relates to an individual component, it is placed under the `spec/<component>` node.

The types of supported configuration  include:

* [affinity](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity) to determine which nodes a pod can be allocated to

* [annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/)

* [labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/)

* [resources](https://kubernetes.io/docs/concepts/configuration/manage-compute-resources-container) to limit cpu and memory

* [tolerations](https://kubernetes.io/docs/concepts/configuration/taint-and-toleration/) in conjunction with `taints` to enable pods to avoid being repelled from a node

* [volumes](https://kubernetes.io/docs/concepts/storage/volumes/) and volume mounts

* [serviceAccount](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/) to run each component with separate identity

* [securityContext](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) to define privileges of running components

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: simple-prod
spec:
  strategy: production
  storage:
    type: elasticsearch
    options:
      es:
        server-urls: http://elasticsearch:9200
  annotations:
    key1: value1
  labels:
    key2: value2
  resources:
    requests:
      memory: "64Mi"
      cpu: "250m"
    limits:
      memory: "128Mi"
      cpu: "500m"
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: kubernetes.io/e2e-az-name
            operator: In
            values:
            - e2e-az1
            - e2e-az2
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 1
        preference:
          matchExpressions:
          - key: another-node-label-key
            operator: In
            values:
            - another-node-label-value
  tolerations:
    - key: "key1"
      operator: "Equal"
      value: "value1"
      effect: "NoSchedule"
    - key: "key1"
      operator: "Equal"
      value: "value1"
      effect: "NoExecute"
  serviceAccount: nameOfServiceAccount
  securityContext:
    runAsUser: 1000
  volumeMounts:
    - name: config-vol
      mountPath: /etc/config
  volumes:
    - name: config-vol
      configMap:
        name: log-config
        items:
          - key: log_level
            path: log_level
```

# Accessing the Jaeger Console (UI)
<!-- TODO Add tabs shortcode -->

## Kubernetes

The operator creates a Kubernetes [`ingress`](https://kubernetes.io/docs/concepts/services-networking/ingress/) route, which is the Kubernetes' standard for exposing a service to the outside world, but by default it does not come with Ingress providers.
Check the [Kubernetes documentation](https://kubernetes.github.io/ingress-nginx/deploy/#verify-installation) for the most appropriate way to achieve an Ingress provider for your platform.  The following command enables the Ingress provider on `minikube`:

```bash
minikube addons enable ingress
```

Once Ingress is enabled, the address for the Jaeger console can be found by querying the Ingress object:

```bash
$ kubectl get ingress
NAME             HOSTS     ADDRESS          PORTS     AGE
simplest-query   *         192.168.122.34   80        3m
```

In this example, the Jaeger UI is available at http://192.168.122.34.

To enable TLS in the Ingress, pass a `secretName` with the name of a [Secret](https://kubernetes.io/docs/concepts/configuration/secret/) containing the TLS certificate:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: ingress-with-tls
spec:
  ingress:
    secretName: my-tls-secret
```

## OpenShift

When the Operator is running on OpenShift, the Operator will automatically create a `Route` object for the query services. Use the following command to check the hostname/port:

```bash
oc get routes
```

{{< info >}}
Make sure to use `https` with the hostname/port you get from the command above, otherwise you'll see a message like: "Application is not available".
{{< /info >}}

By default, the Jaeger UI is protected with OpenShift's OAuth service and any valid user is able to login. To disable this feature and leave the Jaeger UI unsecured, set the Ingress property `security` to `none` in the custom resource file:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: disable-oauth-proxy
spec:
  ingress:
    security: none
```

Custom `SAR` and `Delegate URL` values can be specified as part of the `.Spec.Ingress.OpenShift.SAR` and `.Spec.Ingress.Openshift.DelegateURLs`, as follows:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: custom-sar-oauth-proxy
spec:
  ingress:
    openshift:
      sar: '{"namespace": "default", "resource": "pods", "verb": "get"}'
      delegateUrls: '{"/":{"namespace": "default", "resource": "pods", "verb": "get"}}'
```

When the `delegateUrls` is set, the Jaeger Operator needs to create a new `ClusterRoleBinding` between the service account used by the UI Proxy (`{InstanceName}-ui-proxy`) and the role `system:auth-delegator`, as required by the OpenShift OAuth Proxy. Because of that, the service account used by the operator itself needs to have the same cluster role binding. To accomplish that, a `ClusterRoleBinding` such as the following has to be created:

```yaml
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: jaeger-operator-with-auth-delegator
  namespace: observability
subjects:
- kind: ServiceAccount
  name: jaeger-operator
  namespace: observability
roleRef:
  kind: ClusterRole
  name: system:auth-delegator
  apiGroup: rbac.authorization.k8s.io
```

Cluster administrators not comfortable in letting users deploy Jaeger instances with this cluster role are free to not add this cluster role to the operator's service account. In that case, the Operator will auto-detect that the required permissions are missing and will log a message similar to: `the requested instance specifies the delegateUrls option for the OAuth Proxy, but this operator cannot assign the proper cluster role to it (system:auth-delegator). Create a cluster role binding between the operator's service account and the cluster role 'system:auth-delegator' in order to allow instances to use 'delegateUrls'`.

The Jaeger Operator also supports authentication using `htpasswd` files via the OpenShift OAuth Proxy. To make use of that, specify the `htpasswdFile` option within the OpenShift-specific entries, pointing to the file `htpasswd` file location in the local disk. The `htpasswd` file can be created using the `htpasswd` utility:

```console
$ htpasswd -cs /tmp/htpasswd jdoe
New password:
Re-type new password:
Adding password for user jdoe
```

This file can then be used as the input for the `kubectl create secret` command:

```console
$ kubectl create secret generic htpasswd --from-file=htpasswd=/tmp/htpasswd
secret/htpasswd created
```

Once the secret is created, it can be specified in the Jaeger CR as a volume/volume mount:

```yaml
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: with-htpasswd
spec:
  ingress:
    openshift:
      sar: '{"namespace": "default", "resource": "pods", "verb": "get"}'
      htpasswdFile: /usr/local/data/htpasswd
  volumeMounts:
  - name: htpasswd-volume
    mountPath: /usr/local/data
  volumes:
  - name: htpasswd-volume
    secret:
      secretName: htpasswd
```

# Upgrading the Operator and its managed instances

Each version of the Jaeger Operator follows one Jaeger version. Whenever a new version of the Jaeger Operator is installed, all the Jaeger instances managed by the operator will be upgraded to the Operator's supported version. For example, an instance named `simplest` that was created with Jaeger Operator 1.12.0 will be running Jaeger 1.12.0. Once the Jaeger Operator is upgraded to 1.13.0, the instance `simplest` will be upgraded to the version 1.13.0, following the official upgrade instructions from the Jaeger project.

The Jaeger Operator can be upgraded manually by changing the deployment (`kubectl edit deployment jaeger-operator`), or via specialized tools such as the [Operator Lifecycle Manager (OLM)](https://github.com/operator-framework/operator-lifecycle-manager).

# Updating a Jaeger instance (experimental)

A Jaeger instance can be updated by changing the `CustomResource`, either via `kubectl edit jaeger simplest`, where `simplest` is the Jaeger's instance name, or by applying the updated YAML file via `kubectl apply -f simplest.yaml`.

{{< danger >}}
The name of the Jaeger instance cannot be updated, as it is part of the identifying information for the resource.
{{< /danger >}}

Simpler changes such as changing the replica sizes can be applied without much concern, whereas changes to the strategy should be watched closely and might potentially cause an outage for individual components (collector/query/agent).

While changing the backing storage is supported, migration of the data is not.

# Removing a Jaeger instance
<!-- TODO Add OKD/OpenShift commands and tabs shortcode-->

To remove an instance, use the `delete` command with the custom resource file used when you created the instance:

```bash
kubectl delete -f simplest.yaml
```

Alternatively, you can remove a Jaeger instance by running:

```bash
kubectl delete jaeger simplest
```

{{< info >}}
Deleting the instance will not remove the data from any permanent storage used with this instance. Data from in-memory instances, however, will be lost.
{{< /info >}}

# Monitoring the operator

The Jaeger Operator starts a Prometheus-compatible endpoint on `0.0.0.0:8383/metrics` with internal metrics that can be used to monitor the process.

{{< info >}}
The Jaeger Operator does not yet publish its own metrics. Rather, it makes available metrics reported by the components it uses, such as the Operator SDK.
{{< /info >}}

# Uninstalling the operator
<!-- TODO Add OKD/OpenShift commands and tabs shortcode -->

To uninstall the operator, run the following commands:

```bash
kubectl delete -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/operator.yaml
kubectl delete -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role_binding.yaml
kubectl delete -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/role.yaml
kubectl delete -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/service_account.yaml
kubectl delete -f https://raw.githubusercontent.com/jaegertracing/jaeger-operator/master/deploy/crds/jaegertracing.io_jaegers_crd.yaml
```
