import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { PackageManager, PromptAnswers } from './types.js';
import type { ComponentSelection } from './registry/types.js';
import { validateProjectName, toValidProjectName } from './utils/validate.js';
import { detectPackageManager, getInstallCommand } from './utils/package-manager.js';
import { titleCase, type SiteOptions, type StartMode } from './features/site.js';

interface PromptDefaults {
  projectName?: string;
  /** From --start (or --demo) */
  start?: StartMode;
  name?: string;
  describe?: string;
  componentSelection?: ComponentSelection;
  i18n?: boolean;
  /** Page names given on the command line */
  pageNames?: string[];
  /** Whether the template ships the site brief (Velocity 2.5+) */
  siteSetup?: boolean;
}

function cancel(): never {
  p.cancel('Operation cancelled.');
  process.exit(0);
}

/**
 * Interactive flow: what the site is, not how to assemble it. Component selection and
 * starter pages left the prompts (their flags still work): agents build sections from
 * primitives, and unused primitives cost nothing at build.
 */
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

      start: () =>
        defaults.start !== undefined
          ? Promise.resolve(defaults.start)
          : p.select({
              message: 'What are you starting?',
              options: [
                { value: 'own' as StartMode, label: 'My own site', hint: 'A clean project your AI agent builds into your site' },
                { value: 'demo' as StartMode, label: 'Explore the Velocity demo', hint: 'Every component and sample pages' },
                { value: 'blank' as StartMode, label: 'Blank project', hint: 'Build it by hand, no agent setup' },
              ],
              initialValue: 'own' as StartMode,
            }),

      name: ({ results }) => {
        const projectName = toValidProjectName(results.projectName || defaults.projectName || 'my-velocity-site');
        if (results.start !== 'own' || !defaults.siteSetup) return Promise.resolve(undefined);
        if (defaults.name) return Promise.resolve(defaults.name);
        return p.text({
          message: 'Site name?',
          placeholder: titleCase(projectName),
          defaultValue: titleCase(projectName),
        });
      },

      describe: ({ results }) => {
        if (results.start !== 'own' || !defaults.siteSetup) return Promise.resolve(undefined);
        if (defaults.describe !== undefined) return Promise.resolve(defaults.describe);
        return p.text({
          message: "What's the site for? One sentence, or Enter to skip",
          placeholder: 'A neighbourhood bakery in Leith with a wood-fired oven',
          defaultValue: '',
        });
      },

      i18n: () =>
        defaults.i18n !== undefined
          ? Promise.resolve(defaults.i18n)
          : p.select({
              message: 'Add internationalization (i18n)?',
              options: [
                { value: false, label: 'No', hint: 'English only' },
                { value: true, label: 'Yes', hint: 'Locale routing, translations' },
              ],
              initialValue: false,
            }),

      packageManager: () =>
        p.select({
          message: 'Which package manager?',
          options: (['pnpm', 'npm', 'yarn', 'bun'] as PackageManager[]).map((pm) => ({
            value: pm,
            label: pm,
            hint: detectedPm === pm ? 'detected' : pm === 'pnpm' ? 'recommended' : undefined,
          })),
          initialValue: detectedPm,
        }),
    },
    { onCancel: cancel }
  );

  const start = (answers.start as StartMode) ?? 'own';
  const describe = typeof answers.describe === 'string' && answers.describe.trim() ? answers.describe.trim() : undefined;
  const site: SiteOptions = {
    start,
    ...(answers.name ? { name: String(answers.name).trim() } : {}),
    ...(describe ? { describe } : {}),
  };

  return {
    projectName: toValidProjectName(answers.projectName || defaults.projectName || 'my-velocity-site'),
    site,
    demo: start === 'demo',
    componentSelection: defaults.componentSelection ?? { mode: 'all' },
    i18n: answers.i18n as boolean,
    pages: defaults.pageNames ?? [],
    pageLayout: 'page',
    packageManager: answers.packageManager as PackageManager,
  };
}

export function showIntro(): void {
  console.log();
  p.intro(pc.bgCyan(pc.black(' Create Velocity ')));
}

export interface OutroContext {
  site?: SiteOptions;
  /** The template ships the site brief (Velocity 2.5+) */
  siteSetup?: boolean;
  /** Dependencies were installed */
  installed?: boolean;
}

export function showOutro(projectName: string, packageManager: PackageManager, context: OutroContext = {}): void {
  const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;
  const { site, siteSetup } = context;
  const lines = [`cd ${projectName}`];
  if (context.installed === false) lines.push(getInstallCommand(packageManager));
  lines.push(`${runCmd} dev`);

  if (site?.start === 'own' && siteSetup) {
    lines.push('', `Then ask your AI agent: ${pc.cyan('"Set up this site"')}`, 'It reads .agents/site.md and finishes the brief with you.');
  } else if (site?.start === 'demo' && siteSetup) {
    lines.push('', `When you're ready, ask your AI agent: ${pc.cyan('"Replace the demo with my site"')}`);
  }

  p.note(lines.join('\n'), 'Next steps');
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
