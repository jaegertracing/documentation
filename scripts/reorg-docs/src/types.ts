import type { FileHandle } from 'fs/promises';
import type { ObjectEncodingOptions } from 'fs';

export interface FileSystem {
  access: (path: string) => Promise<void>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<string | undefined>;
  readFile: (path: string, encoding: BufferEncoding) => Promise<string>;
  writeFile: (path: string, data: string | Buffer) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
  open: (path: string, flags: string) => Promise<FileHandle>;
  stat: (path: string) => Promise<{ isDirectory: () => boolean }>;
  readdir: {
    (path: string): Promise<string[]>;
    (path: string, options: ObjectEncodingOptions & { withFileTypes: true }): Promise<Array<{ name: string; isDirectory: () => boolean }>>;
  };
}