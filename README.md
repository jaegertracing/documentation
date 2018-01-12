[![ReadTheDocs][doc-img]][doc] [![Build Status][ci-img]][ci]

# Jaeger Documentation

This directory contains documentation hosted by [readthedocs][project] for [Jaeger Distributed Tracing][jaeger] project.

## Building

The documentation is built with [MkDocs](http://www.mkdocs.org/).
You need to have [virtualenv](https://virtualenv.pypa.io/en/stable/) installed.

Then simply run `make serve`.

## Deploying

Raise a pull request. Once the PR is approved and merged, [readthedocs][project] will automatically rebuild the docs.

[doc-img]: https://readthedocs.org/projects/jaeger/badge/?version=latest
[doc]: http://jaeger.readthedocs.org/en/latest/
[project]: https://readthedocs.org/projects/jaeger/
[ci-img]: https://travis-ci.org/jaegertracing/documentation.svg?branch=master
[ci]: https://travis-ci.org/jaegertracing/documentation
[jaeger]: https://jaegertracing.io/
