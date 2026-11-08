/**
 * "What are you starting?" — the site a project is for, seeded for an agent to finish.
 *
 * Velocity 2.5+ templates ship a brief template (.agents/skills/velocity-start-site/
 * brief-template.md). The CLI fills it with only what the user typed and sets the site name.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import type { TemplateSource } from '../template-source.js';

export type StartMode = 'own' | 'demo' | 'blank';

export const START_MODES: StartMode[] = ['own', 'demo', 'blank'];

export interface SiteOptions {
  start: StartMode;
  /** Site name for site.config.ts and the brief */
  name?: string;
  /** One sentence: what the site is for */
  describe?: string;
}

export const BRIEF_TEMPLATE = '.agents/skills/velocity-start-site/brief-template.md';
export const BRIEF_FILE = '.agents/site.md';
export const SITE_MIN_VERSION = '2.5.0-0';

const RAW_BASE = 'https://raw.githubusercontent.com/southwellmedia/velocity';

/** Whether a template version ships the site brief (Velocity 2.5 and later, prereleases included). */
export function supportsSiteSetup(version: string | undefined | null): boolean {
  if (!version) return false;
  const parsed = semver.valid(version) ?? semver.valid(semver.coerce(version));
  return Boolean(parsed && semver.gte(parsed, SITE_MIN_VERSION));
}

/** The template's manifest version, read before the template is downloaded so prompts can match it. */
export async function fetchTemplateVersion(source: TemplateSource): Promise<string | null> {
  try {
    if (source.kind === 'local') {
      const file = join(source.dir, 'velocity-manifest.json');
      return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf-8')) as { version?: string }).version ?? null : null;
    }
    const response = await fetch(`${RAW_BASE}/${encodeURIComponent(source.ref)}/velocity-manifest.json`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    return ((await response.json()) as { version?: string }).version ?? null;
  } catch {
    return null;
  }
}

/** 'rosas-bakery' → 'Rosas Bakery' */
export function titleCase(projectName: string): string {
  return projectName
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Validate the site flags. Returns the options, an error naming a bad flag, and any flags
 * that are no longer used (--direction and --brand, from CLI 2.2). `--demo` is an alias for
 * `--start demo`.
 */
export function parseSiteFlags(
  flags: { start?: unknown; demo?: unknown; name?: unknown; describe?: unknown; direction?: unknown; brand?: unknown },
): { options: Partial<SiteOptions>; error?: string; ignored: string[] } {
  const options: Partial<SiteOptions> = {};
  const ignored = (['direction', 'brand'] as const).filter((k) => flags[k] !== undefined).map((k) => `--${k}`);
  if (typeof flags.start === 'string') {
    if (!START_MODES.includes(flags.start as StartMode)) {
      return { options, ignored, error: `--start must be one of ${START_MODES.join(', ')}, got "${flags.start}".` };
    }
    options.start = flags.start as StartMode;
  } else if (flags.demo === true) {
    options.start = 'demo';
  }
  if (typeof flags.name === 'string' && flags.name.trim()) options.name = flags.name.trim();
  if (typeof flags.describe === 'string' && flags.describe.trim()) options.describe = flags.describe.trim();
  return { options, ignored };
}

/** Insert `content` after a `## Heading` and its HTML comment, if any. */
function fillSection(brief: string, heading: string, content: string): string {
  const re = new RegExp(`(^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n(?:<!--[\\s\\S]*?-->\\n)?)`, 'm');
  return re.test(brief) ? brief.replace(re, `$1\n${content}\n`) : brief;
}

export interface BriefInput extends SiteOptions {
  locales: string[];
  pages: string[];
}

/**
 * Fill Velocity's brief template with only what the user typed. Nothing is inferred:
 * headings without an answer keep their guidance comment for the agent.
 */
export function buildBrief(template: string, input: BriefInput): string {
  let brief = template.replace(/^Status: .*$/m, 'Status: seeded by CLI');
  if (input.describe) brief = fillSection(brief, 'Business', input.describe);
  if (input.name) brief = fillSection(brief, 'Brand', `- Site name: ${input.name}`);
  brief = fillSection(brief, 'Languages', input.locales.map((l, i) => `- ${l}${i === 0 ? ' (default)' : ''}`).join('\n'));
  if (input.pages.length) {
    brief = fillSection(brief, 'Sitemap', ['- Home → planned', ...input.pages.map((p) => `- ${p} → planned`)].join('\n'));
  }
  brief = fillSection(brief, 'Decisions log', `- ${new Date().toISOString().slice(0, 10)}: project created with create-velocity-astro.`);
  return brief;
}

/** site.config.ts with the site name set (the scaffold ships `name: 'My Site'`). */
export function setSiteName(config: string, name: string): string {
  return config.replace(/(\bname:\s*)(['"`])My Site\2/, `$1${JSON.stringify(name)}`);
}

/** Write the brief and the site name into a scaffolded project. Returns false when the template has no brief template. */
export function seedSite(projectDir: string, input: BriefInput): boolean {
  const templatePath = join(projectDir, BRIEF_TEMPLATE);
  if (!existsSync(templatePath)) return false;
  writeFileSync(join(projectDir, BRIEF_FILE), buildBrief(readFileSync(templatePath, 'utf-8'), input));
  const configPath = join(projectDir, 'src/config/site.config.ts');
  if (input.name && existsSync(configPath)) {
    writeFileSync(configPath, setSiteName(readFileSync(configPath, 'utf-8'), input.name));
  }
  const readme = join(projectDir, 'README.md');
  if (input.name && existsSync(readme)) {
    writeFileSync(readme, readFileSync(readme, 'utf-8').replace(/^# My Site$/m, `# ${input.name}`));
  }
  return true;
}
