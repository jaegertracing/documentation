import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

describe('FileMover: basic operations', () => {
  let vol: any;
  let fs: FileSystem;
  let mover: FileMover;

  beforeEach(() => {
    vol = Volume.fromJSON({
      '/docs/architecture.md': '# Architecture',
      '/docs/deployment.md': '# Deployment',
      '/docs/faq.md': '# FAQ'
    });
    fs = vol.promises as unknown as FileSystem;
    mover = new FileMover('/docs', fs);
  });

  it('creates parent directory and moves file to _index.md', async () => {
    await mover.moveParentFile('/docs/deployment.md');

    // Check directory was created
    const dirStats = await fs.stat('/docs/deployment');
    expect(dirStats.isDirectory()).toBe(true);

    // Check file was moved and renamed
    expect(await fs.readFile('/docs/deployment/_index.md', 'utf8')).toBe('# Deployment');

    // Check original file was removed
    await expect(fs.readFile('/docs/deployment.md', 'utf8')).rejects.toThrow();
  });

  it('skips already moved files', async () => {
    // Pre-create target structure
    await fs.mkdir('/docs/deployment');
    await fs.writeFile('/docs/deployment/_index.md', 'Already moved');

    // Try to move file
    await mover.moveParentFile('/docs/deployment.md');

    // Check content wasn't changed
    const content = await fs.readFile('/docs/deployment/_index.md', 'utf8');
    expect(content).toBe('Already moved');
  });

  it('tracks moved files', async () => {
    await mover.moveParentFile('/docs/deployment.md');

    const movedFiles = mover.getMovedFiles();
    expect(movedFiles.get('/docs/deployment.md')).toBe('/docs/deployment/_index.md');
  });

  it('handles parent file with no children without changing other files', async () => {
    await mover.moveParentFile('/docs/faq.md');

    // Verify faq.md is moved to its own directory
    expect(await fs.readFile('/docs/faq/_index.md', 'utf8')).toBe('# FAQ');

    // Verify other files remain untouched
    expect(await fs.readFile('/docs/architecture.md', 'utf8')).toBe('# Architecture');
    expect(await fs.readFile('/docs/deployment.md', 'utf8')).toBe('# Deployment');

    // Verify original faq.md no longer exists
    await expect(fs.readFile('/docs/faq.md', 'utf8')).rejects.toThrow();
  });
});