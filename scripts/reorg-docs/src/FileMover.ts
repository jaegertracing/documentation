import path from 'path';
import yaml from 'js-yaml';
import type { FileSystem } from './types.js';
import { LinkFixer } from './LinkFixer.js';
import { FileWalker } from './FileWalker.js';

interface FrontMatter {
  title?: string;
  children?: Array<{
    title: string;
    url: string;
  }>;
}

export class FileMover {
  private readonly docsDir: string;
  private readonly fs: FileSystem;
  private readonly linkFixer: LinkFixer;
  private readonly walker: FileWalker;
  private movedFiles: Map<string, string>;

  /**
   * @param docsDir - Root directory containing documentation files
   * @param fs - File system module (fs/promises or memfs for testing)
   */
  constructor(docsDir: string, fs: FileSystem) {
    this.docsDir = docsDir;
    this.fs = fs;
    this.linkFixer = new LinkFixer(docsDir, fs);
    this.walker = new FileWalker(fs);
    this.movedFiles = new Map();
  }

  /**
   * Process all files in the docs directory
   */
  async processDirectory(): Promise<void> {
    // First pass: Move all files (non-recursive since we only move from top level)
    for await (const filePath of this.walker.walkFiles(this.docsDir, false)) {
      await this.testAndMove(filePath);
    }

    // Second pass: Update links in all files (recursive to find moved files)
    for await (const filePath of this.walker.walkFiles(this.docsDir, true)) {
      await this.linkFixer.updateLinksInFile(filePath, this.movedFiles);
    }
  }

  /**
   * Tests if a file should be moved and moves it and its children if necessary
   * @param filePath - Path to the file to test and potentially move
   * @returns True if the file or any of its children were moved
   */
  async testAndMove(filePath: string): Promise<boolean> {
    const initialMoveCount = this.movedFiles.size;
    const shouldMoveResult = await this.shouldMove(filePath);
    if (shouldMoveResult) {
      // Get children before moving the parent file
      const children = await this.getChildren(filePath);
      await this.moveParentFile(filePath);
      await this.moveChildrenFromList(filePath, children);
    }
    return this.movedFiles.size > initialMoveCount;
  }

  /**
   * Determines if a file should be moved based on its front matter
   */
  async shouldMove(filePath: string): Promise<boolean> {
    try {
      // Never move _index.md files
      if (path.basename(filePath) === '_index.md') {
        return false;
      }

      const content = await this.fs.readFile(filePath, 'utf8');
      const matches = content.match(/^---\n([\s\S]*?)\n---/);
      if (!matches) return false; // No front matter

      const frontMatter = yaml.load(matches[1]) as FrontMatter;
      return Boolean(frontMatter?.children?.length);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
      return false;
    }
  }

  /**
   * Gets the children from a file's front matter
   */
  private async getChildren(filePath: string): Promise<string[]> {
    try {
      const content = await this.fs.readFile(filePath, 'utf8');
      const matches = content.match(/^---\n([\s\S]*?)\n---/);
      if (!matches) return []; // No front matter

      const frontMatter = yaml.load(matches[1]) as FrontMatter;
      return frontMatter?.children?.map(child => child.url) ?? [];
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
      return [];
    }
  }

  /**
   * Move a parent file to _index.md in its own directory and update any links to moved files
   * @param parentFile - Path to the parent file
   */
  private async moveParentFile(parentFile: string): Promise<void> {
    try {
      // Create parent directory
      const parentDir = path.join(path.dirname(parentFile), path.basename(parentFile, '.md'));
      await this.fs.mkdir(parentDir, { recursive: true });

      // Move parent to _index.md if not already there
      const indexFile = path.join(parentDir, '_index.md');
      try {
        await this.fs.access(indexFile);
      } catch {
        await this.fs.rename(parentFile, indexFile);
        this.movedFiles.set(parentFile, indexFile);
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Move child files referenced in parent's front matter and update their links
   * @param parentFile - Path to the parent file
   * @param children - List of child URLs to move
   */
  private async moveChildrenFromList(parentFile: string, children: string[]): Promise<void> {
    try {
      const parentDir = path.join(path.dirname(parentFile), path.basename(parentFile, '.md'));

      for (const childUrl of children) {
        const childFile = path.join(path.dirname(parentFile), `${childUrl}.md`);
        try {
          await this.fs.access(childFile);

          const newLocation = path.join(parentDir, path.basename(childFile));
          try {
            await this.fs.access(newLocation);
          } catch {
            await this.fs.rename(childFile, newLocation);
            this.movedFiles.set(childFile, newLocation);
          }
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Get the map of moved files
   * @returns Map of original paths to new locations
   */
  getMovedFiles(): ReadonlyMap<string, string> {
    return this.movedFiles;
  }
}