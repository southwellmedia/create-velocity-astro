import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { PackageManager, PageLayout, PromptAnswers } from './types.js';
import type { ComponentSelection, ComponentRegistry, ComponentSelectionMode } from './registry/types.js';
import { validateProjectName, toValidProjectName } from './utils/validate.js';
import { detectPackageManager } from './utils/package-manager.js';
import { fetchRegistry } from './registry/fetcher.js';
import { getComponentsByCategory, resolveDependencies, getSelectionStats } from './registry/resolver.js';

interface PromptDefaults {
  projectName?: string;
  demo?: boolean;
  componentSelection?: ComponentSelection;
  i18n?: boolean;
  pages?: boolean;
}

/**
 * Parses comma-separated page names into an array of valid page slugs
 */
function parsePageNames(input: string): string[] {
  if (!input.trim()) return [];

  return input
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0)
    .map((name) => name.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''))
    .filter((name) => name.length > 0 && !['index', 'blog', '404', 'rss'].includes(name));
}

/**
 * Prompts user for component selection mode
 */
async function promptComponentMode(): Promise<ComponentSelectionMode> {
  const result = await p.select({
    message: 'Include optional components?',
    options: [
      {
        value: 'all' as ComponentSelectionMode,
        label: 'All',
        hint: 'Include all 24 optional components',
      },
      {
        value: 'categories' as ComponentSelectionMode,
        label: 'Select categories',
        hint: 'Choose component groups',
      },
      {
        value: 'individual' as ComponentSelectionMode,
        label: 'Select individual',
        hint: 'Pick specific components',
      },
      {
        value: 'none' as ComponentSelectionMode,
        label: 'None',
        hint: 'Minimal template',
      },
    ],
    initialValue: 'all' as ComponentSelectionMode,
  });

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return result;
}

/**
 * Prompts user to select component categories
 */
async function promptCategories(registry: ComponentRegistry): Promise<string[]> {
  const categoryOptions = Object.entries(registry.categories).map(([id, cat]) => {
    const componentCount = getComponentsByCategory(id, registry).length;
    return {
      value: id,
      label: cat.name,
      hint: `${componentCount} components - ${cat.description}`,
    };
  });

  const result = await p.multiselect({
    message: 'Select component categories:',
    options: categoryOptions,
    required: true,
  });

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return result as string[];
}

/**
 * Prompts user to select individual components
 */
async function promptComponents(registry: ComponentRegistry): Promise<string[]> {
  // Group components by category for better UX
  const componentsByCategory: Record<string, { value: string; label: string; hint: string }[]> = {};

  for (const [id, comp] of Object.entries(registry.components)) {
    if (!componentsByCategory[comp.category]) {
      componentsByCategory[comp.category] = [];
    }
    const depCount = comp.dependencies.components.length;
    const depHint = depCount > 0 ? ` (requires ${depCount} dep${depCount > 1 ? 's' : ''})` : '';
    const categoryName = registry.categories[comp.category]?.name ?? comp.category;
    componentsByCategory[comp.category]!.push({
      value: id,
      label: comp.name,
      hint: `${categoryName}${depHint}`,
    });
  }

  // Flatten into options with category headers
  const options: { value: string; label: string; hint?: string }[] = [];
  for (const [categoryId, components] of Object.entries(componentsByCategory)) {
    const categoryName = registry.categories[categoryId]?.name || categoryId;
    // Add all components from this category
    for (const comp of components) {
      options.push({
        ...comp,
        hint: categoryName,
      });
    }
  }

  const result = await p.multiselect({
    message: 'Select components (dependencies auto-included):',
    options,
    required: true,
  });

  if (p.isCancel(result)) {
    p.cancel('Operation cancelled.');
    process.exit(0);
  }

  return result as string[];
}

/**
 * Gets component selection from user prompts
 */
async function getComponentSelection(
  defaultSelection?: ComponentSelection
): Promise<ComponentSelection> {
  if (defaultSelection) {
    return defaultSelection;
  }

  let registry: ComponentRegistry;
  try {
    registry = await fetchRegistry();
  } catch {
    // Fallback to simple yes/no if registry unavailable
    const useComponents = await p.select({
      message: 'Include UI component library?',
      options: [
        { value: true, label: 'Yes', hint: 'Buttons, forms, cards, dialogs, etc.' },
        { value: false, label: 'No', hint: 'Just the basics' },
      ],
      initialValue: true,
    });

    if (p.isCancel(useComponents)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }

    return { mode: useComponents ? 'all' : 'none' };
  }

  const mode = await promptComponentMode();

  switch (mode) {
    case 'none':
      return { mode: 'none' };

    case 'all':
      return { mode: 'all' };

    case 'categories': {
      const categories = await promptCategories(registry);
      // Show what will be included
      const selection: ComponentSelection = { mode: 'categories', categories };
      const resolved = resolveDependencies(selection, registry);
      const stats = getSelectionStats(resolved, registry);
      p.log.info(
        pc.dim(`Selected ${stats.componentCount} components (${resolved.files.length} files)`)
      );
      return selection;
    }

    case 'individual': {
      const components = await promptComponents(registry);
      // Show what will be included (with dependencies)
      const selection: ComponentSelection = { mode: 'individual', components };
      const resolved = resolveDependencies(selection, registry);
      const stats = getSelectionStats(resolved, registry);
      if (resolved.components.length > components.length) {
        p.log.info(
          pc.dim(
            `Selected ${components.length} components + ${resolved.components.length - components.length} dependencies (${resolved.files.length} files)`
          )
        );
      } else {
        p.log.info(
          pc.dim(`Selected ${stats.componentCount} components (${resolved.files.length} files)`)
        );
      }
      return selection;
    }
  }
}

export async function runPrompts(defaults: PromptDefaults = {}): Promise<PromptAnswers | symbol> {
  const detectedPm = detectPackageManager();

  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: 'What is your project name?',
          placeholder: defaults.projectName || 'my-velocity-site',
          defaultValue: defaults.projectName,
          validate: (value) => {
            const name = value || defaults.projectName || 'my-velocity-site';
            const result = validateProjectName(toValidProjectName(name));
            if (!result.valid) return result.message;
          },
        }),

      demo:
        defaults.demo !== undefined
          ? () => Promise.resolve(defaults.demo)
          : () =>
              p.select({
                message: 'Include demo landing page and sample content?',
                options: [
                  {
                    value: false,
                    label: 'No',
                    hint: 'Minimal starter with basic pages',
                  },
                  {
                    value: true,
                    label: 'Yes',
                    hint: 'Full demo with landing page, blog posts',
                  },
                ],
                initialValue: false,
              }),

      componentSelection: () => getComponentSelection(defaults.componentSelection),

      i18n:
        defaults.i18n !== undefined
          ? () => Promise.resolve(defaults.i18n)
          : () =>
              p.select({
                message: 'Add internationalization (i18n)?',
                options: [
                  {
                    value: false,
                    label: 'No',
                    hint: 'English only',
                  },
                  {
                    value: true,
                    label: 'Yes',
                    hint: 'Locale routing, translations',
                  },
                ],
                initialValue: false,
              }),

      generatePages:
        defaults.pages !== undefined
          ? () => Promise.resolve(defaults.pages)
          : () =>
              p.select({
                message: 'Generate starter pages?',
                options: [
                  {
                    value: false,
                    label: 'No',
                    hint: 'Create pages manually later',
                  },
                  {
                    value: true,
                    label: 'Yes',
                    hint: 'Auto-generate page files with layout',
                  },
                ],
                initialValue: false,
              }),

      pageNames: ({ results }) =>
        results.generatePages
          ? p.text({
              message: 'Enter page names (comma-separated):',
              placeholder: 'about, pricing, faq, contact',
              validate: (value) => {
                const pages = parsePageNames(value);
                if (pages.length === 0) {
                  return 'Please enter at least one valid page name';
                }
              },
            })
          : Promise.resolve(''),

      pageLayout: ({ results }) =>
        results.generatePages
          ? results.demo
            ? p.select({
                message: 'Select layout for pages:',
                options: [
                  {
                    value: 'page' as PageLayout,
                    label: 'PageLayout',
                    hint: 'Standard content pages (Header + Footer)',
                  },
                  {
                    value: 'landing' as PageLayout,
                    label: 'LandingLayout',
                    hint: 'Marketing pages (Navbar + LandingFooter)',
                  },
                ],
                initialValue: 'page' as PageLayout,
              })
            : Promise.resolve('page' as PageLayout) // Force PageLayout when demo=No
          : Promise.resolve('page' as PageLayout),

      packageManager: () =>
        p.select({
          message: 'Which package manager?',
          options: [
            {
              value: 'pnpm' as PackageManager,
              label: 'pnpm',
              hint: detectedPm === 'pnpm' ? 'detected' : 'recommended',
            },
            {
              value: 'npm' as PackageManager,
              label: 'npm',
              hint: detectedPm === 'npm' ? 'detected' : undefined,
            },
            {
              value: 'yarn' as PackageManager,
              label: 'yarn',
              hint: detectedPm === 'yarn' ? 'detected' : undefined,
            },
            {
              value: 'bun' as PackageManager,
              label: 'bun',
              hint: detectedPm === 'bun' ? 'detected' : undefined,
            },
          ],
          initialValue: detectedPm,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  return {
    projectName: toValidProjectName(answers.projectName || defaults.projectName || 'my-velocity-site'),
    demo: answers.demo as boolean,
    componentSelection: answers.componentSelection as ComponentSelection,
    i18n: answers.i18n as boolean,
    pages: parsePageNames(answers.pageNames as string),
    pageLayout: (answers.pageLayout as PageLayout) || 'page',
    packageManager: answers.packageManager as PackageManager,
  };
}

export function showIntro(): void {
  console.log();
  p.intro(pc.bgCyan(pc.black(' Create Velocity ')));
}

export function showOutro(projectName: string, packageManager: PackageManager): void {
  const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;

  p.note(
    [
      `cd ${projectName}`,
      `${runCmd} dev`,
    ].join('\n'),
    'Next steps'
  );

  p.outro(pc.green('Happy building!'));
}

export function showError(message: string): void {
  p.log.error(pc.red(message));
}

export function showWarning(message: string): void {
  p.log.warn(pc.yellow(message));
}

export function showSuccess(message: string): void {
  p.log.success(pc.green(message));
}

export function showStep(message: string): void {
  p.log.step(message);
}
