import mri from 'mri';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { CliOptions } from './types.js';
import type { ComponentSelection } from './registry/types.js';
import { runPrompts, showIntro, showOutro, showError, showWarning } from './prompts.js';
import { scaffold } from './scaffold.js';
import { upgrade } from './upgrade.js';
import { isEmptyDir } from './utils/fs.js';
import { toValidProjectName } from './utils/validate.js';
import { resolveTemplateSource } from './template-source.js';
import { parsePageNames } from './features/pages.js';
import { detectPackageManager } from './utils/package-manager.js';
import {
  fetchTemplateVersion,
  parseSiteFlags,
  supportsSiteSetup,
  titleCase,
  type SiteOptions,
} from './features/site.js';
import type { TemplateSource } from './template-source.js';

declare const CLI_VERSION: string;

const HELP_TEXT = `
${pc.bold('create-velocity-astro')} - Create and upgrade Velocity (Astro 7 + Tailwind v4) projects

${pc.bold('Usage:')}
  npm create velocity-astro@latest [project-name] -- [options]
  pnpm create velocity-astro [project-name] [options]

${pc.bold('Commands:')}
  ${pc.cyan('upgrade')}             Upgrade an existing Velocity project
    --dry-run           Preview changes without applying them
    --yes, -y           Skip confirmation prompts
    --ref <tag|branch>  Upgrade to a specific Velocity tag or branch
    --template <dir>    Upgrade from a local Velocity checkout

${pc.bold('Options:')}
  --start own|demo|blank  What you're starting (default: own)
                      own    a clean project your AI agent builds into your site
                      demo   the Velocity demo with every component
                      blank  a clean project with no site brief
  --demo              Same as --start demo
  --name "Rosa's Bakery"  Site name (default: the project name, title-cased)
  --describe "…"      One sentence on what the site is for
  --components        Include all components (the default)
  --components=none   Exclude optional components (core pages keep what they need)
  --components=ui,patterns  Include specific categories
  --i18n              Add internationalization support
  --pages="Pricing, Team"  Generate these starter pages and plan them in the brief
  --ref <tag|branch>  Velocity tag or branch to scaffold from
                      (default: latest GitHub release, falling back to main)
  --template <dir>    Scaffold from a local Velocity checkout instead of GitHub
  --no-install        Skip installing dependencies
  --yes, -y           Skip prompts and use defaults
  --help, -h          Show this help message
  --version, -v       Show version number

${pc.bold('Component Categories:')}
  ui        UI components (buttons, forms, cards, dialogs)
  patterns  Form patterns (contact form, newsletter, search)
  hero      Flexible hero section component

${pc.bold('Requirements:')}
  Generated projects need Node.js >= 22.23.4 (Node 24 LTS recommended).

${pc.bold('Examples:')}
  npm create velocity-astro@latest my-site
  npm create velocity-astro@latest my-site -- --demo
  pnpm create velocity-astro rosas-bakery -y --name "Rosa's Bakery" --describe "Neighbourhood bakery in Leith"
  npm create velocity-astro@latest my-site -- --components=ui,patterns
  npm create velocity-astro@latest my-site -- --ref v2.0.0
  pnpm create velocity-astro my-site -y --template ../velocity
  pnpm create velocity-astro my-site -y --pages "Pricing Plans, Team"

  ${pc.dim('# Upgrade an existing project')}
  pnpm create velocity-astro upgrade
  pnpm create velocity-astro upgrade --dry-run
  pnpm create velocity-astro upgrade --ref v2.1.0
`;

const VERSION = CLI_VERSION;

/**
 * Parses the --components flag into a ComponentSelection
 */
function parseComponentsFlag(value: string | boolean | undefined): ComponentSelection | undefined {
  // Not specified - will prompt user
  if (value === undefined) {
    return undefined;
  }

  // --components (boolean true) - include all
  if (value === true) {
    return { mode: 'all' };
  }

  // --components=false or explicit false
  if (value === false) {
    return { mode: 'none' };
  }

  // --components=none
  if (value === 'none' || value === 'false') {
    return { mode: 'none' };
  }

  // --components=all
  if (value === 'all' || value === 'true') {
    return { mode: 'all' };
  }

  // --components=ui,patterns,hero (category list)
  const categories = value.split(',').map((s) => s.trim().toLowerCase());
  const validCategories = ['ui', 'patterns', 'hero'];
  const filtered = categories.filter((c) => validCategories.includes(c));

  if (filtered.length === 0) {
    return { mode: 'all' }; // Fall back to all if no valid categories
  }

  return { mode: 'categories', categories: filtered };
}

export async function run(argv: string[]): Promise<void> {
  const args = mri<CliOptions>(argv, {
    boolean: ['demo', 'i18n', 'help', 'version', 'yes', 'dry-run', 'install'],
    string: ['components', 'ref', 'template', 'pages', 'start', 'name', 'describe', 'direction', 'brand'],
    alias: {
      h: 'help',
      v: 'version',
      y: 'yes',
    },
    default: {
      install: true,
    },
  });

  const ref = typeof args.ref === 'string' && args.ref.trim() ? args.ref.trim() : undefined;
  const template =
    typeof args.template === 'string' && args.template.trim() ? args.template.trim() : undefined;

  // Handle help
  if (args.help) {
    console.log(HELP_TEXT);
    return;
  }

  // Handle version
  if (args.version) {
    console.log(VERSION);
    return;
  }

  // Handle upgrade subcommand
  const subcommand = args._[0] as string | undefined;
  if (subcommand === 'upgrade') {
    const targetDir = resolve(process.cwd());
    await upgrade({
      targetDir,
      dryRun: (args as unknown as Record<string, unknown>)['dry-run'] as boolean || false,
      yes: args.yes || false,
      ref,
      template,
    });
    return;
  }

  showIntro();

  // Resolve where the template comes from (before prompts, so the component
  // registry shown in prompts matches the template being scaffolded)
  let templateSource: TemplateSource;
  try {
    templateSource = await resolveTemplateSource(
      { ref, template },
      { notice: (message) => showWarning(message) }
    );
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
  const install = args.install !== false;

  const siteFlags = parseSiteFlags(args);
  if (siteFlags.ignored.length) {
    showWarning(`${siteFlags.ignored.join(' and ')} ${siteFlags.ignored.length > 1 ? 'are' : 'is'} no longer used: Velocity's design tools were removed in 2.5.1. Ignoring.`);
  }
  if (siteFlags.error) {
    showError(siteFlags.error);
    process.exit(1);
  }
  // The brief and site name prompts need a Velocity 2.5+ template; older refs get the previous flow.
  const templateVersion = await fetchTemplateVersion(templateSource);
  const siteSetup = supportsSiteSetup(templateVersion);

  // --pages            → prompt for page names
  // --pages "A, B"     → generate these pages
  const pagesFlag = typeof args.pages === 'string' ? args.pages : undefined;
  const pageNames = pagesFlag ? parsePageNames(pagesFlag) : [];

  // Get project name from args or prompt
  const argProjectName = args._[0] as string | undefined;

  // Parse component selection from CLI
  const componentSelection = parseComponentsFlag(args.components);

  // Skip prompts mode
  if (args.yes) {
    const projectName = toValidProjectName(argProjectName || 'my-velocity-site');
    const targetDir = resolve(process.cwd(), projectName);

    if (existsSync(targetDir) && !isEmptyDir(targetDir)) {
      showError(`Directory "${projectName}" already exists and is not empty.`);
      process.exit(1);
    }

    const packageManager = detectPackageManager();
    const start = siteFlags.options.start ?? 'own';
    const site: SiteOptions = {
      start,
      ...(start === 'own'
        ? {
            name: siteFlags.options.name ?? titleCase(projectName),
            ...(siteFlags.options.describe ? { describe: siteFlags.options.describe } : {}),
          }
        : {}),
    };

    try {
      await scaffold({
        projectName,
        targetDir,
        demo: start === 'demo',
        componentSelection: componentSelection || { mode: 'all' },
        i18n: args.i18n || false,
        pages: pageNames,
        pageLayout: 'page',
        packageManager,
        templateSource,
        install,
        site,
      });
    } catch (error) {
      showError(error instanceof Error ? error.message : 'An unexpected error occurred');
      process.exit(1);
    }

    showOutro(projectName, packageManager, { site, siteSetup, installed: install });
    return;
  }

  // Interactive mode
  const answers = await runPrompts({
    projectName: argProjectName,
    ...siteFlags.options,
    componentSelection: componentSelection,
    i18n: args.i18n ? true : undefined,
    pageNames,
    siteSetup,
  });

  // User cancelled
  if (typeof answers === 'symbol') {
    return;
  }

  const { projectName, site, demo, componentSelection: selectedComponents, i18n, pages, pageLayout, packageManager } = answers;
  const targetDir = resolve(process.cwd(), projectName);

  // Check if directory exists and is not empty
  if (existsSync(targetDir) && !isEmptyDir(targetDir)) {
    const shouldOverwrite = await p.confirm({
      message: `Directory "${projectName}" already exists. Continue and overwrite?`,
      initialValue: false,
    });

    if (!shouldOverwrite || p.isCancel(shouldOverwrite)) {
      p.cancel('Operation cancelled.');
      process.exit(0);
    }
  }

  // Run scaffold
  try {
    await scaffold({
      projectName,
      targetDir,
      demo,
      componentSelection: selectedComponents,
      i18n,
      pages,
      pageLayout,
      packageManager,
      templateSource,
      install,
      site,
    });

    showOutro(projectName, packageManager, { site, siteSetup, installed: install });
  } catch (error) {
    showError(error instanceof Error ? error.message : 'An unexpected error occurred');
    process.exit(1);
  }
}
