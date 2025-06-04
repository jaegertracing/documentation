import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

describe('FileMover: child file handling', () => {
  let vol: any;
  let fs: FileSystem;
  let mover: FileMover;

  beforeEach(() => {
    // Set up test files including parent with children
    vol = Volume.fromJSON({
      '/docs/architecture.md': `---
title: Architecture
children:
  - title: Sampling
    url: sampling
  - title: Terminology
    url: terminology
---
# Architecture Overview`,
      '/docs/sampling.md': '# Sampling',
      '/docs/terminology.md': '# Terminology'
    });
    fs = vol.promises as unknown as FileSystem;
    mover = new FileMover('/docs', fs);
  });

  it('moves child files to parent directory', async () => {
    const moved = await mover.testAndMove('/docs/architecture.md');
    expect(moved).toBe(true);

    // Verify children were moved
    expect(await fs.readFile('/docs/architecture/sampling.md', 'utf8')).toBe('# Sampling');
    expect(await fs.readFile('/docs/architecture/terminology.md', 'utf8')).toBe('# Terminology');

    // Verify original files were removed
    await expect(fs.readFile('/docs/sampling.md', 'utf8')).rejects.toThrow();
    await expect(fs.readFile('/docs/terminology.md', 'utf8')).rejects.toThrow();
  });

  it('tracks moved child files', async () => {
    const moved = await mover.testAndMove('/docs/architecture.md');
    expect(moved).toBe(true);

    // Verify moved files are tracked
    const movedFiles = mover.getMovedFiles();
    expect(movedFiles.get('/docs/architecture.md')).toBe('/docs/architecture/_index.md');
    expect(movedFiles.get('/docs/sampling.md')).toBe('/docs/architecture/sampling.md');
    expect(movedFiles.get('/docs/terminology.md')).toBe('/docs/architecture/terminology.md');
  });
});