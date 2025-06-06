import { Volume } from 'memfs';
import { FileMover } from '../src/FileMover.js';
import type { FileSystem } from '../src/types.js';
import * as fs from 'fs/promises';
import path from 'path';

const DOCS_VERSION = '2.6';
const DOCS_MAJOR_VERSION = DOCS_VERSION[0];
const DOCS_VERSION_PATH = `v${DOCS_MAJOR_VERSION}/${DOCS_VERSION}`;

describe('Integration tests with real docs', () => {
  const REPO_ROOT = path.resolve(process.cwd(), '../..');
  const TMP_ROOT = path.join(REPO_ROOT, 'tmp');
  const TEST_DATA_ROOT = path.join(TMP_ROOT, 'test-data');
  const TEST_DOCS_PATH = path.join(TEST_DATA_ROOT, DOCS_VERSION);
  const LOG_FILE = path.join(TMP_ROOT, 'integration.test-log.txt');
  let realFs: FileSystem;
  let mover: FileMover;
  let movedFiles: ReadonlyMap<string, string>;

  // Helper to read and check file contents
  async function _readFile(relativePath: string): Promise<string> {
    return realFs.readFile(path.join(TEST_DOCS_PATH, relativePath), 'utf8');
  }

  beforeAll(async () => {
    // Clean up test directory before starting
    await fs.rm(TEST_DATA_ROOT, { recursive: true, force: true });

    await fs.mkdir(TMP_ROOT, { recursive: true }); // Create tmp root if it doesn't exist
    await fs.mkdir(TEST_DATA_ROOT, { recursive: true }); // Create test root if it doesn't exist

    // Copy real docs from content/docs/vX/X.Y to tmp/test-data/X.Y
    const sourceDir = path.resolve(REPO_ROOT, `content/docs/${DOCS_VERSION_PATH}`);
    await copyDirectory(sourceDir, TEST_DOCS_PATH);

    realFs = fs as unknown as FileSystem;

    // Initialize and run FileMover
    mover = new FileMover(TEST_DOCS_PATH, realFs);
    // We're already updated the repo files, so assume that it's been done:
    await mover.processDirectory();
    movedFiles = mover.getMovedFiles();
  });

  afterAll(async () => {
    // Leave the test directory results for debugging
    // await fs.rm(TEST_DATA_ROOT, { recursive: true, force: true });
  });

  it.skip('moves some files (sanity check)', () => {
    expect(movedFiles.size).toBeGreaterThan(0);
  });

  it('moves no files, since they\'ve been updated already (sanity check)', () => {
    expect(movedFiles.size).toEqual(0);
  });


  it('leaves _index.md where it is (sanity check)', async () => {
    const rootIndex = await _readFile('_index.md');
    expect(rootIndex).toContain('title: Docs');
  });


  it.skip('creates the right file system layout for all the moved files', () => {
    // Convert the moved files to relative paths for comparison
    const actualMoves: string[] = [];
    movedFiles.forEach((newPath, oldPath) => {
      const relativeOldPath = path.relative(TEST_DATA_ROOT, oldPath);
      const relativeNewPath = path.relative(TEST_DATA_ROOT, newPath);
      actualMoves.push(`      ${relativeOldPath} -> ${relativeNewPath}`);
    });

    const expectedMoves = `      2.6/architecture.md -> 2.6/architecture/_index.md
      2.6/apis.md -> 2.6/architecture/apis.md
      2.6/sampling.md -> 2.6/architecture/sampling.md
      2.6/spm.md -> 2.6/architecture/spm.md
      2.6/terminology.md -> 2.6/architecture/terminology.md
      2.6/deployment.md -> 2.6/deployment/_index.md
      2.6/configuration.md -> 2.6/deployment/configuration.md
      2.6/frontend-ui.md -> 2.6/deployment/frontend-ui.md
      2.6/kubernetes.md -> 2.6/deployment/kubernetes.md
      2.6/windows.md -> 2.6/deployment/windows.md
      2.6/security.md -> 2.6/deployment/security.md
      2.6/external-guides.md -> 2.6/external-guides/_index.md
      2.6/migration.md -> 2.6/external-guides/migration.md
      2.6/operations.md -> 2.6/operations/_index.md
      2.6/monitoring.md -> 2.6/operations/monitoring.md
      2.6/troubleshooting.md -> 2.6/operations/troubleshooting.md
      2.6/performance-tuning.md -> 2.6/operations/performance-tuning.md
      2.6/tools.md -> 2.6/operations/tools.md
      2.6/storage.md -> 2.6/storage/_index.md
      2.6/memory.md -> 2.6/storage/memory.md
      2.6/badger.md -> 2.6/storage/badger.md
      2.6/cassandra.md -> 2.6/storage/cassandra.md
      2.6/elasticsearch.md -> 2.6/storage/elasticsearch.md
      2.6/kafka.md -> 2.6/storage/kafka.md
      2.6/opensearch.md -> 2.6/storage/opensearch.md`;

    expect(actualMoves.join('\n')).toBe(expectedMoves);
  });

  describe('really moved the files - content sanity check', () => {
    it('moves parent files to _index.md', async () => {
      const architectureIndex = await _readFile('architecture/_index.md');
      expect(architectureIndex).toContain('title: Architecture');
    });

    it('moves child files to parent directories', async () => {
      const samplingFile = await _readFile('architecture/sampling.md');
      expect(samplingFile).toContain('title: Sampling');
    });

    it('updates relative links in moved files', async () => {
      const samplingFile = await _readFile('architecture/sampling.md');
      expect(samplingFile).toContain('[remote-sampling-api]: ../apis/');  // Links to other sections should be relative to root
    });
  });

  describe('preserves external links in root _index.md', () => {
    let rootIndex: string;

    beforeEach(async () => {
      rootIndex = await _readFile('_index.md');
    });

    it('preserves absolute links', () => {
      expect(rootIndex).toContain('[hear from you](/get-in-touch/)');
    });

    it('preserves section-relative links to pages that didn\'t move', () => {
      expect(rootIndex).toContain('[Getting Started](./getting-started/)');
    });

    it('preserves external URLs', () => {
      expect(rootIndex).toContain('[Uber Technologies](http://uber.github.io)');
      expect(rootIndex).toContain('[Cloud Native Computing Foundation](https://cncf.io/)');
    });
  });

  describe('updates links in files not moved by reorg', () => {
    let gettingStartedContent: string;

    beforeEach(async () => {
      gettingStartedContent = await _readFile('getting-started.md');
    });

    it('preserves links to sections that became _index.md', () => {
      // getting-started.md should preserve its link to architecture/ which became _index.md
      expect(gettingStartedContent).toContain('[see Architecture](../architecture/)');
    });

    it('updates links to files moved to subdirectories', () => {
      // getting-started.md should update its link to memory.md which moved to storage/
      expect(gettingStartedContent).toContain('[APIs page](../architecture/apis/)');
    });

    it('preserves hash fragments in links to moved files', async () => {
      const faqContent = await _readFile('faq.md');
      const markdownLink = '[Elasticsearch Rollover](../storage/elasticsearch/#index-rollover)';
      expect(faqContent).toContain(markdownLink);
    });
  });

  describe('updates links in root _index.md', () => {
    let rootIndex: string;

    beforeEach(async () => {
      rootIndex = await _readFile('_index.md');
    });

    it('updates links to files moved to subdirectories', () => {
      expect(rootIndex).toContain('[Memory storage](./storage/memory/)');
    });

    it('preserves links to sections that became _index.md', () => {
      expect(rootIndex).toContain('[Features](./features/)');
    });
  });

  describe('updates links in moved files', () => {
    it('for index page to pages in same folder', async () => {
      const architectureIndex = await _readFile('architecture/_index.md');
      expect(architectureIndex).toContain('[adaptive sampling](./sampling/#adaptive-sampling)');
    });

    it('for index page to pages in other folder', async () => {
      const architectureIndex = await _readFile('architecture/_index.md');
      // Links to storage backends should use ../../
      expect(architectureIndex).toContain('[Badger](../storage/badger/');
    });

    it('for index page to page in folder with hash on link', async () => {
      const architectureIndex = await _readFile('architecture/_index.md');
      // Links with hash fragments should be preserved
      expect(architectureIndex).toContain('[adaptive sampling](./sampling/#adaptive-sampling)');
    });

    it('for non-index page to unmoved page', async () => {
      const monitoringIndex = await _readFile('operations/monitoring.md');
      // Links with hash fragments should be preserved
      expect(monitoringIndex).toContain('[Getting Started](../../getting-started/)');
    });
  });

  describe('adds aliases to front matter when necessary', () => {
    it('does not add aliases to unmoved files like getting-started', async () => {
      const content = await _readFile('getting-started.md');
      expect(content).not.toContain('aliases:');
    });

    it('does not add aliases to files moved to become an index page', async () => {
      const content = await _readFile('architecture/_index.md');
      expect(content).not.toContain('aliases:');
    });

    it('adds aliases in monitoring.md', async () => {
      const monitoringContent = await _readFile('operations/monitoring.md');
      expect(monitoringContent).toContain('aliases: [../monitoring]');
    });

    it('adds aliases in the right place', async () => {
      const monitoringContent = await _readFile('operations/monitoring.md');
      const expectedFrontMatter = [
        '---',
        'title: Monitoring Jaeger',
        'navtitle: Monitoring',
        'aliases: [../monitoring]',
        'hasparent: true',
        '---'
      ].join('\n');
      const frontMatterMatch = monitoringContent.match(/^---([\s\S]*?)---/);
      expect(frontMatterMatch?.[0]).toBe(expectedFrontMatter);
    });


  });
});

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}