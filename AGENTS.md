# AI Agent Guide for Jaeger Documentation

This document provides guidance for AI agents (like GitHub Copilot) working on
the Jaeger documentation repository.

## Repository Overview

This repository contains the Jaeger documentation website,
https://jaegertracing.io, built with [Hugo](https://gohugo.io/) and hosted on
[Netlify](https://www.netlify.com/). For general information about the
repository, see [README.md](README.md).

## Contributing Guidelines

Before making changes, familiarize yourself with:

1. General Jaeger contributing guidelines:
   [Contributing Guidelines](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md)
2. Documentation-specific guidelines: [CONTRIBUTING.md](CONTRIBUTING.md)

The CONTRIBUTING.md file contains all necessary information for setting up,
building, linting, and making changes to the documentation.

## Agentic Workflow Tips

### Repository Structure

Understanding the repository structure will help you navigate and make changes
efficiently:

- `content/` - Documentation content in Markdown
- `themes/jaeger-docs/` - Hugo theme customizations
- `static/` - Static assets (images, etc.)
- `assets/` - Assets processed by Hugo
- `layouts/` - Custom Hugo layouts
- `data/` - Data files used by Hugo (including `refcache.json` for link
  checking)
- `scripts/` - Utility scripts

### Build and Deployment

- **CI/CD**: GitHub Actions runs tests on PRs
- **Deployment**: Netlify automatically deploys from the `main` branch
- **Preview**: Netlify creates preview deployments for PRs

### Troubleshooting

#### Link Checker Issues

If link checking fails:

1. Check if the links are correct in your content
2. For external links, verify they're accessible
3. Review the refcache in `data/refcache.json`

#### Build Failures

Common issues:

- Missing Node.js dependencies: run `npm install`
- Hugo version mismatch: check `package.json` for required version
- Syntax errors in Markdown or Hugo templates

#### Filename Violations

If CI complains about filename conventions:

```bash
npm run fix:filenames
```

### Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Docsy Theme Documentation](https://www.docsy.dev/docs/)
- [Netlify Documentation](https://docs.netlify.com/)
