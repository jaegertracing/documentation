import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

describe('Sanity checks', () => {
  let vol: any;
  let fs: FileSystem;
  let mover: FileMover;

  beforeEach(async () => {
    // Set up minimal file system with just faq.md
    vol = Volume.fromJSON({
      '/docs/faq.md': '# FAQ',
      '/docs/_index.md': `---
title: Documentation Root
children:
  - title: FAQ
    url: faq
---
# Documentation Home`
    });
    fs = vol.promises as unknown as FileSystem;
    await fs.mkdir('/docs', { recursive: true });

    mover = new FileMover('/docs', fs);
  });

  it('returns false and does nothing for a standalone file', async () => {
    // Verify initial state
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# FAQ');

    // Test and move the file
    const moved = await mover.testAndMove('/docs/faq.md');
    expect(moved).toBe(false);

    // Verify nothing changed
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# FAQ');
    expect(mover.getMovedFiles().size).toBe(0);
  });

  it('processDirectory does nothing in a file system with just faq.md', async () => {
    const contents = await fs.readdir('/docs');

    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# FAQ');
    await mover.processDirectory();
    // Verify nothing changed
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# FAQ');
    expect(mover.getMovedFiles().size).toBe(0);
  });

  it('does not move _index.md even if it has children', async () => {
    // Get initial content and state
    const indexContent = await fs.readFile('/docs/_index.md', 'utf8');
    const faqContent = await fs.readFile('/docs/faq.md', 'utf8');

    // Try to move the file
    const moved = await mover.testAndMove('/docs/_index.md');
    expect(moved).toBe(false);

    // Verify _index.md is still in its original location with original content
    expect(await fs.readFile('/docs/_index.md', 'utf8')).toBe(indexContent);

    // Verify faq.md is still in its original location and hasn't been moved
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe(faqContent);
    await expect(fs.stat('/docs/_index/faq.md')).rejects.toThrow();

    // Verify no _index directory was created
    await expect(fs.stat('/docs/_index')).rejects.toThrow();

    // Verify no files were tracked as moved
    expect(mover.getMovedFiles().size).toBe(0);
  });
});