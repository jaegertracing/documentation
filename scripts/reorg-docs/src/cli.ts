#!/usr/bin/env node

import { promises as fs } from 'fs';
import { FileMover } from './FileMover.js';

async function main() {
  try {
    // Get docs directory from command line or use default
    const docsDir = process.argv[2] || 'content/docs/v2/2.6';

    // Ensure docs directory exists
    try {
      await fs.access(docsDir);
    } catch {
      console.error(`Directory not found: ${docsDir}`);
      process.exit(1);
    }

    console.log(`Processing documentation in: ${docsDir}`);

    // Create file mover instance and process the directory
    const mover = new FileMover(docsDir, fs);
    await mover.processDirectory();

    // Print summary of moved files
    const movedFiles = mover.getMovedFiles();
    if (movedFiles.size > 0) {
      console.log('\nMoved files:');
      for (const [from, to] of movedFiles.entries()) {
        console.log(`  ${from} → ${to}`);
      }
    } else {
      console.log('\nNo files needed to be moved.');
    }
    console.log(`\nTotal files moved: ${movedFiles.size}`);

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();