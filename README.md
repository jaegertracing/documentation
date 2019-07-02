[![Build Status][ci-img]][ci]
[![Netlify Status][netifly-img]][netifly]

# Jaeger website

This repo houses all the assets used to build the Jaeger website, available at https://jaegertracing.io.

The site is built and hosted by [Netlify](https://www.netlify.com/).

## Setup

Install the "extended" Hugo binary from [hugo/releases](https://github.com/gohugoio/hugo/releases) (use one of the `hugo_extended_*` binaries) or
use a package manager if it is available for your operating system.

>  The "extended" version of Hugo supports [Sass](https://sass-lang.org), which is necessary to build the site locally.

The currently used version of Hugo is defined in the [`netlify.toml`](./netlify.toml) configuration file.

## Running the site locally

If you want to develop the site locally, you can run a single command (assuming that you've run the [setup](#setup)):

```bash
$ make develop
```

This will start up a local server on localhost port 1313. When you make changes to either the content of the website (in [`content`](content)) *or* to the Sass and JavaScript assets of the page (in [`themes/jaeger-docs/assets`](themes/jaeger-docs/assets)), the browser will automatically update to reflect those changes (usually in under one second).

## Publishing the site

The site is published automatically by [Netlify](https://www.netlify.com/) whenever changes are merged to the `master` branch. The site cannot be published in an ad-hoc way (e.g. through a `make` command or script in the repo).

## Contributing to the site

We strongly encourage you to contribute to this site! For more information, see the [contributing](CONTRIBUTING.md) guide.

## Diagrams

Diagrams included in the documentation are created in the shared [Google Slides document][slides], which supports export to SVG. If you need to make changes to the diagrams as part of a PR, please copy the diagram into a new slide deck and include a shared link to it in the PR along with the exported SVG file. The maintainers will update the master deck with the new version upon merging the PR.

## Publishing new Jaeger version

Each Jaeger version is documented in a separate directory e.g. [content/docs/1.8/](./content/docs/1.8/). A special directory [content/docs/next-release/](./content/docs/next-release/) is reserved for the changes to be published as the next version. If you are adding documentation for features that are not yet released in the main Jaeger repository, add your changes to the `next-release` directory. If you're adding documentation for already released features, you may need to make the same change twice, i.e. in the most recent release (e.g. `1.8`) and in the `next-release` directories.

Before creating a new release, make sure all outstanding PRs for that version are merged to `next-release` directory.
Then create a release by pushing a tag `release-X.Y.Z`, ex `git tag release-1.12.0; git push origin release-1.12.0`.

The docs for the Jaeger CLI tools are generated using a Docker image. If you have Docker running, you can add CLI tool docs for a new version like this:

```bash
./scripts/cli-data.sh ${VERSION}
```

This deposits the generated YAML in a new directory at `data/cli/${VERSION}` and copies that directory to `data/cli/next-release`.

## License

[Apache 2.0 License](./LICENSE).

[slides]: https://docs.google.com/presentation/d/1JuurkQn03z0BbOEAViJBEE_WWMj6JQUML-uJm7zizvI/
[ci-img]: https://travis-ci.org/jaegertracing/documentation.svg?branch=master
[ci]: https://travis-ci.org/jaegertracing/documentation
[netifly-img]: https://api.netlify.com/api/v1/badges/d2b1a1ea-f454-4ba8-990c-cc469c959556/deploy-status
[netifly]: https://app.netlify.com/sites/jaegertracing/deploys