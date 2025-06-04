import { Volume } from 'memfs';
import { LinkFixer } from '../../src/LinkFixer.js';
import type { FileSystem } from '../../src/types.js';

/**
 * Tests for how LinkFixer handles links in the top-level _index.md file of a folder
 * being reorganized. This file is special because it contains links to:
 * - Files that will be moved into subdirectories
 * - Files that will remain at the same level
 * - Links to other sections using website root paths
 */
describe('LinkFixer: top-level _index.md handling', () => {
  let vol: any;
  let fs: FileSystem;
  let linkFixer: LinkFixer;

  const getMovedFiles = () => new Map([
    ['/docs/sampling.md', '/docs/architecture/sampling.md'],
    ['/docs/terminology.md', '/docs/architecture/terminology.md']
  ]);

  beforeEach(() => {
    // Set up common test files
    vol = Volume.fromJSON({
      '/docs/architecture.md': '# Architecture',
      '/docs/sampling.md': '# Sampling',
      '/docs/terminology.md': '# Terminology'
    });
    fs = vol.promises as unknown as FileSystem;
    linkFixer = new LinkFixer('/docs', fs);
  });

  it('preserves links to unmoved files and website root paths', async () => {
    const originalContent = `---
title: Documentation
---
Some text:
- [Client Libraries](client-libraries) - unmoved file
- [About Jaeger](/about/) - website root path
`;
    await fs.writeFile('/docs/_index.md', originalContent);
    await linkFixer.updateLinksInFile('/docs/_index.md', getMovedFiles());
    const content = await fs.readFile('/docs/_index.md', 'utf8');
    expect(content).toBe(originalContent);
  });

  it('updates link when file moves to its own directory as _index.md', async () => {
    const originalContent = `---
title: Documentation
---

Oh my:

- [Architecture](architecture/) - will move to subfolder
`;
    await fs.writeFile('/docs/_index.md', originalContent);

    await linkFixer.updateLinksInFile('/docs/_index.md', getMovedFiles());

    const content = await fs.readFile('/docs/_index.md', 'utf8');
    expect(content).toBe(originalContent);
  });

  it('updates links preserving their original ending slash or', async () => {
    const originalContent = `---
title: Documentation
---

## Hello

- [Sampling](./sampling) - no trailing slash
- [Terminology](terminology/) - with trailing slash
- [Sampling again](./sampling#hello) - with hash
- [Terminology](terminology/#hi) - with hash
`;
    await fs.writeFile('/docs/_index.md', originalContent);

    await linkFixer.updateLinksInFile('/docs/_index.md', getMovedFiles());

    const expectedContent = `---
title: Documentation
---

## Hello

- [Sampling](./architecture/sampling) - no trailing slash
- [Terminology](architecture/terminology/) - with trailing slash
- [Sampling again](./architecture/sampling#hello) - with hash
- [Terminology](architecture/terminology/#hi) - with hash
`;
    const content = await fs.readFile('/docs/_index.md', 'utf8');
    expect(content).toBe(expectedContent);
  });
});