import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

// ------------------------------------------------------------

const ROOT_INDEX_CONTENT = `---
title: Documentation
---
# Documentation

See [Features](./features/) for a list of features.
See [Architecture](./architecture/) for design details.`;

// ------------------------------------------------------------

const ARCHITECTURE_CONTENT = `---
title: Architecture
children:
  - title: Components
    url: components
---
# Architecture Overview`;

// ------------------------------------------------------------

const DEPLOYMENT_CONTENT = `---
title: Deployment
children:
  - title: Production Setup
    url: production-setup
---
# Deployment Guide
See [production setup](production-setup.md) for details.`;

// ------------------------------------------------------------

const PRODUCTION_SETUP_CONTENT = `# Production Setup
Back to [deployment guide](deployment.md).`;

// ------------------------------------------------------------

const newLocal = {
  '/docs/_index.md': ROOT_INDEX_CONTENT,
  '/docs/architecture.md': ARCHITECTURE_CONTENT,
  '/docs/features.md': '# Features',
  '/docs/deployment.md': DEPLOYMENT_CONTENT,
  '/docs/production-setup.md': PRODUCTION_SETUP_CONTENT,
  '/docs/components.md': '# Components'
};

describe('FileMover: link updates', () => {
  let vol: any;
  let fs: FileSystem;
  let mover: FileMover;

  beforeEach(() => {
    vol = Volume.fromJSON(newLocal);
    fs = vol.promises as unknown as FileSystem;
    mover = new FileMover('/docs', fs);
  });

  it('preserves links to sections that became _index.md', async () => {
    // Move architecture.md to architecture/_index.md
    const moved = await mover.testAndMove('/docs/architecture.md');
    expect(moved).toBe(true);

    // Verify architecture.md became _index.md
    const indexContent = await fs.readFile('/docs/architecture/_index.md', 'utf8');
    expect(indexContent).toContain('# Architecture Overview');

    // Verify link in root _index.md is preserved
    const rootContent = await fs.readFile('/docs/_index.md', 'utf8');
    expect(rootContent).toContain('[Architecture](./architecture/)');

    // Verify link to unmoved file is also preserved
    expect(rootContent).toContain('[Features](./features/)');
  });

  it('updates links in moved files', async () => {
    const moved = await mover.testAndMove('/docs/deployment.md');
    expect(moved).toBe(true);

    // Check links in parent file were updated
    const parentContent = await fs.readFile('/docs/deployment/_index.md', 'utf8');
    expect(parentContent).toContain('See [production setup](production-setup.md) for details.');

    // Check links in child file were updated
    const childContent = await fs.readFile('/docs/deployment/production-setup.md', 'utf8');
    expect(childContent).toContain('Back to [deployment guide](deployment.md).');
  });

});