import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

describe('FileMover: move decision logic', () => {
  let vol: any;
  let fs: FileSystem;
  let mover: FileMover;

  beforeEach(() => {
    vol = Volume.fromJSON({
      '/docs/empty.md': '',
      '/docs/no-front-matter.md': '# Just a title',
      '/docs/empty-front-matter.md': `---
---
# Content with empty front matter`,
      '/docs/no-children.md': `---
title: No Children Here
---
# Content without children`,
      '/docs/empty-children.md': `---
title: Empty Children
children: []
---
# Content with empty children array`,
      '/docs/with-children.md': `---
title: Has Children
children:
  - title: Child One
    url: child-one
  - title: Child Two
    url: child-two
---
# Content with children`,
      '/docs/_index.md': `---
title: Documentation Root
children:
  - title: Getting Started
    url: getting-started
  - title: Architecture
    url: architecture
---
# Documentation Home`
    });
    fs = vol.promises as unknown as FileSystem;
    mover = new FileMover('/docs', fs);
  });

  it('returns false for empty files', async () => {
    const shouldMove = await mover.shouldMove('/docs/empty.md');
    expect(shouldMove).toBe(false);
  });

  it('returns false for files without front matter', async () => {
    const shouldMove = await mover.shouldMove('/docs/no-front-matter.md');
    expect(shouldMove).toBe(false);
  });

  it('returns false for files with empty front matter', async () => {
    const shouldMove = await mover.shouldMove('/docs/empty-front-matter.md');
    expect(shouldMove).toBe(false);
  });

  it('returns false for files without children field', async () => {
    const shouldMove = await mover.shouldMove('/docs/no-children.md');
    expect(shouldMove).toBe(false);
  });

  it('returns false for files with empty children array', async () => {
    const shouldMove = await mover.shouldMove('/docs/empty-children.md');
    expect(shouldMove).toBe(false);
  });

  it('returns true for files with children', async () => {
    const shouldMove = await mover.shouldMove('/docs/with-children.md');
    expect(shouldMove).toBe(true);
  });

  it('returns false for _index.md even with children', async () => {
    const shouldMove = await mover.shouldMove('/docs/_index.md');
    expect(shouldMove).toBe(false);
  });
});