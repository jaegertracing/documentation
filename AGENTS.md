# AI Agent Guide for Jaeger Documentation

This document provides guidance for AI agents (like GitHub Copilot) working on
the Jaeger documentation repository.

## Repository Overview

This repository contains the Jaeger documentation website built with
[Hugo](https://gohugo.io/) and hosted on [Netlify](https://www.netlify.com/).
For general information about the repository, see [README.md](README.md).

## Contributing Guidelines

Before making changes, familiarize yourself with:

1. General Jaeger contributing guidelines:
   [Contributing Guidelines](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md)
2. Documentation-specific guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)

## Development Workflow

### Setup

Install dependencies (requires Node.js LTS version):

```bash
npm install
```

This installs Hugo and other required dependencies.

### Local Development

Start the local development server:

```bash
make develop
# or
npm run serve
```

The site will be available at http://localhost:1313 with hot-reload enabled.

### Code Quality Checks

Before committing changes, run:

- **Format check**: `npm run check:format`
- **Format fix**: `npm run fix:format`
- **Spell check**: `npm run check:spelling`
- **Link check (internal)**: `npm run check:links:internal`
- **Link check (all)**: `npm run check:links:all`
- **Filename conventions**: `npm run check:filenames`

### Building

Build the site:

```bash
npm run build
# or for production
npm run build:production
```

## Content Guidelines

### File Naming

- Use kebab-case (hyphen-separated) for all content and asset files
- Avoid underscores in filenames (except for files starting with `_` or `.`)
- Fix naming violations with: `npm run fix:filenames`

### Documentation Style

- Use active voice for clarity
- Write in plain language, avoid jargon
- Spellcheck all content
- Follow proper grammar conventions

### Admonitions

The documentation supports five admonition types:

- `info` (blue)
- `success` (green)
- `danger` (red)
- `warning` (yellow)
- `requirement` (purple)

Example usage:

```markdown
{{< warning title="Important" >}} This is a warning message. {{< /warning >}}
```

## Common Tasks

### Adding New Pages

When adding new documentation pages:

1. Create the content file in the appropriate directory under `content/`
2. Add a corresponding redirect entry to
   `themes/jaeger-docs/layouts/index.redirects`
3. Test locally to ensure the page renders correctly

### Updating Blog Feed

The homepage displays posts from the
[Jaeger Medium blog](https://medium.com/jaegertracing):

```bash
make fetch-blog-feed
```

### Generating Roadmap

To update the roadmap page:

```bash
make fetch-roadmap
```

Requires `GITHUB_TOKEN` environment variable or `~/.github_token` file.

### Updating Diagrams

Diagrams are created in a shared
[Google Slides document](https://docs.google.com/presentation/d/1JuurkQn03z0BbOEAViJBEE_WWMj6JQUML-uJm7zizvI/):

1. Copy the diagram to a new slide deck
2. Export as SVG
3. Include both the SVG and a link to your slide deck in the PR
4. Maintainers will update the main deck upon merge

## Repository Structure

- `content/` - Documentation content in Markdown
- `themes/jaeger-docs/` - Hugo theme customizations
- `static/` - Static assets (images, etc.)
- `assets/` - Assets processed by Hugo
- `layouts/` - Custom Hugo layouts
- `data/` - Data files used by Hugo
- `scripts/` - Utility scripts

## Build and Deployment

- **CI/CD**: GitHub Actions runs tests on PRs
- **Deployment**: Netlify automatically deploys from the `main` branch
- **Preview**: Netlify creates preview deployments for PRs

## Release Process

For releasing new documentation versions, see [RELEASE.md](RELEASE.md).

## Troubleshooting

### Link Checker Issues

If link checking fails:

1. Check if the links are correct in your content
2. For external links, verify they're accessible
3. Review the refcache in `data/refcache.json`

### Build Failures

Common issues:

- Missing Node.js dependencies: run `npm install`
- Hugo version mismatch: check `package.json` for required version
- Syntax errors in Markdown or Hugo templates

### Filename Violations

If CI complains about filename conventions:

```bash
npm run fix:filenames
```

## Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Docsy Theme Documentation](https://www.docsy.dev/docs/)
- [Netlify Documentation](https://docs.netlify.com/)
