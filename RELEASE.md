# Release instructions

Each Jaeger version is documented in a separate directory e.g. [content/docs/v2/2.13/](./content/docs/v2/2.13/). A special directory [content/docs/v2/_dev/](./content/docs/v2/_dev/) is reserved for the changes to be published as the next version. If you are adding documentation for features that are not yet released in the main Jaeger repository, add your changes to the `_dev_` directory. If you're adding documentation for already released features, you may need to make the same change twice, i.e. in the most recent release (e.g. `2.14/`) and in the `_dev/` directories.

<!-- BEGIN_CHECKLIST -->
Before creating a new release:

  - Make sure all outstanding PRs for that version are merged to `next-release` directory.
  - Make sure the actual Jaeger release is done and Docker images for the new version are published.

To create a new release:
  - Manually trigger the [Release](https://github.com/jaegertracing/documentation/actions/workflows/ci-release.yml) workflow on GitHub. It will ask for v2 version number (same version as in the main Jaeger repo), and create a [pull request](https://github.com/jaegertracing/documentation/pulls) with the documentation changes. The workflow is using a bot token which [expires every year](https://github.com/jaegertracing/documentation/issues/1037).
  - Approve and merge that pull request. The site will be rebuilt automatically.
  - Verify that [jaegertracing.io](https://www.jaegertracing.io/docs/latest) redirects to the new documentation release version URL.

<!-- END_CHECKLIST -->

### Note on v1 releases

The Jaeger project has stopped producing artifacts for v1, so the documentation release process now only handles v2 versions. The CLI documentation generation (which was only applicable to v1) has been removed from the automated release process.

