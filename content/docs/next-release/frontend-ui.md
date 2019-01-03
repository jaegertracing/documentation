---
title: Frontend/UI
widescreen: true
hasparent: true
weight: 10
---

## Embed Mode

Starting with version **[TODO]**, Jaeger UI provides an "embedded" layout mode which is intended to support integrating Jaeger UI into other applications. Currently (as of `v0`), the approach taken is to remove various UI elements from the page to make the UI better suited for space-constrained layouts.

The embedded mode is induced and configured via URL query parameters.

To enter embedded mode, the `uiEmbed=v0` query parameter and value must be added to the URL. For example, the following URL will show the trace with ID `abc123` in embedded mode:

```
https://example.com/trace/abc123?uiEmbed=v0
```

`uiEmbed=v0` is required.

Further, each page supported has an <img src="/img/frontend-ui/embed-open-icon.png" style="width: 20px; height:20px;display:inline;" alt="Embed open window"> button added that will open the non-embedded page in a new tab.


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

![Embed Search Traces](/img/frontend-ui/embed-search-traces.png)

##### Configuration options

The following query parameter can be used to configure the layout of the search page :

* uiSearchHideGraph=1   
  * Do not display the scatter plot above the search results

```sh
<JAEGER UI URL>/search?
    end=1543921359557000&
    limit=20&lookback=1h&
    maxDuration&
    minDuration&
    service=jaeger-query&
    start=1543917759557000&
    uiEmbed=v0&
    uiSearchHideGraph=1
```

![Embed Search Traces without Graph](/img/frontend-ui/embed-search-traces-hide-graph.png)

#### Trace Page


To integrate the Trace Page to our application we have to indicate to the Jaeger UI that we want to use the embed mode with `uiEmbed=v0`. 

For example:

```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0
```
![Embed Trace view](/img/frontend-ui/embed-trace-view.png)

If we have navigated to this view from the search traces page we'll have a button to go back to the results page.

![Embed Trace view](/img/frontend-ui/embed-trace-view-with-back-button.png)

##### Configuration options

The following query parameters can be used to configure the layout of the trace page :

* uiTimelineCollapseTitle=1 
  * The trace header starts out collapsed, which hides the summary and minimap
  
```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineCollapseTitle=1
```
![Embed Trace view](/img/frontend-ui/embed-trace-view-with-collapse.png)

* uiTimelineHideMinimap=1
  * Removes the minimap, entirely, regardless of whether the trace header is expanded or not

```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineHideMinimap=1
```
![Embed Trace view](/img/frontend-ui/embed-trace-view-with-hide-minimap.png)

* uiTimelineHideSummary=1
 * Removes the trace summary information (number of services, etc.), entirely, regardless of whether the trace header is expanded or not

```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineHideSummary=1
    
```  
![Embed Trace view](/img/frontend-ui/embed-trace-view-with-hide-summary.png)

We can also combine the options
```sh
<JAEGER UI URL>/trace/<TRACE ID>?
    uiEmbed=v0&
    uiTimelineHideMinimap=1&
    uiTimelineHideSummary=1
```
![Embed Trace view](/img/frontend-ui/embed-trace-view-with-hide-details-and-hide-minimap.png)