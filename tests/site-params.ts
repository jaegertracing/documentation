import { readFileSync } from 'node:fs';

/** The current v2 docs version, as hugo.yaml declares it. */
export function latestV2(): string {
  const match = /^\s*latestV2:\s*["']?([\d.]+)/m.exec(
    readFileSync('hugo.yaml', 'utf8'),
  );
  if (!match) throw new Error('hugo.yaml has no latestV2');
  return match[1];
}
