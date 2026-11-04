import { describe, it, expect } from 'vitest';
import { applyDependencyChanges, hasDependencyChanges } from '../../../src/utils/dependencies.js';

describe('applyDependencyChanges', () => {
  it('updates a package in whichever section it lives in', () => {
    const pkg = {
      dependencies: { astro: '6.0.0' },
      devDependencies: { vitest: '3.2.0' },
    };
    applyDependencyChanges(pkg, { update: { astro: '7.4.5', vitest: '^5.1.0' } });
    expect(pkg.dependencies).toEqual({ astro: '7.4.5' });
    expect(pkg.devDependencies).toEqual({ vitest: '^5.1.0' });
  });

  it('does not add packages the project does not have when updating', () => {
    const pkg: Record<string, Record<string, string>> = { dependencies: { astro: '6.0.0' } };
    applyDependencyChanges(pkg, { update: { '@playwright/test': '^1.64.1' } });
    expect(pkg.dependencies).toEqual({ astro: '6.0.0' });
    expect(pkg.devDependencies).toBeUndefined();
  });

  it('adds addDev packages to devDependencies', () => {
    const pkg: Record<string, Record<string, string>> = { dependencies: { astro: '7.4.5' } };
    applyDependencyChanges(pkg, {
      addDev: { '@typescript-eslint/parser': '8.72.1', '@axe-core/playwright': '^4.14.0' },
    });
    expect(pkg.devDependencies).toEqual({
      '@typescript-eslint/parser': '8.72.1',
      '@axe-core/playwright': '^4.14.0',
    });
    expect(pkg.dependencies).toEqual({ astro: '7.4.5' });
  });

  it('moves an addDev package out of dependencies', () => {
    const pkg = { dependencies: { prettier: '3.0.0', astro: '7.4.5' }, devDependencies: {} as Record<string, string> };
    applyDependencyChanges(pkg, { addDev: { prettier: '^3.9.10' } });
    expect(pkg.dependencies).toEqual({ astro: '7.4.5' });
    expect(pkg.devDependencies).toEqual({ prettier: '^3.9.10' });
  });

  it('adds, removes and preserves other fields', () => {
    const pkg = {
      name: 'site',
      scripts: { dev: 'astro dev' },
      dependencies: { zod: '3.0.0', astro: '6.0.0' },
      devDependencies: { 'astro-seo': '1.0.0' },
    };
    applyDependencyChanges(pkg, {
      remove: ['zod', 'astro-seo'],
      add: { 'class-variance-authority': '^0.7.1' },
    });
    expect(pkg.dependencies).toEqual({ astro: '6.0.0', 'class-variance-authority': '^0.7.1' });
    expect(pkg.devDependencies).toEqual({});
    expect(pkg.name).toBe('site');
    expect(pkg.scripts).toEqual({ dev: 'astro dev' });
  });
});

describe('hasDependencyChanges', () => {
  it('detects addDev-only changes', () => {
    expect(hasDependencyChanges({ update: {}, remove: [], add: {} })).toBe(false);
    expect(hasDependencyChanges({ update: {}, remove: [], add: {}, addDev: { a: '1' } })).toBe(true);
    expect(hasDependencyChanges({})).toBe(false);
  });
});
