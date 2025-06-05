import { Volume } from 'memfs';
import { FileMover } from '../../src/FileMover.js';
import type { FileSystem } from '../../src/types.js';

describe('FileMover: idempotence', () => {
  let vol: any;
  let fs: FileSystem;
  let mover: FileMover;

  beforeEach(() => {
    vol = Volume.fromJSON({
      '/docs/operations.md': `---
title: Operations Guide
children:
  - title: Monitoring
    url: monitoring
---
# Operations Guide`,
      '/docs/monitoring.md': `---
title: Monitoring Jaeger
navtitle: Monitoring
hasparent: true
---
# Monitoring Guide`
    });
    fs = vol.promises as unknown as FileSystem;
    mover = new FileMover('/docs', fs);
  });

  it('produces identical results when run multiple times', async () => {
    // First run
    await mover.processDirectory();
    const firstRunContent = await fs.readFile('/docs/operations/monitoring.md', 'utf8');

    // Second run with a fresh mover
    mover = new FileMover('/docs', fs);
    await mover.processDirectory();
    const secondRunContent = await fs.readFile('/docs/operations/monitoring.md', 'utf8');

    // Contents should be identical
    expect(secondRunContent).toBe(firstRunContent);
  });

  it('does not duplicate aliases', async () => {
    // Run twice
    await mover.processDirectory();
    mover = new FileMover('/docs', fs);
    await mover.processDirectory();

    // Check the content
    const content = await fs.readFile('/docs/operations/monitoring.md', 'utf8');
    const aliasMatches = content.match(/aliases:/g);
    expect(aliasMatches?.length).toBe(1);  // Should only have one aliases: field
    expect(content).toContain('aliases: [../monitoring]');  // Should have the correct format
  });

  it('finds no files to move after initial processing', async () => {
    // First run should move files
    await mover.processDirectory();
    const initialMovedCount = mover.getMovedFiles().size;
    expect(initialMovedCount).toBeGreaterThan(0);

    // Second moveFiles should find nothing to move
    await mover.moveFiles();
    expect(mover.getMovedFiles().size).toBe(initialMovedCount);
  });
});