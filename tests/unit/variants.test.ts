import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import {
  applyComponentSelection,
  applyVariants,
  assertCliVersion,
  checkGates,
  checkNodeVersion,
  collectAlwaysInclude,
  removePackageScripts,
  getScaffoldSection,
  parseStoredComponentSelection,
  resolveFilesToKeep,
  runVariantPipeline,
  ScaffoldGateError,
  variantMatches,
  type ScaffoldSection,
} from '../../src/variants.js';
import type { ComponentRegistry } from '../../src/registry/types.js';

const tempDirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'velocity-variants-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

function write(root: string, rel: string, content = rel): void {
  const full = join(root, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

function read(root: string, rel: string): string {
  return readFileSync(join(root, rel), 'utf-8');
}

function exists(root: string, rel: string): boolean {
  return existsSync(join(root, rel));
}

// ---------------------------------------------------------------------------
// Fixture: a miniature Velocity checkout with i18n + minimal variants
// ---------------------------------------------------------------------------

const fixtureScaffold: ScaffoldSection = {
  schemaVersion: 1,
  minCliVersion: '2.0.0',
  node: '>=22.23.4',
  variants: [
    {
      id: 'i18n',
      when: { i18n: true },
      overlay: 'variants/i18n',
      remove: [],
    },
    {
      id: 'minimal',
      when: { demo: false },
      overlay: 'variants/minimal',
      remove: ['src/components/landing', 'src/pages/about.astro', 'does/not/exist'],
    },
  ],
  components: {
    optionalDirs: ['src/components/ui', 'src/components/patterns', 'src/components/hero'],
    alwaysInclude: ['contact-form'],
  },
  cleanup: ['variants', 'scripts/scaffold-matrix.mjs'],
};

function createFixture(): string {
  const root = createTempDir();
  write(root, 'src/i18n/locales.mjs', 'core-locales');
  write(root, 'src/views/Home.astro', 'core-home');
  write(root, 'src/config/nav.config.ts', 'core-nav');
  write(root, 'src/pages/about.astro');
  write(root, 'src/components/landing/Navbar.astro');
  write(root, 'src/actions/index.ts', 'actions');
  write(root, 'src/lib/forms.ts', 'forms');
  write(root, 'src/lib/cn.ts', 'cn');
  write(root, 'src/components/layout/Header.astro');
  write(root, 'src/components/ui/form/Button/Button.astro');
  write(root, 'src/components/ui/form/Button/index.ts');
  write(root, 'src/components/ui/form/Input/Input.astro');
  write(root, 'src/components/ui/form/Textarea/Textarea.astro');
  write(root, 'src/components/ui/data-display/Card/Card.astro');
  write(root, 'src/components/patterns/ContactForm.astro');
  write(root, 'src/components/patterns/StatCard.astro');
  write(root, 'src/components/hero/Hero.astro');
  write(root, 'scripts/scaffold-matrix.mjs');
  write(root, 'variants/README.md');
  write(root, 'variants/i18n/src/i18n/locales.mjs', 'i18n-locales');
  write(root, 'variants/i18n/src/i18n/translations/es.ts', 'es');
  write(root, 'variants/minimal/src/views/Home.astro', 'minimal-home');
  write(root, 'variants/minimal/src/config/nav.config.ts', 'minimal-nav');
  return root;
}

const registry: ComponentRegistry = {
  version: '2.0.0',
  categories: {
    ui: { name: 'UI', description: '' },
    patterns: { name: 'Patterns', description: '' },
    hero: { name: 'Hero', description: '' },
  },
  utilities: {
    cn: { name: 'cn', description: '', files: ['src/lib/cn.ts'], npm: ['clsx'] },
  },
  components: {
    button: {
      name: 'Button',
      category: 'ui',
      files: ['src/components/ui/form/Button/Button.astro', 'src/components/ui/form/Button/index.ts'],
      dependencies: { utilities: ['cn'], components: [] },
      premium: false,
    },
    input: {
      name: 'Input',
      category: 'ui',
      files: ['src/components/ui/form/Input/Input.astro'],
      dependencies: { utilities: ['cn'], components: ['button'] },
      premium: false,
    },
    textarea: {
      name: 'Textarea',
      category: 'ui',
      files: ['src/components/ui/form/Textarea/Textarea.astro'],
      dependencies: { utilities: ['cn'], components: [] },
      premium: false,
    },
    card: {
      name: 'Card',
      category: 'ui',
      files: ['src/components/ui/data-display/Card/Card.astro'],
      dependencies: { utilities: ['cn'], components: [] },
      premium: false,
    },
    'contact-form': {
      name: 'ContactForm',
      category: 'patterns',
      files: ['src/components/patterns/ContactForm.astro', 'src/actions/index.ts', 'src/lib/forms.ts'],
      dependencies: { utilities: ['cn'], components: ['input', 'textarea'] },
      premium: false,
    },
    'stat-card': {
      name: 'StatCard',
      category: 'patterns',
      files: ['src/components/patterns/StatCard.astro'],
      dependencies: { utilities: [], components: ['card'] },
      premium: false,
    },
    hero: {
      name: 'Hero',
      category: 'hero',
      files: ['src/components/hero/Hero.astro'],
      dependencies: { utilities: [], components: [] },
      premium: false,
    },
  },
};

// ---------------------------------------------------------------------------

describe('variantMatches', () => {
  it('matches when every key equals the option', () => {
    expect(variantMatches({ when: { i18n: true } }, { demo: false, i18n: true })).toBe(true);
    expect(variantMatches({ when: { i18n: true, demo: false } }, { demo: false, i18n: true })).toBe(true);
  });

  it('does not match when any key differs', () => {
    expect(variantMatches({ when: { i18n: true } }, { demo: true, i18n: false })).toBe(false);
    expect(variantMatches({ when: { i18n: true, demo: true } }, { demo: false, i18n: true })).toBe(false);
  });

  it('compares strictly (no truthy coercion)', () => {
    expect(variantMatches({ when: { demo: 'false' } }, { demo: false, i18n: false })).toBe(false);
    expect(variantMatches({ when: { demo: 0 } }, { demo: false, i18n: false })).toBe(false);
  });

  it('does not apply a variant with an unrecognised when key', () => {
    expect(variantMatches({ when: { i18n: true, darkMode: true } }, { demo: true, i18n: true })).toBe(false);
  });

  it('applies a variant with no or empty when', () => {
    expect(variantMatches({}, { demo: true, i18n: false })).toBe(true);
    expect(variantMatches({ when: {} }, { demo: true, i18n: false })).toBe(true);
  });
});

describe('applyVariants', () => {
  it('applies matching variants in order, overwriting files', () => {
    const root = createFixture();
    const applied = applyVariants(root, fixtureScaffold, { demo: false, i18n: true });

    expect(applied).toEqual(['i18n', 'minimal']);
    expect(read(root, 'src/i18n/locales.mjs')).toBe('i18n-locales');
    expect(read(root, 'src/i18n/translations/es.ts')).toBe('es');
    expect(read(root, 'src/views/Home.astro')).toBe('minimal-home');
    expect(read(root, 'src/config/nav.config.ts')).toBe('minimal-nav');
  });

  it('removes paths (files and directories) after the overlay, ignoring missing ones', () => {
    const root = createFixture();
    applyVariants(root, fixtureScaffold, { demo: false, i18n: false });

    expect(exists(root, 'src/components/landing')).toBe(false);
    expect(exists(root, 'src/pages/about.astro')).toBe(false);
    // i18n did not apply
    expect(read(root, 'src/i18n/locales.mjs')).toBe('core-locales');
  });

  it('leaves the project untouched when no variant matches', () => {
    const root = createFixture();
    const applied = applyVariants(root, fixtureScaffold, { demo: true, i18n: false });

    expect(applied).toEqual([]);
    expect(read(root, 'src/views/Home.astro')).toBe('core-home');
    expect(exists(root, 'src/components/landing/Navbar.astro')).toBe(true);
  });

  it('lets a later variant overwrite an earlier one (order matters)', () => {
    const root = createTempDir();
    write(root, 'file.txt', 'core');
    write(root, 'v/a/file.txt', 'a');
    write(root, 'v/b/file.txt', 'b');

    applyVariants(root, { variants: [{ id: 'a', overlay: 'v/a' }, { id: 'b', overlay: 'v/b' }] }, { demo: true, i18n: true });
    expect(read(root, 'file.txt')).toBe('b');

    write(root, 'file.txt', 'core');
    applyVariants(root, { variants: [{ id: 'b', overlay: 'v/b' }, { id: 'a', overlay: 'v/a' }] }, { demo: true, i18n: true });
    expect(read(root, 'file.txt')).toBe('a');
  });

  it('removes a file that an earlier variant overlaid if a later variant removes it', () => {
    const root = createTempDir();
    write(root, 'v/a/extra.txt', 'a');
    applyVariants(
      root,
      { variants: [{ id: 'a', overlay: 'v/a' }, { id: 'b', remove: ['extra.txt'] }] },
      { demo: true, i18n: true }
    );
    expect(exists(root, 'extra.txt')).toBe(false);
  });

  it('ignores unknown keys on variants and in the scaffold section', () => {
    const root = createFixture();
    const scaffold = {
      ...fixtureScaffold,
      futureTopLevel: { anything: true },
      variants: [
        { id: 'i18n', when: { i18n: true }, overlay: 'variants/i18n', futureKey: [1, 2, 3] },
      ],
    } as unknown as ScaffoldSection;

    expect(applyVariants(root, scaffold, { demo: true, i18n: true })).toEqual(['i18n']);
    expect(read(root, 'src/i18n/locales.mjs')).toBe('i18n-locales');
  });

  it('rejects overlay and remove paths that escape the project root', () => {
    const root = createTempDir();
    expect(() =>
      applyVariants(root, { variants: [{ id: 'x', remove: ['../outside'] }] }, { demo: true, i18n: true })
    ).toThrow(/escapes/);
    expect(() =>
      applyVariants(root, { variants: [{ id: 'x', overlay: '../outside' }] }, { demo: true, i18n: true })
    ).toThrow(/escapes/);
  });

  it('throws when a matching variant overlay directory is missing', () => {
    const root = createTempDir();
    expect(() =>
      applyVariants(root, { variants: [{ id: 'x', overlay: 'variants/nope' }] }, { demo: true, i18n: true })
    ).toThrow(/overlay directory not found/);
  });
});

describe('component selection', () => {
  it('keeps everything in "all" mode', () => {
    const root = createFixture();
    const result = applyComponentSelection(root, fixtureScaffold, { mode: 'all' }, registry);
    expect(result.pruned).toBe(false);
    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(true);
  });

  it('"none" keeps alwaysInclude components plus transitive dependencies', () => {
    const root = createFixture();
    applyComponentSelection(root, fixtureScaffold, { mode: 'none' }, registry);

    // contact-form -> input -> button, contact-form -> textarea
    expect(exists(root, 'src/components/patterns/ContactForm.astro')).toBe(true);
    expect(exists(root, 'src/components/ui/form/Input/Input.astro')).toBe(true);
    expect(exists(root, 'src/components/ui/form/Button/Button.astro')).toBe(true);
    expect(exists(root, 'src/components/ui/form/Button/index.ts')).toBe(true);
    expect(exists(root, 'src/components/ui/form/Textarea/Textarea.astro')).toBe(true);

    // Not required
    expect(exists(root, 'src/components/ui/data-display')).toBe(false);
    expect(exists(root, 'src/components/patterns/StatCard.astro')).toBe(false);
    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(false);
  });

  it('never deletes files outside optionalDirs, even if the registry lists them', () => {
    const root = createFixture();
    const scaffold: ScaffoldSection = { ...fixtureScaffold, components: { ...fixtureScaffold.components, alwaysInclude: [] } };
    applyComponentSelection(root, scaffold, { mode: 'none' }, registry);

    expect(exists(root, 'src/components/patterns/ContactForm.astro')).toBe(false);
    expect(read(root, 'src/actions/index.ts')).toBe('actions');
    expect(read(root, 'src/lib/forms.ts')).toBe('forms');
    expect(read(root, 'src/lib/cn.ts')).toBe('cn');
    expect(exists(root, 'src/components/layout/Header.astro')).toBe(true);
    expect(exists(root, 'src/components/landing/Navbar.astro')).toBe(true);
  });

  it('category selection keeps the selection plus alwaysInclude', () => {
    const root = createFixture();
    applyComponentSelection(root, fixtureScaffold, { mode: 'categories', categories: ['hero'] }, registry);

    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(true);
    expect(exists(root, 'src/components/patterns/ContactForm.astro')).toBe(true);
    expect(exists(root, 'src/components/ui/form/Input/Input.astro')).toBe(true);
    expect(exists(root, 'src/components/patterns/StatCard.astro')).toBe(false);
  });

  it('individual selection resolves transitive dependencies', () => {
    const keep = resolveFilesToKeep(
      { components: { alwaysInclude: [] } },
      { mode: 'individual', components: ['stat-card'] },
      registry
    );
    expect(keep).not.toBeNull();
    expect([...keep!].sort()).toEqual([
      'src/components/patterns/StatCard.astro',
      'src/components/ui/data-display/Card/Card.astro',
      'src/lib/cn.ts',
    ]);
  });

  it('without a registry, keeps everything unless nothing must be kept', () => {
    expect(resolveFilesToKeep(fixtureScaffold, { mode: 'none' }, null)).toBeNull();
    expect(resolveFilesToKeep(fixtureScaffold, { mode: 'categories', categories: ['ui'] }, null)).toBeNull();
    expect(resolveFilesToKeep({ components: { alwaysInclude: [] } }, { mode: 'none' }, null)?.size).toBe(0);
  });
});

describe('variant alwaysInclude', () => {
  const demoScaffold: ScaffoldSection = {
    ...fixtureScaffold,
    variants: [
      ...(fixtureScaffold.variants ?? []),
      { id: 'demo', when: { demo: true }, alwaysInclude: ['*'] },
      { id: 'stats', when: { i18n: true }, alwaysInclude: ['stat-card'] },
    ],
  };

  it('applies a variant without overlay or remove when `when` matches', () => {
    const root = createFixture();
    expect(applyVariants(root, demoScaffold, { demo: true, i18n: false })).toEqual(['demo']);
    expect(read(root, 'src/views/Home.astro')).toBe('core-home');
  });

  it('adds ids from applied variants to components.alwaysInclude', () => {
    expect(collectAlwaysInclude(demoScaffold, { demo: false, i18n: true })).toEqual(['contact-form', 'stat-card']);
    expect(collectAlwaysInclude(demoScaffold, { demo: false, i18n: false })).toEqual(['contact-form']);
  });

  it('keeps components added by an applied variant (with their dependencies)', () => {
    const root = createFixture();
    write(root, 'component-registry.json', JSON.stringify(registry));
    runVariantPipeline(root, demoScaffold, {
      options: { demo: false, i18n: true },
      componentSelection: { mode: 'none' },
    });
    expect(exists(root, 'src/components/patterns/StatCard.astro')).toBe(true);
    expect(exists(root, 'src/components/ui/data-display/Card/Card.astro')).toBe(true);
    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(false);
  });

  it('"*" keeps every component and skips pruning', () => {
    const root = createFixture();
    write(root, 'component-registry.json', JSON.stringify(registry));
    const result = runVariantPipeline(root, demoScaffold, {
      options: { demo: true, i18n: false },
      componentSelection: { mode: 'none' },
    });
    expect(result.appliedVariants).toEqual(['demo']);
    expect(result.components.pruned).toBe(false);
    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(true);
    expect(exists(root, 'src/components/patterns/StatCard.astro')).toBe(true);
  });

  it('ignores the alwaysInclude of a variant that does not apply', () => {
    expect(
      resolveFilesToKeep(
        { components: { alwaysInclude: collectAlwaysInclude(demoScaffold, { demo: false, i18n: false }) } },
        { mode: 'none' },
        registry
      )
    ).not.toBeNull();
  });

  it('keeps the optional directory itself even when everything in it is pruned', () => {
    const root = createFixture();
    applyComponentSelection(root, { components: { optionalDirs: ['src/components/hero'], alwaysInclude: [] } }, { mode: 'none' }, registry);
    expect(exists(root, 'src/components/hero')).toBe(true);
    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(false);
  });
});

describe('runVariantPipeline', () => {
  it('runs variants, component selection, then cleanup', () => {
    const root = createFixture();
    write(root, 'component-registry.json', JSON.stringify(registry));

    const result = runVariantPipeline(root, fixtureScaffold, {
      options: { demo: false, i18n: true },
      componentSelection: { mode: 'none' },
    });

    expect(result.appliedVariants).toEqual(['i18n', 'minimal']);
    expect(result.components.pruned).toBe(true);
    expect(read(root, 'src/i18n/locales.mjs')).toBe('i18n-locales');
    expect(exists(root, 'src/components/hero/Hero.astro')).toBe(false);
    expect(exists(root, 'src/components/patterns/ContactForm.astro')).toBe(true);
    expect(exists(root, 'variants')).toBe(false);
    expect(exists(root, 'scripts/scaffold-matrix.mjs')).toBe(false);
  });
});

describe('cleanupScripts', () => {
  it('removes listed npm scripts after cleanup and ignores missing names', () => {
    const root = createFixture();
    write(
      root,
      'package.json',
      JSON.stringify({ name: 'velocity', scripts: { dev: 'astro dev', 'test:scaffold': 'x', 'check:registry': 'y' } })
    );
    runVariantPipeline(root, { ...fixtureScaffold, cleanupScripts: ['test:scaffold', 'check:registry', 'nope'] }, {
      options: { demo: true, i18n: false },
      componentSelection: { mode: 'all' },
    });
    const pkg = JSON.parse(read(root, 'package.json'));
    expect(pkg.scripts).toEqual({ dev: 'astro dev' });
    expect(pkg.name).toBe('velocity');
  });

  it('is a no-op without a list, a package.json, or scripts', () => {
    const root = createTempDir();
    expect(removePackageScripts(root, ['a'])).toEqual([]);
    write(root, 'package.json', JSON.stringify({ name: 'x' }));
    expect(removePackageScripts(root, ['a'])).toEqual([]);
    expect(removePackageScripts(root, undefined)).toEqual([]);
    expect(JSON.parse(read(root, 'package.json'))).toEqual({ name: 'x' });
  });
});

describe('version gates', () => {
  it('requires a scaffold section', () => {
    expect(() => getScaffoldSection(null)).toThrow(ScaffoldGateError);
    expect(() => getScaffoldSection({ version: '1.8.0' })).toThrow(/requires Velocity >= 2\.0/);
    expect(() => getScaffoldSection({ version: '1.8.0' })).toThrow(/--ref/);
    expect(getScaffoldSection({ scaffold: { variants: [] }, unknown: 1 })).toEqual({ variants: [] });
  });

  it('refuses when minCliVersion is newer than the CLI', () => {
    expect(() => assertCliVersion({ minCliVersion: '2.1.0' }, '2.0.0')).toThrow(
      /npm create velocity-astro@latest/
    );
    expect(() => assertCliVersion({ minCliVersion: '2.0.0' }, '2.0.0')).not.toThrow();
    expect(() => assertCliVersion({ minCliVersion: '1.9.0' }, '2.0.0')).not.toThrow();
    expect(() => assertCliVersion({}, '2.0.0')).not.toThrow();
  });

  it('checks the Node range', () => {
    expect(checkNodeVersion({ node: '>=22.23.4' }, 'v22.20.0').ok).toBe(false);
    expect(checkNodeVersion({ node: '>=22.23.4' }, 'v22.23.4').ok).toBe(true);
    expect(checkNodeVersion({ node: '>=22.23.4' }, 'v24.1.0').ok).toBe(true);
    expect(checkNodeVersion({}, 'v18.0.0').ok).toBe(true);
    expect(checkNodeVersion({ node: 'not a range' }, 'v18.0.0').ok).toBe(true);
  });

  it('warns on an unmet Node range during scaffold', () => {
    const result = checkGates(
      { scaffold: { minCliVersion: '2.0.0', node: '>=22.23.4' } },
      { cliVersion: '2.0.0', nodeVersion: 'v22.20.0', mode: 'scaffold' }
    );
    expect(result.nodeWarning).toMatch(/>=22\.23\.4/);
  });

  it('errors on an unmet Node range during upgrade', () => {
    expect(() =>
      checkGates(
        { scaffold: { node: '>=22.23.4' } },
        { cliVersion: '2.0.0', nodeVersion: 'v22.20.0', mode: 'upgrade' }
      )
    ).toThrow(ScaffoldGateError);
  });

  it('checks the CLI version before the Node version', () => {
    expect(() =>
      checkGates(
        { scaffold: { minCliVersion: '3.0.0', node: '>=99' } },
        { cliVersion: '2.0.0', nodeVersion: 'v22.0.0', mode: 'scaffold' }
      )
    ).toThrow(/requires create-velocity-astro >= 3\.0\.0/);
  });
});

describe('parseStoredComponentSelection', () => {
  it('round-trips the values written to .velocity.json', () => {
    expect(parseStoredComponentSelection('all')).toEqual({ mode: 'all' });
    expect(parseStoredComponentSelection(undefined)).toEqual({ mode: 'all' });
    expect(parseStoredComponentSelection('none')).toEqual({ mode: 'none' });
    expect(parseStoredComponentSelection('categories:ui,hero')).toEqual({
      mode: 'categories',
      categories: ['ui', 'hero'],
    });
    expect(parseStoredComponentSelection('individual:button,card')).toEqual({
      mode: 'individual',
      components: ['button', 'card'],
    });
  });
});
