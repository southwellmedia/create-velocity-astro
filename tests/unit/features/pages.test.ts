import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import {
  addToNavConfig,
  addToTranslations,
  generatePages,
  hasRoute,
  localizedPageTemplate,
  pageTemplate,
  parsePageNames,
  PagesUnsupportedError,
  toPageSpec,
  viewTemplate,
} from '../../../src/features/pages.js';

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

function write(root: string, rel: string, content: string): void {
  const full = join(root, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}
const read = (root: string, rel: string) => readFileSync(join(root, rel), 'utf-8');

// Trimmed copies of Velocity 2's real files
const NAV_CONFIG = `export interface RouteDefinition {
  path: string;
  slugs?: Partial<Record<string, string>>;
  localized?: boolean;
}

export const routes = {
  home: { path: '' },
  blog: { path: 'blog' },
  about: { path: 'about', slugs: { es: 'sobre-nosotros', fr: 'a-propos' } },
  search: { path: 'search', slugs: { es: 'buscar', fr: 'recherche' } },
} satisfies Record<string, RouteDefinition>;

export type RouteId = keyof typeof routes;

export interface NavItem {
  label: string;
  order: number;
  route?: RouteId;
}

export const navItems: NavItem[] = [
  { label: 'nav.blog', route: 'blog', order: 2 },
  { label: 'nav.about', route: 'about', order: 3 },
  { label: 'nav.search', route: 'search', order: 5 },
];

export const footerConfig: { extraLinks: NavItem[] } = {
  extraLinks: [{ label: 'GitHub', href: 'https://github.com', order: 100 }],
};
`;

const EN = `/**
 * Site copy (English).
 */
const en = {
  meta: {
    home: { title: 'Home' },
  },
};

export type SiteStrings = typeof en;
export default en;
`;

const ES = `import type { SiteStrings } from './en';

const es: SiteStrings = {
  meta: {
    home: { title: 'Inicio' },
  },
};

export default es;
`;

function createProject(): string {
  const root = mkdtempSync(join(tmpdir(), 'velocity-pages-'));
  tempDirs.push(root);
  write(root, 'src/views/HomeView.astro', '---\n---\n');
  write(root, 'src/config/nav.config.ts', NAV_CONFIG);
  write(root, 'src/i18n/translations/en.ts', EN);
  write(root, 'src/layouts/PageLayout.astro', '');
  write(root, 'src/layouts/LandingLayout.astro', '');
  return root;
}

describe('toPageSpec', () => {
  it('derives slug, camelCase id, view and namespace', () => {
    expect(toPageSpec('Pricing Plans')).toEqual({
      title: 'Pricing Plans',
      slug: 'pricing-plans',
      id: 'pricingPlans',
      view: 'PricingPlansView',
      ns: 'pricingPlansPage',
    });
    expect(toPageSpec('pricing-plans')).toMatchObject({ title: 'Pricing Plans', id: 'pricingPlans' });
    expect(toPageSpec('FAQ')).toMatchObject({ title: 'FAQ', slug: 'faq', id: 'faq', view: 'FaqView' });
    expect(toPageSpec('  ')).toBeNull();
  });

  it('keeps ids valid identifiers when the name starts with a digit', () => {
    expect(toPageSpec('24 Hours')).toMatchObject({ slug: '24-hours', id: 'page24Hours', view: 'Page24HoursView' });
  });
});

describe('toPageSpec with apostrophes', () => {
  it.each(["Founder's Notes", 'Founder’s Notes'])('keeps %s as one word', (name) => {
    expect(toPageSpec(name)).toMatchObject({
      slug: 'founders-notes',
      id: 'foundersNotes',
      view: 'FoundersNotesView',
      ns: 'foundersNotesPage',
    });
    expect(toPageSpec(name)!.title).toBe(name);
  });

  it('ignores stray quotes', () => {
    expect(toPageSpec("'Team'")).toMatchObject({ title: 'Team', slug: 'team' });
    expect(toPageSpec("'''")).toBeNull();
  });
});

describe('parsePageNames', () => {
  it('splits, trims, and drops empty, reserved and duplicate names', () => {
    expect(parsePageNames('Pricing Plans, team,, blog, Search, pricing-plans, 404')).toEqual([
      'Pricing Plans',
      'team',
    ]);
  });
});

describe('templates', () => {
  const spec = toPageSpec('Pricing Plans')!;

  it('renders the view with PageLayout or LandingLayout', () => {
    const page = viewTemplate(spec, 'page');
    expect(page).toContain("import PageLayout from '@/layouts/PageLayout.astro';");
    expect(page).toContain("import { useTranslations, type Locale } from '@/i18n';");
    expect(page).toContain("<PageLayout title={t('pricingPlansPage.title')} description={t('pricingPlansPage.description')}>");
    expect(page).toContain("{t('pricingPlansPage.title')}</h1>");
    expect(viewTemplate(spec, 'landing')).toContain("import LandingLayout from '@/layouts/LandingLayout.astro';");
  });

  it('renders the default-locale page wrapper', () => {
    expect(pageTemplate(spec)).toBe(`---
import PricingPlansView from '@/views/PricingPlansView.astro';
import { defaultLocale } from '@/i18n';
---

<PricingPlansView locale={defaultLocale} />
`);
  });

  it('renders the [lang] wrapper', () => {
    expect(localizedPageTemplate(spec)).toBe(`---
import PricingPlansView from '@/views/PricingPlansView.astro';
import { getLocalizedStaticPaths, type Locale } from '@/i18n';

export function getStaticPaths() {
  return getLocalizedStaticPaths('pricingPlans', 'pricingPlans');
}

const { locale } = Astro.props as { locale: Locale };
---

<PricingPlansView locale={locale} />
`);
  });
});

describe('addToNavConfig', () => {
  it('appends the route and a nav item with the next order', () => {
    const out = addToNavConfig(NAV_CONFIG, toPageSpec('Pricing Plans')!);
    expect(out).toContain(
      "  search: { path: 'search', slugs: { es: 'buscar', fr: 'recherche' } },\n  pricingPlans: { path: 'pricing-plans' },\n} satisfies Record<string, RouteDefinition>;"
    );
    expect(out).toContain(
      "  { label: 'nav.search', route: 'search', order: 5 },\n  { label: 'pricingPlansPage.title', route: 'pricingPlans', order: 6 },\n];"
    );
    // Other blocks untouched
    expect(out).toContain("extraLinks: [{ label: 'GitHub', href: 'https://github.com', order: 100 }],");
  });

  it('adds a trailing comma to the previous entry when missing', () => {
    const src = "export const routes = {\n  home: { path: '' }\n};\nexport const navItems: NavItem[] = [\n  { label: 'x', route: 'home', order: 1 }\n];\n";
    const out = addToNavConfig(src, toPageSpec('Team')!);
    expect(out).toContain("  home: { path: '' },\n  team: { path: 'team' },\n};");
    expect(out).toContain("order: 1 },\n  { label: 'teamPage.title', route: 'team', order: 2 },\n];");
  });

  it('detects existing routes', () => {
    expect(hasRoute(NAV_CONFIG, 'about')).toBe(true);
    expect(hasRoute(NAV_CONFIG, 'pricingPlans')).toBe(false);
  });
});

describe('addToTranslations', () => {
  const spec = toPageSpec('Pricing Plans')!;
  const entry =
    "  pricingPlansPage: {\n    title: 'Pricing Plans',\n    description: 'Describe the Pricing Plans page here.',\n  },\n";

  it('inserts right after `const en = {`', () => {
    expect(addToTranslations(EN, spec)).toContain(`const en = {\n${entry}  meta: {`);
  });

  it('inserts right after a typed `const es: SiteStrings = {`', () => {
    expect(addToTranslations(ES, spec)).toContain(`const es: SiteStrings = {\n${entry}  meta: {`);
  });

  it('escapes quotes in titles', () => {
    expect(addToTranslations(EN, toPageSpec("Founder's Notes")!)).toContain("title: 'Founder S Notes',");
  });

  it('returns null when no top-level object is found', () => {
    expect(addToTranslations('export default {};\n', spec)).toBeNull();
  });
});

describe('generatePages', () => {
  it('writes view, page, [lang] wrapper, route, nav item and strings for every locale', () => {
    const root = createProject();
    write(root, 'src/i18n/translations/es.ts', ES);

    const result = generatePages(root, ['Pricing Plans'], 'page');

    expect(result.generated).toEqual(['Pricing Plans']);
    expect(result.warnings).toEqual([]);
    expect(read(root, 'src/views/PricingPlansView.astro')).toContain('<PageLayout');
    expect(read(root, 'src/pages/pricing-plans.astro')).toContain('<PricingPlansView locale={defaultLocale} />');
    expect(read(root, 'src/pages/[lang]/[...pricingPlans].astro')).toContain(
      "getLocalizedStaticPaths('pricingPlans', 'pricingPlans')"
    );
    expect(read(root, 'src/config/nav.config.ts')).toContain("pricingPlans: { path: 'pricing-plans' },");
    expect(read(root, 'src/i18n/translations/en.ts')).toContain('pricingPlansPage: {');
    expect(read(root, 'src/i18n/translations/es.ts')).toContain("title: 'Pricing Plans',");
    expect(result.files).toEqual(
      expect.arrayContaining([
        'src/views/PricingPlansView.astro',
        'src/pages/pricing-plans.astro',
        'src/pages/[lang]/[...pricingPlans].astro',
        'src/config/nav.config.ts',
        'src/i18n/translations/en.ts',
        'src/i18n/translations/es.ts',
      ])
    );
  });

  it('increments nav order across several pages', () => {
    const root = createProject();
    generatePages(root, ['Pricing', 'Team'], 'page');
    const nav = read(root, 'src/config/nav.config.ts');
    expect(nav).toContain("route: 'pricing', order: 6 }");
    expect(nav).toContain("route: 'team', order: 7 }");
  });

  it('skips pages whose route, view or page file exists, with a warning', () => {
    const root = createProject();
    write(root, 'src/views/TeamView.astro', 'mine');
    write(root, 'src/pages/faq.astro', 'mine');

    const result = generatePages(root, ['About', 'Team', 'FAQ', 'Pricing'], 'page');

    expect(result.generated).toEqual(['Pricing']);
    expect(result.warnings).toHaveLength(3);
    expect(result.warnings[0]).toMatch(/route "about"/);
    expect(read(root, 'src/views/TeamView.astro')).toBe('mine');
    expect(existsSync(join(root, 'src/pages/about.astro'))).toBe(false);
    expect(read(root, 'src/i18n/translations/en.ts')).not.toContain('teamPage');
  });

  it('falls back to PageLayout when LandingLayout is missing', () => {
    const root = createProject();
    rmSync(join(root, 'src/layouts/LandingLayout.astro'));
    const result = generatePages(root, ['Pricing'], 'landing');
    expect(result.warnings[0]).toMatch(/LandingLayout/);
    expect(read(root, 'src/views/PricingView.astro')).toContain('<PageLayout');
  });

  it('requires the Velocity 2 structure', () => {
    const noViews = createProject();
    rmSync(join(noViews, 'src/views'), { recursive: true });
    expect(() => generatePages(noViews, ['Pricing'], 'page')).toThrow(PagesUnsupportedError);

    const noRoutes = createProject();
    write(noRoutes, 'src/config/nav.config.ts', 'export const navItems = [];\n');
    expect(() => generatePages(noRoutes, ['Pricing'], 'page')).toThrow(/requires Velocity 2/);
  });
});
