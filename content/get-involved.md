---
title: Get Involved
---

Jaeger is an open source project with [open governance](https://github.com/jaegertracing/jaeger/blob/main/GOVERNANCE.md). We welcome contributions from the community, and we'd love your help to improve and extend the project. Below you will find some ideas for how to get involved with the project. Some of them don't even require any coding. There is also a good
CNCF guide on [how to start contributing to open source and figure out where to begin](https://contribute.cncf.io/contributors/getting-started/).

## Bootcamp

In order to understand the project better and come up with reasonable solutions, it's always helpful to become familiar with Jaeger and its code base. We strongly recommend these steps:

* Go through some Jaeger tutorials, such as [this blog post](https://medium.com/jaegertracing/take-jaeger-for-a-hotrod-ride-233cf43e46c2) or [this video](https://youtu.be/s7IrYt1igSM?si=B3NI6ruohKfSPUCl&t=445).
* Run the [HotROD demo yourself](https://github.com/jaegertracing/jaeger/blob/main/examples/hotrod/README.md). The blogs and videos may be outdated, it's good to get hands on.
* Review the [Jaeger architecture](https://www.jaegertracing.io/docs/latest/architecture/) and understand the components.
* Fork and clone the respective repositories to be able to [build and run the project locally](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING.md#getting-started).
* Learn about contributing with the best practices, including how to [sign your code and contribute](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md#creating-a-pull-request).
* Try to solve some of the [simple open issues](./#help-with-coding) that you can find across Jaeger repositories.

## No-coding involvement

* Join the [online chat room](../get-in-touch/) and help answering questions from the rest of the community.
* Join our [bi-weekly video calls](../get-in-touch/) to discuss issues, large initiatives, or present case studies.
* Help documenting answers to common questions, either in [Jaeger documentation](https://github.com/jaegertracing/documentation) or [Stackoverflow](https://stackoverflow.com/questions/tagged/jaeger).
* Help improving [Jaeger documentation](https://github.com/jaegertracing/documentation), especially if you yourself run into issues where something is not clear or not working.
* Publish blog posts or tutorials about Jaeger, for example:
  * What kind of deployment model you chose in your company and why.
  * How to use Jaeger with hosted storage solutions, such as AWS Elasticsearch.
  * What kind of problems you were able to solve with Jaeger in your organization.
  * How did you model traces for non-trivial workflows, like async processing.

  Tips:

  * Tweet about your blog post at [@Jaegertracing](https://twitter.com/jaegertracing) and email to `jaeger-tracing@googlegroups.com`.
  * If your blog is on Medium, reach out to maintainers and we may add it to our [official blog](https://medium.com/jaegertracing).

* Advocate for deploying Jaeger in your company.
* Propose designs for building new capabilities in Jaeger.
* Organize local meetups to explain the benefits of Jaeger and distributed tracing.

## Help with coding

Of course, there's also no shortage of opportunities to help with the actual development of Jaeger. The easiest way to start is with issues labeled as [good-first-issue][]. Note that the Jaeger project includes many different [repositories](https://github.com/jaegertracing/), covering backend components, Jaeger UI, Kubernetes tools, analytics tools, etc. Many of them have these tickets, so pick whichever area interests you the most.

Another label to look for is [help-wanted][], which we use to tag tickets that involve features that maintainers consider promising / useful, but which are not on the immediate roadmap (after all, we all have day jobs with different priorities).

  * Jaeger backend: [good-first-issue](https://github.com/jaegertracing/jaeger/labels/good%20first%20issue), [help-wanted](https://github.com/jaegertracing/jaeger/labels/help%20wanted)
  * Jaeger frontend: [good-first-issue](https://github.com/jaegertracing/jaeger-ui/labels/good%20first%20issue), [help-wanted](https://github.com/jaegertracing/jaeger-ui/labels/help%20wanted)

Please refer to the [Contributing Guidelines](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md) on how to make code contributions. And make sure to follow the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/master/code-of-conduct.md).

### What if someone is already working on a issue?

We have a [policy][not-assigning] of not explicitly assigning the issues to anyone. However, you may find that someone has already created a pull request (it will show in the comments section and/or right below the title of the issue). In such situation, the issue is typically in one of these three states:
  * The PR has recent updates (within a week) from the author, meaning the author is actively working on it. In this case it is best to wait for the author to finish their work.
  * The most recent comments on the PR are from the maintainers recommending some changes, and those comments are not addressed by the author such that the PR appears to be stale. In this case it's good to tag the author in the PR and ask if they are still working on it or if they would like to hand it over to someone else.
  * Sometimes things fall through the cracks and maintainers miss the recent changes on the PR. If these latest changes look good (e.g. the CI checks are all green) but the maintainers have not reviewed them it's good to ping the maintainers in the PR asking for a review. Even better if you can help with the review.


## Mentorship programs

The Jaeger project regularly participates in mentorship programs via CNCF. See [Mentorships](../mentorship/).

[good-first-issue]: https://github.com/search?q=org%3Ajaegertracing+label%3A%22good+first+issue%22&type=issues&state=open
[help-wanted]: https://github.com/search?q=org%3Ajaegertracing+label%3A%22help+wanted%22&type=issues&state=open
[not-assigning]: https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md#assigning-issues
