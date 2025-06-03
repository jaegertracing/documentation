# Documentation Reorganization Scripts

## reorganize_docs.pl

This script reorganizes documentation files by moving parent pages to `_index.md` files and their children into appropriate subdirectories. It also handles updating relative links to maintain correct references after the moves.

### Link Handling Requirements

The script handles link updates in a three-pass approach:

1. **First Pass**: Moves files to their new locations
   - Parent pages become `_index.md` in their subdirectories
   - Child pages move into their parent's subdirectory

2. **Second Pass**: Updates links based on file movements
   - Tracks moved files in `%moved_files` hash
   - Tracks which files became `_index.md` in `%became_index` hash
   - Tracks parent directories in `%parent_dirs` hash

3. **Third Pass**: Fixes any remaining incorrect links

### Link Update Cases

#### 1. Links in Root _index.md

Root `_index.md` uses relative links starting with `./`:
- When target file moved to subdirectory:
  ```markdown
  [Memory](./memory/) → [Memory](./storage/memory/)
  ```
- When target became _index.md: Link preserved
  ```markdown
  [Architecture](./architecture/) → [Architecture](./architecture/)
  ```

#### 2. Links in Unmoved Files

Files that weren't moved use single-level parent references:
- When target moved to subdirectory:
  ```markdown
  [Memory](../memory/) → [Memory](../storage/memory/)
  ```
- When target became _index.md: Link preserved
  ```markdown
  [Architecture](../architecture/) → [Architecture](../architecture/)
  ```

#### 3. Links in Moved Files

Files that were moved have different handling based on target location:

a. **Same Directory Target**
   - Uses `./` for files in the same directory:
   ```markdown
   [Memory](../memory/) → [Memory](./memory/)
   ```

b. **Different Directory Target**
   - Uses `../../` to get back to root first:
   ```markdown
   [Architecture](../architecture/) → [Architecture](../../architecture/)
   [Deploy](../deployment/) → [Deploy](../../deployment/)
   ```

#### 4. Special Cases

1. **Files That Became _index.md**
   - Links pointing to files that became `_index.md` are preserved
   - The script tracks these in `%became_index` hash

2. **Parent Directory Detection**
   - Uses `basename(dirname($filepath))` to reliably detect parent directory
   - Compares with tracked parent in `%parent_dirs` hash

### Example Directory Structure

Before:
```
docs/
├── _index.md
├── architecture.md
├── deployment.md
├── windows.md
└── memory.md
```

After:
```
docs/
├── _index.md
├── architecture/
│   └── _index.md
├── deployment/
│   ├── _index.md
│   └── windows.md
└── storage/
    └── memory.md
```

### Usage

```bash
./reorganize_docs.pl <directory>
```

The script will:
1. Move files to their new locations
2. Update all relative links
3. Print a summary of changes made

# Documentation File Organization

## Requirements

1. For any other markdown file that has a `children` section in its front matter:
   - Create a directory with the same name as the file (without the `.md` extension)
   - Move the parent file into that directory and rename it to `_index.md`
   - Move each child file (referenced by the `url` field in the `children` array) into that directory
   - Update links in the moved parent file:
     - For links to files that became `_index.md`: add extra `../` to reach root level
     - For links to files that were moved: add parent directory and extra `../`
     - For links to unmoved files: add extra `../` to reach root level

2. Front Matter Structure
   - The `children` section in the front matter should be preserved
   - Each child entry in the front matter has:
     - `title`: The title of the child page
     - `url`: The URL/filename of the child page (without `.md` extension)

3. Example:
   If we have a file `features.md` with front matter:
   ```yaml
   ---
   title: Features
   children:
   - title: Architecture
     url: architecture
   - title: Sampling
     url: sampling
   ---
   ```

   It should be reorganized as:
   ```
   features/
   ├── _index.md (previously features.md)
   ├── architecture.md
   └── sampling.md
   ```

4. The script should:
   - Process files non-recursively (only in the specified directory)
   - Skip files that have already been moved, and so be idempotent
   - Handle cases where child files might already be in their target location
   - Preserve all content and front matter during moves
   - Report actions taken and any issues encountered