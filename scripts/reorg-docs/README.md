# Documentation Reorganizer

A tool to reorganize Jaeger documentation files by moving parent pages to
`_index.md` files and their children into appropriate subdirectories, so as to
be compatible with Docsy (and Hugo).

## Installation

From the `scripts/reorg-docs` directory:

```bash
npm install
```

## Development

### Running Tests

```bash
npm test
# or
npm run test:watch
```

## Usage

Example:

```bash
(cd scripts/reorg-docs/ && npm run build) && \
node ./scripts/reorg-docs/dist/cli.js content/docs/v2/2.0
```
