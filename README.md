# Jaeger website

This repo houses all the assets used to build the Jaeger website, available at https://jaegertracing.io.

The site is built and hosted by [Netlify](https://www.netlify.com/).

## Setup

Install the extended hugo binary from [hugo/releases]https://github.com/gohugoio/hugo/releases or
use package manager if it is available for your operating system.
The currently used version of hugo is defined in [netifly.toml](./netifly.toml) configuration file.

## Running the site locally

If you want to develop the site locally, you can run a single command (assuming that you've run the [setup](#setup)):

```bash
$ make develop
```

This will start up a local server on localhost port 1313. When you make changes to either the content of the website (in [`content`](content)) *or* to the Sass and JavaScript assets of the page (in [`themes/jaeger-docs/source`](themes/jaeger-docs/source)), the browser will automatically update to reflect those changes (usually in under one second).

## Publishing the site

The site is published automatically by [Netlify](https://www.netlify.com/) whenever changes are merged to the `master` branch. The site cannot be published in an ad-hoc way (e.g. through a `make` command or script in the repo).

## Contributing to the site

We strongly encourage you to contribute to this site! For more information, see the [contributing](CONTRIBUTING.md) guide.

### Publishing new Jaeger version

Each Jaeger version is documented in a separate directory e.g. [content/docs/1.8](./content/docs//1.8).

When submitting changes for the new version please split commits with changes
and files copy of the previous documentation files. The following steps shows
a possible workflow:

1. copy files from old version to a new directory
2. add the new version to [comfig.toml](./config.toml)
3. commit the copied files
4. make documentation changes for the new version
5. commit the changes related to the new version
6. submit a pull request and do not squash commits

## License

[Apache 2.0 License](./LICENSE).
