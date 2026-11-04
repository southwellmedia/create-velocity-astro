import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  applyLockfilePolicy,
  copyLocalTemplate,
  lockfilesToRemove,
  resolveTemplateSource,
  sourceRecord,
} from '../../src/template-source.js';

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'velocity-source-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

const ALL_LOCKFILES = ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock', 'bun.lockb', 'bun.lock'];

function createProjectWithLockfiles(): string {
  const dir = createTempDir();
  for (const file of ALL_LOCKFILES) writeFileSync(join(dir, file), '');
  return dir;
}

describe('lockfile policy', () => {
  it('keeps pnpm-lock.yaml for pnpm and removes the others', () => {
    const dir = createProjectWithLockfiles();
    applyLockfilePolicy(dir, 'pnpm');
    expect(existsSync(join(dir, 'pnpm-lock.yaml'))).toBe(true);
    for (const file of ['package-lock.json', 'yarn.lock', 'bun.lockb', 'bun.lock']) {
      expect(existsSync(join(dir, file))).toBe(false);
    }
  });

  it.each(['npm', 'yarn', 'bun'] as const)('removes pnpm-lock.yaml for %s', (pm) => {
    const dir = createProjectWithLockfiles();
    applyLockfilePolicy(dir, pm);
    expect(existsSync(join(dir, 'pnpm-lock.yaml'))).toBe(false);
    expect(lockfilesToRemove(pm)).toContain('pnpm-lock.yaml');
  });

  it('keeps the lockfile that matches the chosen package manager', () => {
    const npmDir = createProjectWithLockfiles();
    applyLockfilePolicy(npmDir, 'npm');
    expect(existsSync(join(npmDir, 'package-lock.json'))).toBe(true);

    const yarnDir = createProjectWithLockfiles();
    applyLockfilePolicy(yarnDir, 'yarn');
    expect(existsSync(join(yarnDir, 'yarn.lock'))).toBe(true);
  });

  it('ignores lockfiles that are not present', () => {
    const dir = createTempDir();
    expect(applyLockfilePolicy(dir, 'npm')).toEqual([]);
  });
});

describe('resolveTemplateSource', () => {
  const noFetch = async () => {
    throw new Error('should not fetch');
  };

  it('uses --ref as given', async () => {
    const source = await resolveTemplateSource({ ref: 'v2.0.0' }, { fetchLatestTag: noFetch });
    expect(source).toEqual({ kind: 'github', ref: 'v2.0.0', resolvedFrom: 'flag' });
    expect(sourceRecord(source)).toEqual({ source: 'github', ref: 'v2.0.0' });
  });

  it('defaults to the latest release tag', async () => {
    const source = await resolveTemplateSource({}, { fetchLatestTag: async () => 'v2.3.1' });
    expect(source).toEqual({ kind: 'github', ref: 'v2.3.1', resolvedFrom: 'latest-release' });
  });

  it('falls back to main with a notice', async () => {
    const notices: string[] = [];
    const source = await resolveTemplateSource(
      {},
      { fetchLatestTag: async () => null, notice: (m) => notices.push(m) }
    );
    expect(source).toEqual({ kind: 'github', ref: 'main', resolvedFrom: 'fallback' });
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatch(/main/);
  });

  it('resolves --template relative to cwd', async () => {
    const cwd = createTempDir();
    mkdirSync(join(cwd, 'velocity'));
    const source = await resolveTemplateSource({ template: 'velocity' }, { cwd, fetchLatestTag: noFetch });
    expect(source).toEqual({ kind: 'local', dir: join(cwd, 'velocity') });
  });

  it('rejects a missing --template directory and --ref combined with --template', async () => {
    const cwd = createTempDir();
    await expect(resolveTemplateSource({ template: 'missing' }, { cwd })).rejects.toThrow(/not found/);
    await expect(resolveTemplateSource({ template: '.', ref: 'main' }, { cwd })).rejects.toThrow(/either/);
  });
});

describe('copyLocalTemplate', () => {
  it('copies the template but skips build output, dependencies and VCS data', () => {
    const src = createTempDir();
    const excluded = ['node_modules', 'dist', '.git', '.astro', '.vercel', '.netlify', 'test-results', 'playwright-report'];
    for (const dir of excluded) {
      mkdirSync(join(src, dir));
      writeFileSync(join(src, dir, 'file.txt'), 'x');
    }
    mkdirSync(join(src, 'src', 'components'), { recursive: true });
    writeFileSync(join(src, 'src', 'components', 'A.astro'), 'a');
    writeFileSync(join(src, 'package.json'), '{}');
    writeFileSync(join(src, 'pnpm-lock.yaml'), '');

    const dest = join(createTempDir(), 'out');
    copyLocalTemplate(src, dest);

    expect(existsSync(join(dest, 'package.json'))).toBe(true);
    expect(existsSync(join(dest, 'pnpm-lock.yaml'))).toBe(true);
    expect(existsSync(join(dest, 'src', 'components', 'A.astro'))).toBe(true);
    for (const dir of excluded) {
      expect(existsSync(join(dest, dir))).toBe(false);
    }
  });
});
