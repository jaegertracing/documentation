import path from 'path';
import type { FileSystem } from './types.js';

export class FileWalker {
  private readonly fs: FileSystem;

  constructor(fs: FileSystem) {
    this.fs = fs;
  }

  /**
   * Walks through files in a directory and yields each file path
   * @param dirPath - Directory to walk through
   * @param recursive - Whether to walk through subdirectories (defaults to false)
   * @yields Path to each file in the directory (only .md files)
   */
  async *walkFiles(dirPath: string, recursive = false): AsyncGenerator<string> {
    const entries = await this.fs.readdir(dirPath);

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);

      try {
        const stats = await this.fs.stat(fullPath);
        if (stats.isDirectory()) {
          // Only recurse if recursive flag is true
          if (recursive) {
            yield* this.walkFiles(fullPath, recursive);
          }
        } else if (entry.endsWith('.md')) {
          yield fullPath;
        }
      } catch (error) {
        if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }
}