# Release instructions


Each Jaeger version is documented in a separate directory e.g. [content/docs/1.8/](./content/docs/1.8/). A special directory [content/docs/next-release/](./content/docs/next-release/) is reserved for the changes to be published as the next version. If you are adding documentation for features that are not yet released in the main Jaeger repository, add your changes to the `next-release` directory. If you're adding documentation for already released features, you may need to make the same change twice, i.e. in the most recent release (e.g. `1.8`) and in the `next-release` directories.

Jaeger v2 next-release documentation is in the `next-release-v2` directory.

<!-- BEGIN_CHECKLIST -->
Before creating a new release:

  - Make sure all outstanding PRs for that version are merged to `next-release` directory.
  - Make sure the actual Jaeger release is done and Docker images for the new version are published.

To create a new release:
  - Manually trigger the [Release](https://github.com/jaegertracing/documentation/actions/workflows/ci-release.yml) workflow on GitHub. It will ask for the v2 version number (same version as in the main Jaeger repo), and create a [pull request](https://github.com/jaegertracing/documentation/pulls) with the documentation changes.
  - Approve and merge that pull request.
  - Because the site is statically generated, the release is completed after the merge.
  - The workflow is using a bot token which expires every year, see https://github.com/jaegertracing/documentation/issues/1037.

<!-- END_CHECKLIST -->
