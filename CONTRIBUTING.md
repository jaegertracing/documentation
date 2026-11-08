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

## Site search

Site search uses [Pagefind](https://pagefind.app/), a static search index that
is built from `public/` after each build by the `postbuild*` npm hooks (see
[`pagefind.yml`](pagefind.yml)). No third-party service is involved.

- `npm run serve` renders to memory, so it has no search index. To try search
  locally, run `npm run serve:search` and open
  [localhost:1414](http://localhost:1414).
- Only page content inside Docsy's `.td-content` element is indexed. To keep a
  page out of search results, add `exclude_search: true` to its front matter.
- Every page is tagged with its docs version (for example `2.22` or `1.76`, or
  `site` for non-docs pages). Search defaults to the version of the page the
  reader is on, and the results page lets readers pick another version.
- `npm run test:browser` builds the site and runs the browser tests in
  [`tests/`](tests/) against it with [Playwright](https://playwright.dev/):
  the search tests in `search.spec.ts` and the Content-Security-Policy check
  in `csp.spec.ts`, which fails when a page loads a resource that the policy in
  `netlify.toml` blocks. The first run needs `npx playwright install chromium`.

## Code Quality Checks

Before committing changes, run:

- **Format check**: `npm run check:format`
- **Format fix**: `npm run fix:format`
- **Spell check**: `npm run check:spelling`
- **Link check (internal)**: `npm run check:links:internal`
- **Link check (all)**: `npm run check:links:all`
- **Filename conventions**: `npm run check:filenames`
- **Link conventions of `_dev` pages**: `npm run check:dev-links`. Links to files in the jaeger repository are reference-style links defined at the end of the page, so that a moved file costs one line to fix.

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

### Versioning

The most recent versions of the documentation files are under `content/docs/v2/_dev/`. When a new release is published, the files are copied to `content/docs/v2/<version>/` as a snapthot, and any version-specific references are updated, for example by using a concrete version in the commands like `docker run cr.jaegertracing.io/jaegertracing/jaeger:2.13.0`.

When making new documentation changes, they should be made in the `_dev` directory, for the next release. If some fixes require backporting to docs for existing versions, they can be updated as well. Usually it is a good practice to apply the change to at least `_dev` and the most recent version, such that the live website is updated right away, without waiting for the new release.

### Adding New Pages

When adding new documentation pages:

1. Create the content file in the appropriate directory under `content/`
2. Add a corresponding redirect entry to `themes/jaeger-docs/layouts/index.redirects`
3. Test locally to ensure the page renders correctly

### Updating Diagrams

Diagrams included in the documentation are created in a shared [Google Slides document](https://docs.google.com/presentation/d/1JuurkQn03z0BbOEAViJBEE_WWMj6JQUML-uJm7zizvI/):

1. Copy the diagram to a new slide deck
2. Export as SVG
3. Include both the SVG and a link to your slide deck in the PR
4. Maintainers will update the main deck upon merge

### Updating Blog Feed

The homepage displays the latest blog posts from the [Jaeger Medium blog](https://medium.com/jaegertracing). To avoid network calls during builds and to ensure fast, reliable local development, the Medium RSS feed is downloaded and stored as a static XML file `assets/data/medium.xml`. The Hugo site reads and parses this file using `resources.Get` and `transform.Unmarshal`. This converts the XML into structured data at build time, allowing full control over the content without relying on live network requests.

To update the feed:

```bash
make fetch-blog-feed
```

Ensure you have [`curl`](https://curl.se/) installed on your system to download the RSS feed.

After updating the feed, commit the changes:
```bash
git add assets/data/medium.xml
git commit -m "chore: update Medium blog feed"
```

### Generating Roadmap

To update the roadmap page `content/roadmap.md`:

```bash
make fetch-roadmap
```

This script fetches issues from the [GitHub project board](https://github.com/orgs/jaegertracing/projects/4/views/1?layout=table), extracts the required information, and generates the roadmap document. Requires `GITHUB_TOKEN` environment variable or `~/.github_token` file. Personal tokens can be created at https://github.com/settings/tokens/.

## Publishing

Once the PR is approved and merged, [Netlify](https://www.netlify.com/) will automatically rebuild and deploy the documentation site.

