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

### Publishing new Jaeger version

Each Jaeger version is documented in a separate directory e.g. [content/docs/1.8/](./content/docs/1.8/). A special directory [content/docs/next-release/](./content/docs/next-release/) is reserved for the changes to be published as the next version. If you are adding documentation for features that are not yet released in the main Jaeger repository, add your changes to the `next-release` directory. If you're adding documentation for already released features, you may need to make the same change twice, i.e. in the most recent release (e.g. `1.8`) and in the `next-release` directories.

Before creating a new release, make sure all outstanding PRs for that version are merged to `next-release` directory. Then create a new release:

1. copy files from `next-release` to a new directory, e.g. `1.9`, without any changes
2. add the new version to [config.toml](./config.toml) (see `latest`, `binariesLatest`, and `versions` variables)
3. do not make any other changes to the content (if you need changes, make them before the release)
4. open a PR

## License

[Apache 2.0 License](./LICENSE).
