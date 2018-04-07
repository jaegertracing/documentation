# Jaeger website

[doc-img]: https://readthedocs.org/projects/jaeger/badge/?version=latest
[doc]: http://jaeger.readthedocs.org/en/latest/
[project]: https://readthedocs.org/projects/jaeger/
[ci-img]: https://travis-ci.org/jaegertracing/documentation.svg?branch=master
[ci]: https://travis-ci.org/jaegertracing/documentation
[jaeger]: https://jaegertracing.io/

This repo houses all the assets used to build the Jaeger website, available at https://jaegertracing.io.

The site is built and hosted by [Netlify](https://www.netlify.com/).

## Requirements

In order to develop the Jaeger site locally, you'll need to have the following installed:

* [Node.js](https://nodejs.org/en/)

## Setup

### macOS

To develop the website on macOS, you'll first need to have [Homebrew](https://brew.sh) installed. Once you have Homebrew:

```bash
$ make macos-setup
```

This will install [Hugo](https://gohugo.io), the site's static site generator, and all necessary Node.js assets.

### Linux

Coming soon.

## Running the site locally

If you want to develop the site locally, you can run a single command (assuming that you've run the [setup](#setup)):

```bash
$ make dev
```

This will start up a local server on localhost port 1313. When you make changes to either the content of the website (in [`content`](content)) *or* to the Sass and JavaScript assets of the page (in [`themes/jaeger-docs/source`](themes/jaeger-docs/source)), the browser will automatically update to reflect those changes (usually in under one second).

## Publishing the site

The site is published automatically by [Netlify](https://www.netlify.com/) whenever changes are merged to the `master` branch. The site cannot be published in an ad-hoc way (e.g. through a `make` command or script in the repo).

## Contributing to the site

We strongly encourage you to contribute to this site! For more information, see the [contributing](CONTRIBUTING.md) guide.

## License

[Apache 2.0 License](./LICENSE).
