import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { diffStructural, seedPaths } from '../../../src/utils/diff.js';
import type { FileDiff, UpgradeManifest } from '../../../src/types.js';

const dirs: string[] = [];

function project(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'velocity-diff-'));
  dirs.push(dir);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

function manifest(seed: string[], replace: string[] = []): UpgradeManifest {
  return {
    version: '2.0.0',
    minCliVersion: '2.0.0',
    files: { safe: [], protected: [], seed },
    dependencies: { update: {}, remove: [], add: {} },
    migrations: replace.length ? [{ title: 't', description: 'd', replace }] : [],
  };
}

const statuses = (diffs: FileDiff[]) =>
  Object.fromEntries(diffs.map((d) => [d.path.split('\\').join('/'), d.status]));

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('diffStructural', () => {
  it('adds seeded files only when they are missing', () => {
    const current = project({ 'src/views/HomeView.astro': 'mine' });
    const fresh = project({ 'src/views/HomeView.astro': 'theirs', 'src/views/SearchView.astro': 'new' });

    expect(statuses(diffStructural(current, fresh, manifest(['src/views/'])))).toEqual({
      'src/views/SearchView.astro': 'added',
    });
  });

  it('does not add back seeded files the project was offered before and removed', () => {
    // The project deleted its search page and localized home; a release adds a new view.
    const current = project({ 'src/views/HomeView.astro': 'mine' });
    const fresh = project({
      'src/views/HomeView.astro': 'theirs',
      'src/views/SearchView.astro': 'old',
      'src/pages/search.astro': 'old',
      'src/pages/[lang]/index.astro': 'old',
      'src/views/NewView.astro': 'new in this release',
    });
    const offered = ['src/views/HomeView.astro', 'src/views/SearchView.astro', 'src/pages/search.astro', 'src/pages/[lang]/index.astro'];

    expect(
      statuses(diffStructural(current, fresh, manifest(['src/views/', 'src/pages/search.astro', 'src/pages/[lang]/']), [], offered))
    ).toEqual({ 'src/views/NewView.astro': 'added' });
  });

  it('still replaces files a migration replaces, even if they were seeded before', () => {
    const current = project({ 'AGENTS.md': 'mine' });
    const fresh = project({ 'AGENTS.md': 'theirs' });
    const m = manifest(['AGENTS.md'], ['AGENTS.md']);

    expect(statuses(diffStructural(current, fresh, m, [], ['AGENTS.md']))).toEqual({ 'AGENTS.md': 'conflict' });
  });

  it('lists the seeded files a template offers', () => {
    const fresh = project({ 'src/views/HomeView.astro': 'a', 'src/views/BlogView.astro': 'b', 'src/pages/search.astro': 'c' });

    expect(seedPaths(manifest(['src/views/', 'src/pages/search.astro', 'src/pages/missing.astro']), fresh)).toEqual([
      'src/pages/search.astro',
      'src/views/BlogView.astro',
      'src/views/HomeView.astro',
    ]);
  });

  it('reports replaced files that differ as conflicts, so they are backed up', () => {
    const current = project({ 'astro.config.mjs': 'mine', 'same.txt': 'same' });
    const fresh = project({ 'astro.config.mjs': 'theirs', 'same.txt': 'same', 'added.txt': 'new' });

    expect(statuses(diffStructural(current, fresh, manifest([], ['astro.config.mjs', 'same.txt', 'added.txt'])))).toEqual({
      'astro.config.mjs': 'conflict',
      'added.txt': 'added',
    });
  });

  it('leaves files the user added in a replaced folder alone', () => {
    const current = project({ 'src/components/blog/MyCard.astro': 'mine' });
    const fresh = project({ 'src/components/blog/BlogCard.astro': 'theirs' });

    expect(statuses(diffStructural(current, fresh, manifest([], ['src/components/blog/'])))).toEqual({
      'src/components/blog/BlogCard.astro': 'added',
    });
  });

  it('reports removed paths that exist, including whole folders', () => {
    const current = project({ 'src/i18n/routes.ts': 'old', 'src/components/i18n/Switcher.astro': 'old' });
    const m = manifest([]);
    m.migrations = [{ title: 't', description: 'd', remove: ['src/i18n/routes.ts', 'src/i18n/gone.ts', 'src/components/i18n/'] }];

    expect(statuses(diffStructural(current, project({}), m))).toEqual({
      'src/i18n/routes.ts': 'removed',
      'src/components/i18n/Switcher.astro': 'removed',
    });
  });

  it('does not repeat files the safe diff already covers', () => {
    const current = project({});
    const fresh = project({ 'src/i18n/ui.ts': 'new' });
    const known: FileDiff[] = [{ path: 'src/i18n/ui.ts', status: 'added', category: 'safe' }];

    expect(diffStructural(current, fresh, manifest(['src/i18n/']), known)).toEqual([]);
  });
});
