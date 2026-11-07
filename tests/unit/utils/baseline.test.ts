import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  BASELINE_NOTE,
  BASELINE_PATH,
  computeBaseline,
  velocityOwnedFiles,
  writeBaseline,
} from '../../../src/utils/baseline.js';

const dirs: string[] = [];

function project(files: Record<string, string | Buffer>): string {
  const dir = mkdtempSync(join(tmpdir(), 'velocity-baseline-'));
  dirs.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

const sha = (data: string | Buffer) => createHash('sha256').update(data).digest('base64');

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('velocityOwnedFiles', () => {
  it('expands directories, keeps single files and sorts the result', () => {
    const dir = project({
      'src/lib/z.ts': 'z',
      'src/lib/nested/a.ts': 'a',
      'src/lib/B.ts': 'B',
      'tsconfig.json': '{}',
      'src/pages/index.astro': 'mine',
    });
    expect(velocityOwnedFiles(dir, ['tsconfig.json', 'src/lib/'])).toEqual([
      'src/lib/B.ts',
      'src/lib/nested/a.ts',
      'src/lib/z.ts',
      'tsconfig.json',
    ]);
  });

  it('skips dependency, build and backup folders', () => {
    const dir = project({
      'integrations/a.mjs': 'a',
      'integrations/node_modules/x/index.js': 'x',
      'integrations/dist/out.js': 'x',
      'integrations/.astro/types.d.ts': 'x',
      'integrations/.git/HEAD': 'x',
      'integrations/.velocity-backup/2.0.0/a.mjs': 'x',
      'integrations/test-results/r.json': 'x',
      'integrations/playwright-report/index.html': 'x',
    });
    expect(velocityOwnedFiles(dir, ['integrations/'])).toEqual(['integrations/a.mjs']);
  });

  it('ignores missing entries and de-duplicates overlapping ones', () => {
    const dir = project({ 'src/lib/forms.ts': 'f' });
    expect(velocityOwnedFiles(dir, ['src/lib/', 'src/lib/forms.ts', 'vercel.json', 'src/layouts/'])).toEqual([
      'src/lib/forms.ts',
    ]);
  });

  it('treats a directory entry without a trailing slash as a directory', () => {
    const dir = project({ '.agents/skills/a/SKILL.md': 's' });
    expect(velocityOwnedFiles(dir, ['.agents/skills'])).toEqual(['.agents/skills/a/SKILL.md']);
  });
});

describe('computeBaseline', () => {
  it('stores base64 SHA-256 of the raw bytes', () => {
    const bytes = Buffer.from([0xff, 0x00, 0x0d, 0x0a]);
    const dir = project({ 'src/lib/a.ts': 'export {};\r\n', 'src/lib/bin.dat': bytes });
    expect(computeBaseline(dir, ['src/lib/'])).toEqual({
      note: BASELINE_NOTE,
      files: { 'src/lib/a.ts': sha('export {};\r\n'), 'src/lib/bin.dat': sha(bytes) },
    });
  });
});

describe('writeBaseline', () => {
  const manifest = (scaffold: Record<string, unknown> = {}) => ({
    files: { safe: ['src/lib/', 'tsconfig.json'] },
    scaffold,
  });

  it('writes the same bytes as check-agent.mjs --write-baseline', () => {
    const dir = project({ 'src/lib/a.ts': 'a', 'tsconfig.json': '{}' });
    expect(writeBaseline(dir, manifest())).toBe(2);
    expect(readFileSync(join(dir, BASELINE_PATH), 'utf8')).toBe(
      '{\n' +
        '  "note": "Written by check:agent. Rewrite after an upgrade with npm run check:agent -- --write-baseline.",\n' +
        '  "files": {\n' +
        `    "src/lib/a.ts": "${sha('a')}",\n` +
        `    "tsconfig.json": "${sha('{}')}"\n` +
        '  }\n' +
        '}\n'
    );
  });

  it('writes an empty file list when no safe files exist', () => {
    const dir = project({});
    expect(writeBaseline(dir, manifest())).toBe(0);
    expect(JSON.parse(readFileSync(join(dir, BASELINE_PATH), 'utf8')).files).toEqual({});
  });

  it('skips the baseline when the manifest sets scaffold.baseline to false', () => {
    const dir = project({ 'src/lib/a.ts': 'a' });
    expect(writeBaseline(dir, manifest({ baseline: false }))).toBeNull();
    expect(existsSync(join(dir, BASELINE_PATH))).toBe(false);
  });

  it('still writes it when scaffold.baseline is missing or another value', () => {
    for (const scaffold of [{}, { baseline: true }, { baseline: 'yes' }]) {
      const dir = project({ 'src/lib/a.ts': 'a' });
      expect(writeBaseline(dir, manifest(scaffold))).toBe(1);
    }
  });

  it('rewrites an existing baseline from the current files (upgrade)', () => {
    const dir = project({ 'src/lib/a.ts': 'old', 'src/lib/gone.ts': 'x' });
    writeBaseline(dir, manifest());
    writeFileSync(join(dir, 'src/lib/a.ts'), 'upgraded');
    rmSync(join(dir, 'src/lib/gone.ts'));
    writeBaseline(dir, manifest());
    expect(JSON.parse(readFileSync(join(dir, BASELINE_PATH), 'utf8')).files).toEqual({
      'src/lib/a.ts': sha('upgraded'),
    });
  });

  it('does nothing without a manifest', () => {
    const dir = project({});
    expect(writeBaseline(dir, null)).toBeNull();
    expect(existsSync(join(dir, BASELINE_PATH))).toBe(false);
  });
});
