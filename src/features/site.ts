/**
 * "What are you starting?" — the site a project is for, seeded for an agent to finish.
 *
 * Velocity 2.5 templates ship a brief template (.agents/skills/velocity-start-site/
 * brief-template.md) and a design engine (scripts/design.mjs). The CLI fills the brief
 * with only what the user typed, sets the site name, and applies a design direction by
 * running the project's own `design` script, so it holds no design logic of its own.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import semver from 'semver';
import type { TemplateSource } from '../template-source.js';

export type StartMode = 'own' | 'demo' | 'blank';

export const START_MODES: StartMode[] = ['own', 'demo', 'blank'];

/** The design directions Velocity 2.5 ships, for prompt labels. The template's own files are the source of truth. */
export const DIRECTIONS = [
  { id: 'editorial', label: 'Editorial', hint: 'Calm, type-led: agencies, consultants, writers' },
  { id: 'warm-local', label: 'Warm local', hint: 'Friendly, rounded: trades, cafés, salons, bakeries' },
  { id: 'clinical', label: 'Clinical', hint: 'Clear, trustworthy: clinics, legal, finance' },
  { id: 'bold-product', label: 'Bold product', hint: 'Confident, high contrast: SaaS, apps, launches' },
  { id: 'minimal-portfolio', label: 'Minimal portfolio', hint: 'Quiet, image-led: designers, photographers' },
] as const;

export type DirectionId = (typeof DIRECTIONS)[number]['id'];
/** 'auto' leaves the choice to the agent. */
export type DirectionChoice = DirectionId | 'auto';

export interface SiteOptions {
  start: StartMode;
  /** Site name for site.config.ts and the brief */
  name?: string;
  /** One sentence: what the site is for */
  describe?: string;
  direction?: DirectionChoice;
  /** Brand colour as #rrggbb */
  brand?: string;
}

export const BRIEF_TEMPLATE = '.agents/skills/velocity-start-site/brief-template.md';
export const BRIEF_FILE = '.agents/site.md';
export const DIRECTIONS_DIR = '.agents/design/directions';
export const DESIGN_SCRIPT = 'scripts/design.mjs';
export const DESIGN_MIN_VERSION = '2.5.0-0';

const RAW_BASE = 'https://raw.githubusercontent.com/southwellmedia/velocity';

/** Whether a template version supports the brief and design directions (Velocity 2.5 and later, prereleases included). */
export function supportsSiteSetup(version: string | undefined | null): boolean {
  if (!version) return false;
  const parsed = semver.valid(version) ?? semver.valid(semver.coerce(version));
  return Boolean(parsed && semver.gte(parsed, DESIGN_MIN_VERSION));
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

export function isDirection(value: string): value is DirectionChoice {
  return value === 'auto' || DIRECTIONS.some((d) => d.id === value);
}

/** '#c2410c', 'c2410c' or '#c41' → '#c2410c'; undefined when it isn't a hex colour. */
export function normalizeHex(value: string | undefined): string | undefined {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((value ?? '').trim());
  if (!m) return undefined;
  const hex = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join('') : m[1]!;
  return `#${hex.toLowerCase()}`;
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
 * Validate the site flags. Returns the options, or an error message naming the bad flag.
 * `--demo` is an alias for `--start demo`.
 */
export function parseSiteFlags(
  flags: { start?: unknown; demo?: unknown; name?: unknown; describe?: unknown; direction?: unknown; brand?: unknown },
): { options: Partial<SiteOptions>; error?: string } {
  const options: Partial<SiteOptions> = {};
  if (typeof flags.start === 'string') {
    if (!START_MODES.includes(flags.start as StartMode)) {
      return { options, error: `--start must be one of ${START_MODES.join(', ')}, got "${flags.start}".` };
    }
    options.start = flags.start as StartMode;
  } else if (flags.demo === true) {
    options.start = 'demo';
  }
  if (typeof flags.name === 'string' && flags.name.trim()) options.name = flags.name.trim();
  if (typeof flags.describe === 'string' && flags.describe.trim()) options.describe = flags.describe.trim();
  if (typeof flags.direction === 'string') {
    if (!isDirection(flags.direction)) {
      return { options, error: `--direction must be one of ${DIRECTIONS.map((d) => d.id).join(', ')} or auto, got "${flags.direction}".` };
    }
    options.direction = flags.direction;
  }
  if (typeof flags.brand === 'string') {
    const hex = normalizeHex(flags.brand);
    if (!hex) return { options, error: `--brand must be a hex colour such as "#c2410c", got "${flags.brand}".` };
    options.brand = hex;
  }
  return { options };
}

/** Insert `content` after a `## Heading` and its HTML comment, if any. */
function fillSection(brief: string, heading: string, content: string): string {
  const re = new RegExp(`(^## ${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n(?:<!--[\\s\\S]*?-->\\n)?)`, 'm');
  return re.test(brief) ? brief.replace(re, `$1\n${content}\n`) : brief;
}

/** Set a "- Label:" line inside the Design section only. */
function setDesignLine(brief: string, label: string, value: string): string {
  const start = brief.indexOf('\n## Design\n');
  if (start < 0) return brief;
  const next = brief.indexOf('\n## ', start + 1);
  const end = next < 0 ? brief.length : next;
  const section = brief.slice(start, end).replace(new RegExp(`^- ${label}:.*$`, 'm'), `- ${label}: ${value}`);
  return brief.slice(0, start) + section + brief.slice(end);
}

export interface BriefInput extends SiteOptions {
  locales: string[];
  pages: string[];
  /** Fonts the direction uses, when it was applied */
  fonts?: string[];
  /** The direction was recorded but not applied (for example with --no-install) */
  pendingCommand?: string;
}

/**
 * Fill Velocity's brief template with only what the user typed. Nothing is inferred:
 * headings without an answer keep their guidance comment for the agent.
 */
export function buildBrief(template: string, input: BriefInput): string {
  let brief = template.replace(/^Status: .*$/m, 'Status: seeded by CLI');
  if (input.describe) brief = fillSection(brief, 'Business', input.describe);
  const brand = [input.name && `- Site name: ${input.name}`, input.brand && `- Brand colour: ${input.brand}`].filter(Boolean).join('\n');
  if (brand) brief = fillSection(brief, 'Brand', brand);
  const direction = input.direction && input.direction !== 'auto' ? input.direction : undefined;
  brief = setDesignLine(brief, 'Direction', direction ?? 'agent to choose');
  if (direction) brief = setDesignLine(brief, 'Why', 'chosen by the user when creating the project');
  if (input.brand) brief = setDesignLine(brief, 'Brand colour', input.brand);
  if (input.fonts?.length) brief = setDesignLine(brief, 'Fonts', input.fonts.join(' + '));
  brief = fillSection(brief, 'Languages', input.locales.map((l, i) => `- ${l}${i === 0 ? ' (default)' : ''}`).join('\n'));
  if (input.pages.length) {
    brief = fillSection(brief, 'Sitemap', ['- Home → (sections to plan) → planned', ...input.pages.map((p) => `- ${p} → (sections to plan) → planned`)].join('\n'));
  }
  const log = [`- ${new Date().toISOString().slice(0, 10)}: project created with create-velocity-astro${direction ? `; direction ${direction}` : ''}.`];
  if (input.pendingCommand) log.push(`- Direction not applied yet: run \`${input.pendingCommand}\`.`);
  brief = fillSection(brief, 'Decisions log', log.join('\n'));
  return brief;
}

/** site.config.ts with the site name set (the scaffold ships `name: 'My Site'`). */
export function setSiteName(config: string, name: string): string {
  return config.replace(/(\bname:\s*)(['"`])My Site\2/, `$1${JSON.stringify(name)}`);
}

/** Font packages a direction needs, from its JSON in the template (slug rule matches scripts/design.mjs). */
export function directionFontPackages(projectDir: string, direction: DirectionId): { families: string[]; packages: string[] } {
  const file = join(projectDir, DIRECTIONS_DIR, `${direction}.json`);
  if (!existsSync(file)) return { families: [], packages: [] };
  const spec = JSON.parse(readFileSync(file, 'utf-8')) as { fonts?: Record<string, { family?: string }> };
  const families = [...new Set([spec.fonts?.body?.family, spec.fonts?.display?.family].filter((f): f is string => Boolean(f)))];
  const packages = families.map((f) => `@fontsource-variable/${f.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`);
  return { families, packages };
}

/** Write the brief and the site name into a scaffolded project. Returns false when the template predates 2.5. */
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
