import path from 'path';
import type { FileSystem } from './types.js';

let count = 0;
function regexX(strings: TemplateStringsArray, ...values: string[]) {
  let pattern = strings.raw.join('')
    .replace(/\s+#.*$/gm, '') // remove comments
    .replace(/\s+/g, '');  // remove whitespace
  // if (count++ < 3) console.log(` >> ${pattern}\n`);
  return pattern;
}

/**
 * Represents a link substitution to be applied
 */
interface LinkSubstitution {
  from: string;      // Original markdown link
  to: string;        // New markdown link
  explanation?: string; // Optional explanation for debugging
}

/**
 * LinkFixer handles updating markdown links in files during documentation reorganization.
 *
 * Strategy:
 * The link updating logic is divided into distinct cases based on the type of file being processed:
 *
 * 1. Top-level _index.md file:
 *    - Special handling as it contains links to both moved and unmoved files
 *    - Must preserve link format (with/without trailing slash)
 *
 * 2. Top-level non-index files that remain post-reorg:
 *    - Files that weren't moved but may contain links to moved files
 *    - Links need to be updated to point to new locations
 *
 * 3. Moved files:
 *    3.1 Files that became index files (_index.md):
 *        - Parent files moved to subdirectories and renamed
 *        - Links need to be updated relative to new location
 *
 *    3.2 Files moved without becoming index files:
 *        - Child files moved to parent's directory
 *        - Links need to be updated relative to new location
 */
export class LinkFixer {
  private readonly docsDir: string;
  private readonly fs: FileSystem;

  constructor(docsDir: string, fs: FileSystem) {
    this.docsDir = docsDir;
    this.fs = fs;
  }

  /**
   * Normalizes a path for comparison purposes only
   * This is used to match paths, not for the final output
   */
  private normalizeForComparison(filePath: string): string {
    return filePath.replace(/\/$/, '').replace(/\.md$/, '');
  }

  /**
   * Updates markdown links in a file based on moved file locations
   * Delegates to specific handlers to determine substitutions, then applies them.
   */
  async updateLinksInFile(filePath: string, movedFiles: Map<string, string>): Promise<void> {
    const content = await this.fs.readFile(filePath, 'utf8');
    const fileName = path.basename(filePath);
    const isIndex = fileName === '_index.md';
    const isTopLevel = path.dirname(filePath) === this.docsDir;

    // if (filePath.includes('architecture/_index.md')) {
    //  console.log(`\n > 33331 ${filePath} content: `);
    //}

    // Get substitutions from the appropriate handler
    let substitutions: LinkSubstitution[];
    if (isTopLevel && isIndex) {
      substitutions = await this.handleTopLevelIndex(content, filePath, movedFiles);
    } else if (isTopLevel) {
      substitutions = await this.handleTopLevelFile(content, filePath, movedFiles);
    } else if (isIndex) {
      substitutions = await this.handleMovedIndexFile(content, filePath, movedFiles);
    } else {
      substitutions = await this.handleMovedFile(content, filePath, movedFiles);
    }

    // Sort substitutions by length (longest first) to handle nested links correctly
    substitutions.sort((a, b) => b.from.length - a.from.length);

    // Apply all substitutions to the content
    let updatedContent = content;
    for (const { from, to } of substitutions) {
      updatedContent = updatedContent.replaceAll(from, to);
    }

    // Write the updated content back to the file
    await this.fs.writeFile(filePath, updatedContent);
  }

  /**
   * Handles link updates in the top-level _index.md file.
   * Returns list of substitutions to be applied.
   */
  private async handleTopLevelIndex(content: string, filePath: string, movedFiles: Map<string, string>): Promise<LinkSubstitution[]> {
    return this.findLinkSubstitutions(content, filePath, movedFiles, {
      preserveTrailingSlash: true,
      preferDirectoryStyle: true,
      preserveOriginalFormat: true
    });
  }

  /**
   * Handles link updates in top-level files that weren't moved.
   * Returns list of substitutions to be applied.
   */
  private async handleTopLevelFile(content: string, filePath: string, movedFiles: Map<string, string>): Promise<LinkSubstitution[]> {
    return this.findLinkSubstitutions(content, filePath, movedFiles, {
      preserveTrailingSlash: true,
      preferDirectoryStyle: true,
      preserveOriginalFormat: true
    });
  }

  /**
   * Handles link updates in files that were moved and became _index.md files.
   * Returns list of substitutions to be applied.
   */
  private async handleMovedIndexFile(content: string, filePath: string, movedFiles: Map<string, string>): Promise<LinkSubstitution[]> {
    return this.findLinkSubstitutions(content, filePath, movedFiles, {
      preserveTrailingSlash: true,
      preferDirectoryStyle: true,
      preserveOriginalFormat: true
    });
  }

  /**
   * Handles link updates in files that were moved but didn't become index files.
   * Returns list of substitutions to be applied.
   */
  private async handleMovedFile(content: string, filePath: string, movedFiles: Map<string, string>): Promise<LinkSubstitution[]> {
    return this.findLinkSubstitutions(content, filePath, movedFiles, {
      preserveTrailingSlash: true,
      preferDirectoryStyle: true,
      preserveOriginalFormat: true
    });
  }

  /**
   * Core link substitution finding logic used by handlers.
   * Returns list of substitutions to be applied.
   */
  private findLinkSubstitutions(
    content: string,
    filePath: string,
    movedFiles: Map<string, string>,
    options: {
      preserveTrailingSlash: boolean;
      preferDirectoryStyle: boolean;
      preserveOriginalFormat: boolean;
    }
  ): LinkSubstitution[] {
    const currentDir = path.dirname(filePath);
    const isCurrentFileIndex = path.basename(filePath) === '_index.md';
    const wasCurrentFileMoved = movedFiles.has(filePath);
    const substitutions: LinkSubstitution[] = [];

    // Regular expression to match markdown links
    const linkPattern = new RegExp(regexX`
      # Link text
      \[
        ([^\]]+)
      \]

      # Link reference
      \(
        # Path capture group
        (
          (?:\.\/|\.\.\/)*  # Optional prefixes of ./ or ../
          [^)#\s]+    # Path content
        )
        # Optional hash capture group
        (?:#
          ([^)\s]+)
        )?
      \)
    `, 'g');

    let match;
    while ((match = linkPattern.exec(content)) !== null) {
      const [fullMatch, linkText, linkPath, hash] = match;
      const hashFragment = hash ? `#${hash}` : '';

      // console.log(`\nLink: ${fullMatch}`);

      // Skip external links
      if (linkPath.startsWith('http')) continue;

      // Skip root-relative links
      if (linkPath.startsWith('/')) continue;

      // Preserve the exact format of the original link
      const hasTrailingSlash = linkPath.endsWith('/');
      const originalPrefix = linkPath.match(/^(?:\.\/|\.\.\/)+/)?.[0] || '';
      const pathWithoutPrefix = linkPath.slice(originalPrefix.length);

      // Check if the original path had .md extension
      const hadMdExtension = pathWithoutPrefix.endsWith('.md');

      // Only normalize for comparison
      const normalizedForComparison = this.normalizeForComparison(pathWithoutPrefix);

      // Check if this path needs to be updated
      let matched = false;
      for (const [oldPath, targetPath] of movedFiles.entries()) {
        const oldNormalized = this.normalizeForComparison(oldPath);
        const pathBasename = path.basename(normalizedForComparison);
        const oldBasename = path.basename(oldNormalized);

        if (oldBasename === pathBasename) {
          const targetDir = path.dirname(targetPath);
          const relPath = path.relative(currentDir, targetDir);
          const targetBasename = path.basename(targetPath);
          const isIndexFile = targetBasename === '_index.md';

          // Preserve the original prefix exactly as it was
          // If there was no prefix and we need to go up directories, use ../
          const needsParentDir = relPath.startsWith('..');
          const prefix = !isCurrentFileIndex ? '../' :
            originalPrefix && !needsParentDir ? './' : '';

          // Build the new path preserving original format
          let newPath;
          if (isIndexFile && options.preferDirectoryStyle) {
            // For index files, use directory style without _index
            newPath = prefix + relPath + (hasTrailingSlash || options.preserveTrailingSlash ? '/' : '');
          } else {
            // For regular files, preserve original format
            const basename = path.basename(targetPath, '.md');
            const extension = hadMdExtension ? '.md' : '';
            const trailingSlash = hasTrailingSlash ? '/' : '';
            newPath = prefix + path.join(relPath, basename) + extension + trailingSlash;
          }

          const newMarkdownLink = `[${linkText}](${newPath}${hashFragment})`;
          substitutions.push({
            from: fullMatch,
            to: newMarkdownLink,
            explanation: `File ${oldPath} moved to ${targetPath}, updating link to use new parent directory ${targetBasename}`
          });
          matched = true;
          break;
        }
      }
      if (matched) continue;

      // A non-external, relative link to a resource that wasn't moved.
      // If the current file was moved (and hence was moved into a subdirectory),
      // and linkPath starts with `../`, we need to adjust it.
      const wasCurrentFileMoved = Array.from(movedFiles.values()).includes(filePath);
      if (!(originalPrefix.startsWith('../') && !isCurrentFileIndex && wasCurrentFileMoved)) continue;

      const newPath : string = originalPrefix + linkPath;
      const newMarkdownLink = `[${linkText}](${newPath}${hashFragment})`;
      substitutions.push({
        from: fullMatch,
        to: newMarkdownLink,
        explanation: `File ${linkPath} moved to ${newPath}. Current file was moved into a subdirectory, and linkPath starts with '../'.`
      });
    }

    return substitutions;
  }
}