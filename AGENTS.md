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

**For human-centric guidelines** such as DCO (Developer Certificate of Origin)
signing, PR etiquette, and community interaction, refer to [CONTRIBUTING.md](CONTRIBUTING.md)
and the [general contributing guidelines](https://github.com/jaegertracing/jaeger/blob/main/CONTRIBUTING_GUIDELINES.md).

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

### Testing and Verifying Changes

Before submitting a PR, verify your changes locally:

#### 1. Setup (First Time Only)

```bash
npm install
```

This installs all dependencies including the required Hugo version.

#### 2. Run the Site Locally

```bash
make develop
# or
npm run serve
```

This starts a local server at [localhost:1313](http://localhost:1313) with hot
reload. Verify your changes render correctly in the browser.

#### 3. Build the Site

```bash
npm run build
```

Ensure the build completes without errors before submitting a PR.

#### 4. Run All Checks

Run these commands to verify CI will pass:

```bash
npm run check:format      # Check code formatting
npm run check:spelling    # Run spellcheck
npm run check:links:internal  # Check internal links (faster)
npm run check:filenames   # Check filename conventions
```

For comprehensive link checking (including external links):

```bash
npm run check:links:all   # Check all links (slower, builds site first)
```

#### 5. Fix Common Issues

```bash
npm run fix:format        # Auto-fix formatting issues
npm run fix:filenames     # Convert underscores to hyphens in filenames
npm run fix               # Run both fixes
```

### Spellchecking

The repository uses [cspell](https://cspell.org/) for spellchecking. Configuration
is in `.cspell.yml` with custom dictionaries in the `.cspell/` directory.

If the spellchecker flags a legitimate word (technical term, proper noun, etc.):

1. **For general technical terms**: Add to `.cspell/project-words.txt`
2. **For people's names**: Add to `.cspell/project-names-src.txt`

**Important rules for `project-words.txt`:**

- Words must be sorted alphabetically (case-insensitive)
- One word per line
- The file is case-sensitive, so add the exact casing needed
- Run `sort -c --ignore-case .cspell/project-words.txt` to verify sorting

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

#### Spellcheck Failures

1. Review the flagged words in the output
2. If the word is misspelled, fix it in the content
3. If the word is legitimate, add it to the appropriate dictionary file
4. Ensure `project-words.txt` remains sorted alphabetically

### Documentation Versioning

When making documentation changes:

- **New features/changes**: Edit files in `content/docs/v2/_dev/` (for next release)
- **Fixes for current version**: Apply to both `_dev/` and the most recent version
  directory (e.g., `content/docs/v2/2.x/`) so changes appear immediately on the
  live site
- **Backporting**: Update older version directories if the fix applies to them

### Additional Resources

- [Hugo Documentation](https://gohugo.io/documentation/)
- [Docsy Theme Documentation](https://www.docsy.dev/docs/)
- [Netlify Documentation](https://docs.netlify.com/)
