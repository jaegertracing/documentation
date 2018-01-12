[![ReadTheDocs][doc-img]][doc] [![Build Status][ci-img]][ci]

# Jaeger Documentation

This directory contains documentation hosted by [readthedocs][doc] for Jaeger Distributed Tracing project.

## Building

The documentation is built with [MkDocs](http://www.mkdocs.org/).
You need to have [virtualenv](https://virtualenv.pypa.io/en/stable/) installed.

Then simply run `make serve`.

## Deploying

Raise a PR on GitHub. Once the PR is approved and merged,
ask one of Jaeger maintainers to kick off the build on [readthedocs](https://readthedocs.org/projects/jaeger/).

[doc-img]: https://readthedocs.org/projects/jaeger/badge/?version=latest
[doc]: http://jaeger.readthedocs.org/en/latest/
[ci-img]: https://travis-ci.org/jaegertracing/documentation.svg?branch=master
[ci]: https://travis-ci.org/jaegertracing/documentation
