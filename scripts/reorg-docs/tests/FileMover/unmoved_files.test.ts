import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

describe('FileMover: handling of unmoved files', () => {
  let vol: any;
  let fs: FileSystem;
  let fileMover: FileMover;

  beforeEach(() => {
    // Set up test files including ones that should not move
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
      '/docs/faq.md': '# FAQ',
      '/docs/sampling.md': '# Sampling',
      '/docs/terminology.md': '# Terminology',
      '/docs/client-libraries.md': '# Client Libraries',
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
    fileMover = new FileMover('/docs', fs);
  });

  it('handles parent file with no children without changing other files', async () => {
    // Move a file that has no children
    const moved = await fileMover.testAndMove('/docs/faq.md');
    expect(moved).toBe(false);

    // Verify faq.md is still in its original location
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# FAQ');

    // Verify other files remain untouched
    expect(await fs.readFile('/docs/architecture.md', 'utf8')).toContain('# Architecture Overview');
    expect(await fs.readFile('/docs/sampling.md', 'utf8')).toBe('# Sampling');
    expect(await fs.readFile('/docs/terminology.md', 'utf8')).toBe('# Terminology');
    expect(await fs.readFile('/docs/client-libraries.md', 'utf8')).toBe('# Client Libraries');
  });

  it('leaves standalone files untouched when no moves are requested', async () => {
    // Set up a file system with only files that should not move
    vol = Volume.fromJSON({
      '/docs/faq.md': '# Frequently Asked Questions'
    });
    fs = vol.promises as unknown as FileSystem;
    fileMover = new FileMover('/docs', fs);

    // Try to move a non-existent file
    const moved = await fileMover.testAndMove('/docs/architecture.md');
    expect(moved).toBe(false);

    // Verify faq.md is still in its original location and unchanged
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# Frequently Asked Questions');

    // Verify no files were tracked as moved
    expect(fileMover.getMovedFiles().size).toBe(0);
  });

  it('preserves files not mentioned in any moves', async () => {
    // Set up a file system with a mix of files to move and preserve
    vol = Volume.fromJSON({
      '/docs/architecture.md': `---
title: Architecture
children:
  - title: Sampling
    url: sampling
---
# Architecture Overview`,
      '/docs/sampling.md': '# Sampling',
      '/docs/faq.md': '# FAQ',
      '/docs/monitoring.md': '# Monitoring',
      '/docs/client-libraries.md': '# Client Libraries'
    });
    fs = vol.promises as unknown as FileSystem;
    fileMover = new FileMover('/docs', fs);

    // Move architecture.md and its children
    const moved = await fileMover.testAndMove('/docs/architecture.md');
    expect(moved).toBe(true);

    // Verify files that should move are moved
    expect(await fs.readFile('/docs/architecture/_index.md', 'utf8')).toContain('# Architecture Overview');
    expect(await fs.readFile('/docs/architecture/sampling.md', 'utf8')).toBe('# Sampling');

    // Verify unmoved files remain in their original locations and unchanged
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe('# FAQ');
    expect(await fs.readFile('/docs/monitoring.md', 'utf8')).toBe('# Monitoring');
    expect(await fs.readFile('/docs/client-libraries.md', 'utf8')).toBe('# Client Libraries');

    // Verify only the expected files were tracked as moved
    const movedFiles = fileMover.getMovedFiles();
    expect(movedFiles.size).toBe(2); // architecture.md and sampling.md
    expect(movedFiles.has('/docs/faq.md')).toBe(false);
    expect(movedFiles.has('/docs/monitoring.md')).toBe(false);
    expect(movedFiles.has('/docs/client-libraries.md')).toBe(false);
  });

  it('does not move _index.md even if it has children', async () => {
    // Get initial content and state
    const indexContent = await fs.readFile('/docs/_index.md', 'utf8');
    const faqContent = await fs.readFile('/docs/faq.md', 'utf8');

    // Try to move the file
    const moved = await fileMover.testAndMove('/docs/_index.md');
    expect(moved).toBe(false);

    // Verify _index.md is still in its original location with original content
    expect(await fs.readFile('/docs/_index.md', 'utf8')).toBe(indexContent);

    // Verify faq.md is still in its original location and hasn't been moved
    expect(await fs.readFile('/docs/faq.md', 'utf8')).toBe(faqContent);
    await expect(fs.stat('/docs/_index/faq.md')).rejects.toThrow();

    // Verify no _index directory was created
    await expect(fs.stat('/docs/_index')).rejects.toThrow();

    // Verify no files were tracked as moved
    expect(fileMover.getMovedFiles().size).toBe(0);
  });
});