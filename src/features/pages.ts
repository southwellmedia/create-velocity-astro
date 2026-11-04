/**
 * Starter page generation (`--pages`) for Velocity 2.
 *
 * Velocity 2 keeps page content in views (src/views/<Name>View.astro, which
 * take a `locale` prop). Pages are thin wrappers: one for the default locale
 * and a [lang] wrapper for other locales (it generates nothing while only one
 * locale is enabled, so adding locales later just works). Routes and nav live
 * in src/config/nav.config.ts, and all copy goes through useTranslations.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { PageLayout } from '../types.js';

/** Slugs that collide with core Velocity routes. */
const RESERVED_SLUGS = ['index', 'blog', '404', 'rss', 'search', 'lang'];

const ROUTES_OPEN = 'export const routes = {';
const NAV_ITEMS_OPEN = 'export const navItems: NavItem[] = [';

export interface PageSpec {
  /** Display title, e.g. "Pricing Plans" */
  title: string;
  /** URL slug, e.g. "pricing-plans" */
  slug: string;
  /** Route id (camelCase), e.g. "pricingPlans" */
  id: string;
  /** View component name, e.g. "PricingPlansView" */
  view: string;
  /** Translation key namespace, e.g. "pricingPlansPage" */
  ns: string;
}

export class PagesUnsupportedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PagesUnsupportedError';
  }
}

const APOSTROPHES = /['\u2019]/g;

/** Words of a page name. Apostrophes stay inside a word: "Founder's" is one word. */
function words(name: string): string[] {
  return name
    .trim()
    .split(/[^A-Za-z0-9'\u2019]+/)
    .map((w) => w.replace(/^['\u2019]+|['\u2019]+$/g, ''))
    .filter((w) => w.replace(APOSTROPHES, '').length > 0);
}

const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);
const pascalWord = (w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

/**
 * Derives every name used for a page from what the user typed.
 * "Pricing Plans" → slug pricing-plans, id pricingPlans, view PricingPlansView,
 * namespace pricingPlansPage. Returns null if the name has no usable characters.
 */
export function toPageSpec(name: string): PageSpec | null {
  const titleWords = words(name);
  if (titleWords.length === 0) return null;
  const parts = titleWords.map((w) => w.replace(APOSTROPHES, ''));

  const pascal = parts.map(pascalWord).join('');
  let id = parts[0]!.toLowerCase() + parts.slice(1).map(pascalWord).join('');
  let view = `${pascal}View`;
  if (/^[0-9]/.test(id)) {
    id = `page${pascal}`;
    view = `Page${pascal}View`;
  }

  return {
    title: titleWords.map(capitalize).join(' '),
    slug: parts.map((w) => w.toLowerCase()).join('-'),
    id,
    view,
    ns: `${id}Page`,
  };
}

/**
 * Parses comma-separated page names, dropping empty, reserved and duplicate ones.
 */
export function parsePageNames(input: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(',')) {
    const spec = toPageSpec(raw);
    if (!spec || RESERVED_SLUGS.includes(spec.slug) || seen.has(spec.slug)) continue;
    seen.add(spec.slug);
    result.push(raw.trim());
  }
  return result;
}

const quote = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export function viewTemplate(spec: PageSpec, layout: PageLayout): string {
  const layoutName = layout === 'landing' ? 'LandingLayout' : 'PageLayout';
  return `---
import ${layoutName} from '@/layouts/${layoutName}.astro';
import { useTranslations, type Locale } from '@/i18n';

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = useTranslations(locale);
---

<${layoutName} title={t('${spec.ns}.title')} description={t('${spec.ns}.description')}>
  <section class="mx-auto max-w-4xl px-6 py-24">
    <h1 class="font-display text-foreground text-4xl font-bold tracking-tight md:text-5xl">{t('${spec.ns}.title')}</h1>
    <p class="text-foreground-muted mt-6 text-lg">{t('${spec.ns}.description')}</p>
  </section>
</${layoutName}>
`;
}

export function pageTemplate(spec: PageSpec): string {
  return `---
import ${spec.view} from '@/views/${spec.view}.astro';
import { defaultLocale } from '@/i18n';
---

<${spec.view} locale={defaultLocale} />
`;
}

export function localizedPageTemplate(spec: PageSpec): string {
  return `---
import ${spec.view} from '@/views/${spec.view}.astro';
import { getLocalizedStaticPaths, type Locale } from '@/i18n';

export function getStaticPaths() {
  return getLocalizedStaticPaths('${spec.id}', '${spec.id}');
}

const { locale } = Astro.props as { locale: Locale };
---

<${spec.view} locale={locale} />
`;
}

/** Finds the [start, end) character range of a block opened by `opener` and closed by a line starting with `closer`. */
function findBlock(content: string, opener: string, closer: string): { bodyStart: number; closeStart: number } | null {
  const open = content.indexOf(opener);
  if (open === -1) return null;
  const bodyStart = content.indexOf('\n', open) + 1;
  if (bodyStart === 0) return null;
  const closeRe = new RegExp(`^${closer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
  const rest = content.slice(bodyStart);
  const match = closeRe.exec(rest);
  if (!match) return null;
  return { bodyStart, closeStart: bodyStart + match.index };
}

/** Inserts `entry` (a full line) as the last entry of a block, adding a trailing comma to the previous entry if needed. */
function insertLastEntry(content: string, block: { bodyStart: number; closeStart: number }, entry: string): string {
  let before = content.slice(0, block.closeStart);
  const trimmed = before.replace(/\s+$/, '');
  if (block.closeStart > block.bodyStart && trimmed.length > 0 && !/[,{[]$/.test(trimmed)) {
    before = `${trimmed},\n`;
  }
  return before + entry + content.slice(block.closeStart);
}

/** Returns true if the routes block already defines `id`. */
export function hasRoute(navConfig: string, id: string): boolean {
  const block = findBlock(navConfig, ROUTES_OPEN, '}');
  if (!block) return false;
  const body = navConfig.slice(block.bodyStart, block.closeStart);
  return new RegExp(`^\\s*['"]?${id}['"]?\\s*:`, 'm').test(body);
}

/**
 * Adds the route and nav item for a page to nav.config.ts content.
 */
export function addToNavConfig(navConfig: string, spec: PageSpec): string {
  const routes = findBlock(navConfig, ROUTES_OPEN, '}');
  if (!routes) throw new PagesUnsupportedError('nav.config.ts has no `export const routes = {` block.');
  let content = insertLastEntry(navConfig, routes, `  ${spec.id}: { path: '${spec.slug}' },\n`);

  const nav = findBlock(content, NAV_ITEMS_OPEN, ']');
  if (nav) {
    const body = content.slice(nav.bodyStart, nav.closeStart);
    const orders = [...body.matchAll(/order:\s*(-?\d+)/g)].map((m) => parseInt(m[1]!, 10));
    const next = (orders.length > 0 ? Math.max(...orders) : 0) + 1;
    content = insertLastEntry(
      content,
      nav,
      `  { label: '${spec.ns}.title', route: '${spec.id}', order: ${next} },\n`
    );
  }
  return content;
}

/** Matches the line that opens a translation file's top-level object. */
const TRANSLATIONS_OPEN = /^(?:export[ \t]+)?const[ \t]+[A-Za-z_$][\w$]*[ \t]*(?::[^=\n]+)?=[ \t]*\{[ \t]*$/m;

/**
 * Adds `nav.<id>`, which Velocity uses to title the page's social image. A `nav`
 * block on one line is left alone rather than risk a duplicate key.
 */
function addNavLabel(source: string, spec: PageSpec, insertAt: number): string {
  const label = `    ${spec.id}: ${quote(spec.title)},\n`;
  const open = /^  nav:[ \t]*\{[ \t]*$/m.exec(source);
  if (open) {
    const after = open.index + open[0].length + 1;
    return source.slice(0, after) + label + source.slice(after);
  }
  if (/^  nav:/m.test(source)) return source;
  return source.slice(0, insertAt) + `  nav: {\n${label}  },\n` + source.slice(insertAt);
}

/**
 * Adds the page's nav label and title/description keys right after the line that
 * opens the top-level object. Returns null if no such line is found.
 */
export function addToTranslations(source: string, spec: PageSpec): string | null {
  const match = TRANSLATIONS_OPEN.exec(source);
  if (!match) return null;
  const insertAt = match.index + match[0].length + 1;
  const entry =
    `  ${spec.ns}: {\n` +
    `    title: ${quote(spec.title)},\n` +
    `    description: ${quote(`Describe the ${spec.title} page here.`)},\n` +
    `  },\n`;
  return addNavLabel(source.slice(0, insertAt) + entry + source.slice(insertAt), spec, insertAt);
}

function writeFile(targetDir: string, rel: string, content: string): void {
  const full = join(targetDir, rel);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

export interface GeneratePagesResult {
  /** Files created or modified, relative to the project */
  files: string[];
  /** Page titles that were generated */
  generated: string[];
  warnings: string[];
}

/**
 * Generates starter pages. Pages whose route id, view or page file already
 * exists are skipped with a warning. Throws PagesUnsupportedError if the
 * project does not have the Velocity 2 structure.
 */
export function generatePages(targetDir: string, pageNames: string[], layout: PageLayout): GeneratePagesResult {
  const result: GeneratePagesResult = { files: [], generated: [], warnings: [] };
  if (pageNames.length === 0) return result;

  const viewsDir = join(targetDir, 'src', 'views');
  const navPath = join(targetDir, 'src', 'config', 'nav.config.ts');
  const unsupported =
    '--pages requires Velocity 2 (src/views and the `routes` export in src/config/nav.config.ts).';
  if (!existsSync(viewsDir) || !statSync(viewsDir).isDirectory() || !existsSync(navPath)) {
    throw new PagesUnsupportedError(unsupported);
  }
  let navConfig = readFileSync(navPath, 'utf-8');
  if (!findBlock(navConfig, ROUTES_OPEN, '}')) throw new PagesUnsupportedError(unsupported);

  if (layout === 'landing' && !existsSync(join(targetDir, 'src', 'layouts', 'LandingLayout.astro'))) {
    result.warnings.push('LandingLayout.astro not found; using PageLayout.');
    layout = 'page';
  }

  const translationsDir = join(targetDir, 'src', 'i18n', 'translations');
  const translationFiles = existsSync(translationsDir)
    ? readdirSync(translationsDir).filter((f) => f.endsWith('.ts')).sort()
    : [];
  const translations = new Map(
    translationFiles.map((f) => [f, readFileSync(join(translationsDir, f), 'utf-8')] as const)
  );
  const touched = new Set<string>();

  for (const name of pageNames) {
    const spec = toPageSpec(name);
    if (!spec) continue;

    const viewRel = `src/views/${spec.view}.astro`;
    const pageRel = `src/pages/${spec.slug}.astro`;
    const langRel = `src/pages/[lang]/[...${spec.id}].astro`;

    const conflicts: string[] = [];
    if (hasRoute(navConfig, spec.id)) conflicts.push(`route "${spec.id}"`);
    for (const rel of [viewRel, pageRel, langRel]) {
      if (existsSync(join(targetDir, rel))) conflicts.push(rel);
    }
    if (conflicts.length > 0) {
      result.warnings.push(`Skipped page "${spec.title}": ${conflicts.join(', ')} already exists.`);
      continue;
    }

    writeFile(targetDir, viewRel, viewTemplate(spec, layout));
    writeFile(targetDir, pageRel, pageTemplate(spec));
    writeFile(targetDir, langRel, localizedPageTemplate(spec));
    result.files.push(viewRel, pageRel, langRel);

    navConfig = addToNavConfig(navConfig, spec);
    touched.add('src/config/nav.config.ts');

    for (const [file, source] of translations) {
      const updated = addToTranslations(source, spec);
      if (updated === null) {
        result.warnings.push(`Could not add "${spec.ns}" strings to src/i18n/translations/${file}; add them manually.`);
        continue;
      }
      translations.set(file, updated);
      touched.add(`src/i18n/translations/${file}`);
    }

    result.generated.push(spec.title);
  }

  if (touched.has('src/config/nav.config.ts')) writeFileSync(navPath, navConfig);
  for (const [file, source] of translations) {
    const rel = `src/i18n/translations/${file}`;
    if (touched.has(rel)) writeFileSync(join(translationsDir, file), source);
  }
  result.files.push(...touched);

  return result;
}
