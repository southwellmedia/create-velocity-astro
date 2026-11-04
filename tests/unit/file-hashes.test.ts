import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { UpgradeManifest } from '../../src/types.js';
import { computeFileHashes, diffProjects } from '../../src/utils/diff.js';

const FILE = 'src/styles/tokens/colors.css';
const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const manifest = { files: { safe: ['src/styles/tokens/'] } } as unknown as UpgradeManifest;

function write(root: string, content: string) {
  const path = join(root, FILE);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

describe('stored file hashes', () => {
  let current: string;
  let fresh: string;

  beforeEach(() => {
    current = mkdtempSync(join(tmpdir(), 'velocity-current-'));
    fresh = mkdtempSync(join(tmpdir(), 'velocity-fresh-'));
    write(fresh, 'new release');
  });

  afterEach(() => {
    rmSync(current, { recursive: true, force: true });
    rmSync(fresh, { recursive: true, force: true });
  });

  it('stores forward-slash keys', () => {
    write(current, 'original');
    expect(Object.keys(computeFileHashes(current, ['src/styles/tokens/']))).toEqual([FILE]);
  });

  it.each([
    ['forward-slash', FILE],
    ['Windows backslash', 'src\\styles\\tokens\\colors.css'],
  ])('reports an edited file as a conflict with %s keys', (_name, key) => {
    write(current, 'edited by the user');
    const [diff] = diffProjects(current, fresh, manifest, { [key]: sha('original') });
    expect(diff?.status).toBe('conflict');
  });

  it('overwrites an untouched file without a conflict', () => {
    write(current, 'original');
    const [diff] = diffProjects(current, fresh, manifest, {
      'src\\styles\\tokens\\colors.css': sha('original'),
    });
    expect(diff?.status).toBe('modified');
  });
});
