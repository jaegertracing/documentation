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

### Verifying Changes

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup, build, and check
commands. Before submitting a PR, at minimum run:

```bash
npm run build              # Ensure the site builds
npm run check:spelling     # Run spellcheck
npm run check:links:internal  # Check internal links
npm run check:format       # Check code formatting
```

Use `npm run fix:format` and `npm run fix:filenames` to auto-fix common issues.

### Spellchecking

The repository uses [cspell](https://cspell.org/) for spellchecking, configured
in `.cspell.yml` with custom dictionaries in `.cspell/`.

If the spellchecker flags a legitimate word:

1. **General technical terms**: add to `.cspell/project-words.txt`
2. **People's names**: add to `.cspell/project-names-src.txt`

Rules for `.cspell/project-words.txt`:

- One word per line, sorted alphabetically (case-insensitive)
- Verify sorting: `sort -c --ignore-case .cspell/project-words.txt`

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

Run `npm run fix:filenames` to auto-fix.

### Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Docsy Theme Documentation](https://www.docsy.dev/docs/)
- [Netlify Documentation](https://docs.netlify.com/)
