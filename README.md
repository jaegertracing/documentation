[![Netlify Status][netlify-img]][netlify]

# Jaeger website

This repo houses all the assets used to build the Jaeger website, available at <https://jaegertracing.io>.

The site is built with [Hugo](https://gohugo.io/) and hosted by [Netlify](https://www.netlify.com/).

## Contributing to the site

We strongly encourage you to contribute to this site! For more information, see the [contributing](CONTRIBUTING.md) guide.

## Publishing the site

The site is published automatically by [Netlify](https://www.netlify.com/) whenever changes are merged to the `main` branch. The site cannot be published in an ad-hoc way (e.g. through a `make` command or script in the repo).

## Diagrams

Diagrams included in the documentation are created in the shared [Google Slides document][slides], which supports export to SVG. If you need to make changes to the diagrams as part of a PR, please copy the diagram into a new slide deck and include a shared link to it in the PR along with the exported SVG file. The maintainers will update the main deck with the new version upon merging the PR.

## Publishing new Jaeger version

Please refer to [RELEASE.md](./RELEASE.md) for instructions on how to release new version of documentation.

## License

[Apache 2.0 License](./LICENSE).

[slides]: https://docs.google.com/presentation/d/1JuurkQn03z0BbOEAViJBEE_WWMj6JQUML-uJm7zizvI/
[netlify-img]: https://api.netlify.com/api/v1/badges/d2b1a1ea-f454-4ba8-990c-cc469c959556/deploy-status
[netlify]: https://app.netlify.com/sites/jaegertracing/deploys
[htmltest]: https://github.com/wjdp/htmltest
