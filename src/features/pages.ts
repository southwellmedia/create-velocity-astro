import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PageLayout } from '../types.js';

/**
 * Converts a page slug to a display title
 * e.g., 'about-us' -> 'About Us'
 */
function toTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converts a page slug to a route ID (snake_case)
 * e.g., 'about-us' -> 'about_us'
 */
function toRouteId(slug: string): string {
  return slug.replace(/-/g, '_');
}

/**
 * Calculates the next available nav order by finding the highest existing order
 */
function getNextNavOrder(content: string): number {
  // Match all order values in nav configs
  const orderMatches = [...content.matchAll(/order:\s*(\d+)/g)];
  let maxOrder = 0;

  for (const match of orderMatches) {
    const orderStr = match[1];
    if (orderStr) {
      const order = parseInt(orderStr, 10);
      if (order > maxOrder) {
        maxOrder = order;
      }
    }
  }

  // Return the next order (10 more than current max for room to insert)
  return maxOrder + 10;
}

/**
 * Adds a new route entry to base routes.ts (non-i18n projects)
 * Includes nav config so the page appears in navigation
 */
function addBaseRouteEntry(targetDir: string, pageName: string): void {
  const routesPath = join(targetDir, 'src', 'config', 'routes.ts');

  if (!existsSync(routesPath)) {
    return; // routes.ts doesn't exist, skip
  }

  const routeId = toRouteId(pageName);
  const title = toTitle(pageName);
  const content = readFileSync(routesPath, 'utf-8');

  // Check if route already exists
  if (content.includes(`${routeId}:`)) {
    return; // Route already defined
  }

  // Find the closing of routes object (before "} as const satisfies")
  const insertPoint = content.indexOf('} as const satisfies');
  if (insertPoint === -1) {
    return; // Can't find insertion point
  }

  // Calculate the next nav order
  const navOrder = getNextNavOrder(content);

  // Create new route entry with nav config
  const newRoute = `
  // Custom page: ${pageName}
  ${routeId}: {
    path: '/${pageName}',
    nav: { show: true, order: ${navOrder}, label: '${title}' },
  },
`;

  const newContent = content.slice(0, insertPoint) + newRoute + content.slice(insertPoint);
  writeFileSync(routesPath, newContent);
}

/**
 * Adds a new route entry to i18n routes.ts
 * Creates the route with the same English slug for all locales (user customizes later)
 * Includes nav config so the page appears in navigation
 */
function addI18nRouteEntry(targetDir: string, pageName: string): void {
  const routesPath = join(targetDir, 'src', 'i18n', 'routes.ts');

  if (!existsSync(routesPath)) {
    return; // routes.ts doesn't exist, skip
  }

  const routeId = toRouteId(pageName);
  const content = readFileSync(routesPath, 'utf-8');

  // Check if route already exists
  if (content.includes(`${routeId}:`)) {
    return; // Route already defined
  }

  // Find the closing of routes object (before "} as const satisfies")
  const insertPoint = content.indexOf('} as const satisfies');
  if (insertPoint === -1) {
    return; // Can't find insertion point
  }

  // Calculate the next nav order
  const navOrder = getNextNavOrder(content);

  // Create new route entry with nav config
  // Uses the route ID as the translation key (user should add translation)
  const title = toTitle(pageName);
  const newRoute = `
  // Custom page: ${pageName}
  ${routeId}: {
    en: '${pageName}', es: '${pageName}', fr: '${pageName}',
    nav: { show: true, order: ${navOrder}, label: 'nav.${routeId}' },
  },
`;

  const newContent = content.slice(0, insertPoint) + newRoute + content.slice(insertPoint);
  writeFileSync(routesPath, newContent);

  // Also add translation keys to translation files
  addI18nTranslationKeys(targetDir, routeId, title);
}

/**
 * Adds translation keys for a new route to all i18n translation files
 */
function addI18nTranslationKeys(targetDir: string, routeId: string, title: string): void {
  const locales = ['en', 'es', 'fr'];

  for (const locale of locales) {
    const translationPath = join(targetDir, 'src', 'i18n', 'translations', `${locale}.ts`);

    if (!existsSync(translationPath)) {
      continue;
    }

    let content = readFileSync(translationPath, 'utf-8');

    // Add nav translation if not exists
    if (!content.includes(`${routeId}:`)) {
      // Find the nav section and add the key
      const navSectionMatch = content.match(/nav:\s*\{([^}]+)\}/);
      if (navSectionMatch) {
        const navSection = navSectionMatch[0];
        const insertPoint = navSection.lastIndexOf('}');
        const newNavSection =
          navSection.slice(0, insertPoint) +
          `    ${routeId}: '${title}',\n  ` +
          navSection.slice(insertPoint);
        content = content.replace(navSection, newNavSection);
      }
    }

    // Add page-specific translations if not exists
    const pageKeyPattern = new RegExp(`^\\s*${routeId}:\\s*\\{`, 'm');
    if (!pageKeyPattern.test(content)) {
      // Find a good insertion point (before the closing export)
      const insertPoint = content.lastIndexOf('} as const');
      if (insertPoint !== -1) {
        const pageTranslations = `
  // ${title} page
  ${routeId}: {
    title: '${title}',
    description: 'Add your ${title.toLowerCase()} page description here.',
  },

`;
        content = content.slice(0, insertPoint) + pageTranslations + content.slice(insertPoint);
      }
    }

    writeFileSync(translationPath, content);
  }
}

/**
 * Generates the standard page template (non-i18n)
 */
function generatePageTemplate(pageName: string, layout: PageLayout): string {
  const title = toTitle(pageName);
  const layoutName = layout === 'landing' ? 'LandingLayout' : 'PageLayout';

  return `---
import ${layoutName} from '@/layouts/${layoutName}.astro';
---

<${layoutName}
  title="${title}"
  description="Add your description here"
>
  <!-- Hero Section -->
  <section class="py-20 bg-secondary">
    <div class="container">
      <h1 class="text-4xl font-bold text-foreground">${title}</h1>
      <p class="mt-4 text-foreground-muted max-w-2xl">
        Add your content here.
      </p>
    </div>
  </section>

  <!-- Content Section -->
  <section class="py-16">
    <div class="container">
      <!-- Your content -->
    </div>
  </section>
</${layoutName}>
`;
}

/**
 * Generates the i18n-aware page template with translated URL support
 */
function generateI18nPageTemplate(pageName: string, layout: PageLayout): string {
  const title = toTitle(pageName);
  const layoutName = layout === 'landing' ? 'LandingLayout' : 'PageLayout';
  const routeId = toRouteId(pageName);
  const titleKey = `${routeId}.title`;
  const descKey = `${routeId}.description`;

  return `---
import ${layoutName} from '@/layouts/${layoutName}.astro';
import { locales, isValidLocale, defaultLocale, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/index';
import { routes } from '@/i18n/routes';

export function getStaticPaths() {
  return locales
    .filter((lang) => lang !== defaultLocale)
    .map((lang) => ({
      params: {
        lang,
        ${routeId}: routes.${routeId}[lang],
      },
    }));
}

const { lang } = Astro.params;

if (!lang || !isValidLocale(lang)) {
  return Astro.redirect('/');
}

const locale = lang as Locale;
const t = useTranslations(locale);
---

<${layoutName}
  title={t('${titleKey}') || '${title}'}
  description={t('${descKey}') || 'Add your description here'}
  lang={locale}
  routeId="${routeId}"
>
  <!-- Hero Section -->
  <section class="py-20 bg-secondary">
    <div class="container">
      <h1 class="text-4xl font-bold text-foreground">
        {t('${titleKey}') || '${title}'}
      </h1>
      <p class="mt-4 text-foreground-muted max-w-2xl">
        {t('${descKey}') || 'Add your content here.'}
      </p>
    </div>
  </section>

  <!-- Content Section -->
  <section class="py-16">
    <div class="container">
      <!-- Your content -->
    </div>
  </section>
</${layoutName}>
`;
}

/**
 * Generates pages in the target directory
 */
export async function generatePages(
  targetDir: string,
  pages: string[],
  layout: PageLayout,
  isI18n: boolean
): Promise<string[]> {
  const generatedFiles: string[] = [];

  if (pages.length === 0) {
    return generatedFiles;
  }

  // Ensure pages directory exists
  const pagesDir = join(targetDir, 'src', 'pages');
  if (!existsSync(pagesDir)) {
    mkdirSync(pagesDir, { recursive: true });
  }

  // Generate standard pages (English / default locale)
  for (const pageName of pages) {
    const filePath = join(pagesDir, `${pageName}.astro`);
    const template = generatePageTemplate(pageName, layout);
    writeFileSync(filePath, template);
    generatedFiles.push(`src/pages/${pageName}.astro`);

    // Add route entry to base routes.ts (for non-i18n nav)
    if (!isI18n) {
      addBaseRouteEntry(targetDir, pageName);
    }
  }

  // Generate i18n pages if enabled
  if (isI18n) {
    const langDir = join(pagesDir, '[lang]');
    if (!existsSync(langDir)) {
      mkdirSync(langDir, { recursive: true });
    }

    for (const pageName of pages) {
      const routeId = toRouteId(pageName);
      // Use rest parameter syntax for translated URL slugs
      const filePath = join(langDir, `[...${routeId}].astro`);
      const template = generateI18nPageTemplate(pageName, layout);
      writeFileSync(filePath, template);
      generatedFiles.push(`src/pages/[lang]/[...${routeId}].astro`);

      // Add route entry to i18n routes.ts
      addI18nRouteEntry(targetDir, pageName);
    }
  }

  return generatedFiles;
}

/**
 * List of page-related files that could be generated
 */
export const PAGES_FILES = [
  'src/pages/{pageName}.astro',
  'src/pages/[lang]/[...{routeId}].astro',
];
