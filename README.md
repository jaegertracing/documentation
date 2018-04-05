# Jaeger website

[doc-img]: https://readthedocs.org/projects/jaeger/badge/?version=latest
[doc]: http://jaeger.readthedocs.org/en/latest/
[project]: https://readthedocs.org/projects/jaeger/
[ci-img]: https://travis-ci.org/jaegertracing/documentation.svg?branch=master
[ci]: https://travis-ci.org/jaegertracing/documentation
[jaeger]: https://jaegertracing.io/

This repo houses all the assets used to build the Jaeger website, available at [https://jaegertracing.io](https://jaegertracing.netlify.com/).

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

If you want to develop the site locally, you can run a single command:

```bash
$ make dev
```

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[Apache 2.0 License](./LICENSE).
