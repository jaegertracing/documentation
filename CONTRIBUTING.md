# How to Contribute to Jaeger Documentation

We'd love your help!

General contributing guidelines are described in [Contributing Guidelines](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md).

This document provides documentation-specific guidance to complement the general guidelines.

## Setup

Install the active LTS version of Node.js, then run the following command from the directory of this repo's clone:

```bash
npm install
```

This will also install the required version of Hugo.

## Running the site locally

If you want to develop the site locally, you can run a single command (assuming that you've run the [setup](#setup)):

```bash
make develop
```

Alternatively, you can run `npm run serve`.

These commands will start up a local server on [localhost:1313](http://localhost:1313). When you make changes to either the content of the website (in [`content`](content)) *or* to the Sass and JavaScript assets of the page (in [`themes/jaeger-docs/assets`](themes/jaeger-docs/assets)), the browser will automatically update to reflect those changes (usually in under one second).

## Building the site

Build the site:

```bash
npm run build
# or for production
npm run build:production
```

## Code Quality Checks

Before committing changes, run:

- **Format check**: `npm run check:format`
- **Format fix**: `npm run fix:format`
- **Spell check**: `npm run check:spelling`
- **Link check (internal)**: `npm run check:links:internal`
- **Link check (all)**: `npm run check:links:all`
- **Filename conventions**: `npm run check:filenames`

## Content Guidelines

### File Naming

- Use kebab-case (hyphen-separated) for all content and asset files
- Avoid underscores in filenames (except for files starting with `_` or `.`)
- Fix naming violations with: `npm run fix:filenames`

### Documentation Style

When contributing to the Jaeger documentation, please ensure your changes:

* Use the active voice (vs. [passive voice](https://www.grammarly.com/blog/a-scary-easy-way-to-help-you-find-passive-voice/)) to make it clear when the user has to perform an action and when actions happen automatically.
* Have been spellchecked and use proper [grammar](https://www.grammarly.com/).
* Are written in plain language and avoid jargon. Remember, the people reading the documentation know much less about the project than you do.

### Admonitions

There are five admonition types available for the Jaeger docs:

Admonition type | Color
:---------------|:-----
`info` | blue
`success` | green
`danger` | red
`warning` | yellow
`requirement` | purple

Here's an example:

```markdown
{{< danger >}}
We do not recommend that you do this!
{{< /danger >}}
```

You can also add titles:

```markdown
{{< success title="New feature" >}}
Jaeger now supports a new thing that you definitely want.
{{< /success >}}
```

## Making Documentation Changes

*Before making any significant changes, please [open an issue](https://github.com/jaegertracing/documentation/issues).* Discussing your proposed changes ahead of time will make the contribution process smooth for everyone.

### Adding New Pages

When adding new documentation pages:

1. Create the content file in the appropriate directory under `content/`
2. Add a corresponding redirect entry to `themes/jaeger-docs/layouts/index.redirects`
3. Test locally to ensure the page renders correctly

### Updating Diagrams

Diagrams are created in a shared [Google Slides document](https://docs.google.com/presentation/d/1JuurkQn03z0BbOEAViJBEE_WWMj6JQUML-uJm7zizvI/):

1. Copy the diagram to a new slide deck
2. Export as SVG
3. Include both the SVG and a link to your slide deck in the PR
4. Maintainers will update the main deck upon merge

### Updating Blog Feed

The homepage displays posts from the [Jaeger Medium blog](https://medium.com/jaegertracing):

```bash
make fetch-blog-feed
```

### Generating Roadmap

To update the roadmap page:

```bash
make fetch-roadmap
```

Requires `GITHUB_TOKEN` environment variable or `~/.github_token` file.

## Publishing

Once the PR is approved and merged, [Netlify](https://www.netlify.com/) will automatically rebuild and deploy the documentation site.

