---
title: Interface
weight: 10
---

Jaeger Web UI is implemented in Javascript using popular open source frameworks like React. Several performance improvements have been released in v1.0 to allow the UI to efficiently deal with large volumes of data, and to display traces with tens of thousands of spans (e.g. we tried a trace with 80,000 spans).

## Embed Mode

Enhancement to embed mode in Jaeger UI for some components allowing us to integrate it into other applications.
For use this feature we need to pass in the query params the param **uiEmbed** with the value **vN**, where **N** represents the version.


### Embedded Components

* Search Trace Page
* Trace Page

#### Search Trace Page

To integrate the Search Trace Page to our application we have to indicate to the Jaeger UI that we want to use the embed mode with `uiEmbed=v0`. 

For example:

```sh
<JAEGER UI URL>/search?
    end=1543921359557000&
    limit=20&lookback=1h&
    maxDuration&
    minDuration&
    service=jaeger-query&
    start=1543917759557000&
    uiEmbed=v0
```

![Embed Search Traces](/img/interface/embed-search-traces.png)

We have a button in this kind of view that redirect us to the search traces page in the Jaeger Site <img src="/img/interface/embed-open-icon.png" style="width: 20px; height:20px; display:inline;" alt="Embed open window">.  

##### Optionally

We can use an extra options in the embed mode :

* uiSearchHideGraph=1   `Hide the ScatterPlot Graph of Search Traces`

```sh
<JAEGER UI URL>/search?
    end=1543921359557000&
    limit=20&lookback=1h&
    maxDuration&
    minDuration&
    service=jaeger-query&
    start=1543917759557000&
    uiEmbed=v0&
    uiSearchHideGraph=1s
```

![Embed Search Traces without Graph](/img/interface/embed-search-traces-hide-graph.png)

#### Trace Page


To integrate the Trace Page to our application we have to indicate to the Jaeger UI that we want to use the embed mode with `uiEmbed=v0`. 

For example:

```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0
```
![Embed Trace view](/img/interface/embed-trace-view.png)

If we have navigated to this view from the search traces page we'll have a button to go back to the results page.

![Embed Trace view](/img/interface/embed-trace-view-with-back-button.png)

We have a new button in this kind of view that redirect us to the trace page in the Jaeger Site <img src="/img/interface/embed-open-icon.png" style="width: 20px; height:20px; display:inline;" alt="Embed open window">.

##### Optionally

We can use an extra options in the embed mode :

* uiTimelineShowMap = 1 `Show the mini map of the trace`
```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineShowMap=1
```
![Embed Trace view](/img/interface/embed-trace-view-with-minimap.png)

* uiTimelineShowDetails = 1 `Show the details of the trace`

```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineShowDetails=1
```
![Embed Trace view](/img/interface/embed-trace-view-with-details.png)


We can also combine the options
```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineShowDetails=1&
    uiTimelineShowMap=1
```
![Embed Trace view](/img/interface/embed-trace-view-with-details-and-minimap.png)