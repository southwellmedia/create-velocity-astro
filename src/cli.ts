import mri from 'mri';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { CliOptions } from './types.js';
import type { ComponentSelection } from './registry/types.js';
import { runPrompts, showIntro, showOutro, showError } from './prompts.js';
import { scaffold } from './scaffold.js';
import { isEmptyDir } from './utils/fs.js';
import { toValidProjectName } from './utils/validate.js';

const HELP_TEXT = `
${pc.bold('create-velocity-astro')} - Create a new Velocity project

${pc.bold('Usage:')}
  npm create velocity-astro@latest [project-name] [options]
  pnpm create velocity-astro [project-name] [options]
  yarn create velocity-astro [project-name] [options]
  bun create velocity-astro [project-name] [options]

${pc.bold('Options:')}
  --demo              Include demo landing page and sample content
  --components        Include all components (default: prompt for selection)
  --components=none   Exclude all components
  --components=ui,patterns  Include specific categories
  --i18n              Add internationalization support
  --pages             Prompt for starter pages to generate
  --yes, -y           Skip prompts and use defaults
  --help, -h          Show this help message
  --version, -v       Show version number

${pc.bold('Component Categories:')}
  ui        UI components (buttons, forms, cards, dialogs) - 20 components
  patterns  Form patterns (contact form, newsletter) - 3 components
  hero      Flexible hero section component - 1 component

${pc.bold('Examples:')}
  npm create velocity-astro@latest my-site
  npm create velocity-astro@latest my-site --demo --components
  npm create velocity-astro@latest my-site --components=ui,patterns
  npm create velocity-astro@latest my-site --components=none
  npm create velocity-astro@latest my-site --i18n --pages
  pnpm create velocity-astro my-site -y
`;

const VERSION = '1.4.2';

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
    boolean: ['demo', 'i18n', 'pages', 'help', 'version', 'yes'],
    string: ['components'],
    alias: {
      h: 'help',
      v: 'version',
      y: 'yes',
    },
  });

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

  showIntro();

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

    await scaffold({
      projectName,
      targetDir,
      demo: args.demo || false,
      componentSelection: componentSelection || { mode: 'all' },
      i18n: args.i18n || false,
      pages: [],
      pageLayout: 'page',
      packageManager: 'pnpm',
    });

    showOutro(projectName, 'pnpm');
    return;
  }

  // Interactive mode
  const answers = await runPrompts({
    projectName: argProjectName,
    demo: args.demo,
    componentSelection: componentSelection,
    i18n: args.i18n,
    pages: args.pages,
  });

  // User cancelled
  if (typeof answers === 'symbol') {
    return;
  }

  const { projectName, demo, componentSelection: selectedComponents, i18n, pages, pageLayout, packageManager } = answers;
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
    });

    showOutro(projectName, packageManager);
  } catch (error) {
    showError(error instanceof Error ? error.message : 'An unexpected error occurred');
    process.exit(1);
  }
}
