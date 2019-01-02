---
title: Frontend/UI
widescreen: true
hasparent: true
weight: 10
---

## Query Service & UI

**jaeger-query** serves the API endpoints and a React/Javascript UI.
The service is stateless and is typically run behind a load balancer, e.g. nginx.

At default settings the query service exposes the following port(s):

Port  | Protocol | Function
----- | -------  | ---
16686 | HTTP     | **/api/*** endpoints and Jaeger UI at **/**
16687 | HTTP     | Health check at **/**

### UI Base Path

The base path for all **jaeger-query** HTTP routes can be set to a non-root value, e.g. `/jaeger` would cause all UI URLs to start with `/jaeger`. This can be useful when running **jaeger-query** behind a reverse proxy.

The base path can be configured via the `--query.base-path` command line parameter or the `QUERY_BASE_PATH` environment variable.

### UI Configuration

Several aspects of the UI can be configured:

  * The Dependencies section can be enabled / configured
  * Google Analytics tracking can be enabled / configured
  * Additional menu options can be added to the global nav

These options can be configured by a JSON configuration file. The `--query.ui-config` command line parameter of the query service must then be set to the path to the JSON file when the query service is started.

An example configuration file:

```json
{
  "dependencies": {
    "dagMaxNumServices": 200,
    "menuEnabled": true
  },
  "archiveEnabled": true,
  "tracking": {
    "gaID": "UA-000000-2",
    "trackErrors": true
  },
  "menu": [
    {
      "label": "About Jaeger",
      "items": [
        {
          "label": "GitHub",
          "url": "https://github.com/jaegertracing/jaeger"
        },
        {
          "label": "Docs",
          "url": "http://jaeger.readthedocs.io/en/latest/"
        }
      ]
    }
  ]
}
```

`dependencies.dagMaxNumServices` defines the maximum number of services allowed before the DAG dependency view is disabled. Default: `200`.

`dependencies.menuEnabled` enables (`true`) or disables (`false`) the dependencies menu button. Default: `true`.

`archiveEnabled` enables (`true`) or disables (`false`) the archive traces button. Default: `false`. It requires a configuration of an archive storage in Query service. Archived traces are only accessible directly by ID, they are not searchable.

`tracking.gaID` defines the Google Analytics tracking ID. This is required for Google Analytics tracking, and setting it to a non-`null` value enables Google Analytics tracking. Default: `null`.

`tracking.trackErrors` enables (`true`) or disables (`false`) error tracking via Google Analytics. Errors can only be tracked if a valid Google Analytics ID is provided. For additional details on error tracking via Google Analytics see the [tracking README](https://github.com/jaegertracing/jaeger-ui/blob/c622330546afc1be59a42f874bcc1c2fadf7e69a/src/utils/tracking/README.md) in the UI repo. Default: `true`.

`menu` allows additional links to be added to the global nav. The additional links are right-aligned.

In the sample JSON config above, the configured menu will have a dropdown labeled "About Jaeger" with sub-options for "GitHub" and "Docs". The format for a link in the top right menu is as follows:

```json
{
  "label": "Some text here",
  "url": "https://example.com"
}
```

Links can either be members of the `menu` Array, directly, or they can be grouped into a dropdown menu option. The format for a group of links is:

```json
{
  "label": "Dropdown button",
  "items": [ ]
}
```

The `items` Array should contain one or more link configurations.

TODO: Swagger and GraphQL API ([issue 158](https://github.com/jaegertracing/jaeger/issues/158)).

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