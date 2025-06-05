import path from 'path';
import yaml from 'js-yaml';
import type { FileSystem } from './types.js';
import { LinkFixer } from './LinkFixer.js';
import { FileWalker } from './FileWalker.js';

interface FrontMatter {
  title?: string;
  linkTitle?: string;
  navTitle?: string;
  description?: string;
  aliases?: string[];
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
    await this.moveFiles();
    await this.updateLinks();
  }

  /**
   * First pass: Move all files (non-recursive since we only move from top level)
   */
  async moveFiles(): Promise<void> {
    for await (const filePath of this.walker.walkFiles(this.docsDir, false)) {
      await this.testAndMove(filePath);
    }
  }

  /**
   * Second pass: Update links in all files (recursive to find moved files)
   */
  private async updateLinks(): Promise<void> {
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
      await this.addAliasesToMovedChildren(filePath, children);
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
  /*private*/ async moveParentFile(parentFile: string): Promise<void> {
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

  /**
   * Adds aliases to moved child files pointing to their original locations
   * @param parentFile - Path to the parent file
   * @param children - List of child URLs that were moved
   */
  private async addAliasesToMovedChildren(parentFile: string, children: string[]): Promise<void> {
    const parentDir = path.join(path.dirname(parentFile), path.basename(parentFile, '.md'));

    for (const childUrl of children) {
      const oldPath = path.join(path.dirname(parentFile), `${childUrl}.md`);
      const newPath = path.join(parentDir, path.basename(oldPath));

      const content = await this.fs.readFile(newPath, 'utf8');
      const alias = this.calculateAlias(oldPath, newPath);
      const modifiedContent = this.addAliasToFrontMatter(content, alias);
      await this.fs.writeFile(newPath, modifiedContent);
    }
  }

  /**
   * Adds an alias to the front matter of a file
   * @param content - The file content
   * @param alias - The alias to add
   * @returns The modified content
   */
  private addAliasToFrontMatter(content: string, alias: string): string {
    const matches = content.match(/^---\n([\s\S]*?)\n---/);
    if (!matches) return content;

    const frontMatter = yaml.load(matches[1]) as FrontMatter;
    const orderedFrontMatter: Record<string, any> = {};

    // Track if we've added the aliases field
    let aliasesAdded = false;
    let lastTargetField = '';

    // First pass: copy fields and track the last target field
    for (const [key, value] of Object.entries(frontMatter)) {
      if (['description', 'linkTitle', 'navtitle', 'title'].includes(key)) {
        lastTargetField = key;
      }
    }

    // Second pass: copy fields and add aliases after the last target field
    for (const [key, value] of Object.entries(frontMatter)) {
      orderedFrontMatter[key] = value;
      if (!aliasesAdded && key === lastTargetField) {
        orderedFrontMatter.aliases = [alias];
        aliasesAdded = true;
      }
    }

    // If we haven't added aliases yet (none of the target fields existed), add it at the end
    if (!aliasesAdded) {
      orderedFrontMatter.aliases = [alias];
    }

    const newFrontMatter = yaml.dump(orderedFrontMatter, {
      flowLevel: 1  // Force flow style (array syntax) for arrays
    });
    return content.replace(matches[0], `---\n${newFrontMatter}---`);
  }

  /**
   * Calculates the relative path from a new file location to its old location
   * @param oldPath - The original file path
   * @param newPath - The new file path
   * @returns The relative path to use as an alias
   */
  private calculateAlias(oldPath: string, newPath: string): string {
    const oldDir = path.dirname(oldPath);
    const newDir = path.dirname(newPath);
    const relPath = path.relative(newDir, oldDir);
    const oldBase = path.basename(oldPath, '.md');
    return path.join(relPath, oldBase);
  }
}