---
title: 'Jaeger: open source, distributed tracing platform'
linkTitle: Jaeger
description: Monitor and troubleshoot workflows in complex distributed systems
show_banner: true
cascade:
  type: docs # Only when using Docsy theme
  params:
    versions: false
type: home
cSpell:ignore: Dosu
---

{{% blocks/cover title="Jaeger: open source, distributed tracing platform"
  image_anchor="top" height="max" %}}

<div class="display-6">{{% param tagline %}}</div>

<div class="hero-cta mt-5">
  <a class="btn btn-lg btn-secondary" href="docs/{{% param latestV2 %}}/getting-started/">
    <i class="fas fa-play-circle"></i>
    Get started
  </a>
  <a class="btn btn-lg btn-primary" href="download/">
    <i class="fas fa-cloud-download-alt"></i>
    Download
  </a>
  <a class="btn btn-lg btn-primary" href="demo/">
    <i class="fas fa-eye"></i>
    Live Demo
  </a>
</div>

{{% /blocks/cover %}}

{{% blocks/lead color="200" %}}

# Why Jaeger? {.heading-as-display}

Distributed tracing observability platforms, such as Jaeger, are essential for
modern software applications that are architected as microservices. Jaeger maps
the flow of requests and data as they traverse a distributed system. These
requests may make calls to multiple services, which may introduce their own
delays or errors. Jaeger connects the dots between these disparate components,
helping to identify performance bottlenecks, troubleshoot errors, and improve
overall application reliability. Jaeger is 100% open source, cloud native, and
infinitely scalable.

{{% /blocks/lead %}}

{{% blocks/section color="white" type="row features-4" %}}

# With Jaeger you can {.heading-as-display}

{{% blocks/feature icon="fas fa-chart-area" title="Monitor distributed workflows" %}}
{{% /blocks/feature %}}

{{% blocks/feature icon="fas fa-tachometer-alt" title="Find & fix performance bottlenecks" %}}
{{% /blocks/feature %}}

{{% blocks/feature icon="fas fa-code-branch" title="Track down root causes" %}}
{{% /blocks/feature %}}

{{% blocks/feature icon="fas fa-network-wired" title="Analyze service dependencies" %}}
{{% /blocks/feature %}}

{{% /blocks/section %}}

{{% blocks/section color="200" type="row articles-section" %}}

# Latest articles from our [blog]

{{< articles >}}

[blog]: https://medium.com/jaegertracing/latest

{{% /blocks/section %}}

{{% blocks/section color="white" type="row simple-section" %}}

# Welcome to the community!

Jaeger is an open source project with [open governance][]. It is built by
engineers for engineers. We welcome contributions from the community, and we'd
love your help to improve and extend the project. You can
[get involved](/get-involved/) as a contributor, participate in our
[mentorships](/mentorship/), or even become a [maintainer].

[maintainer]:
  https://github.com/jaegertracing/jaeger/blob/main/GOVERNANCE.md#becoming-a-maintainer
[open governance]:
  https://github.com/jaegertracing/jaeger/blob/main/GOVERNANCE.md

{{% /blocks/section %}}

{{% blocks/section color="200" type="cncf" %}}

[![CNCF logo][]](https://www.cncf.io/projects/)

[cncf logo]: /img/cncf-graduated-color.svg

{{% /blocks/section %}}

{{% blocks/section color="white" type="row simple-section" %}}

# Sponsors

The Jaeger maintainers deeply appreciate vital support from the [Cloud Native
Computing Foundation][cncf], our project home. Furthermore, we are grateful to
[Uber] for their initial, project-launching donation, and for the continuous
contributions of software and infrastructure from [1Password], [Codecov.io],
[Dosu], [GitHub], [Google], [Netlify], [Oracle Cloud Infrastructure][oci], and
[Scarf]. Thank you for your generous support.

[cncf]: https://www.cncf.io/
[uber]: https://eng.uber.com/
[1password]: https://1password.com/
[Codecov.io]: https://www.codecov.io/
[dosu]: https://www.dosu.dev/
[github]: https://www.github.com/
[google]: https://www.google.com/
[netlify]: https://www.netlify.com/
[oci]: https://www.oracle.com/cloud
[scarf]: https://www.scarf.sh/

{{% /blocks/section %}}
