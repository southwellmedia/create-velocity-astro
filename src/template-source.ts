/**
 * Where the Velocity template comes from: a GitHub ref (tag or branch) or a
 * local directory. Shared by scaffold and upgrade.
 */

import { cpSync, existsSync, statSync, unlinkSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { downloadTemplate } from 'giget';
import type { PackageManager } from './types.js';

export const TEMPLATE_REPO = 'github:southwellmedia/velocity';
export const GITHUB_REPO = 'southwellmedia/velocity';
export const DEFAULT_BRANCH = 'main';

/** Directory names never copied from a local --template directory. */
export const LOCAL_TEMPLATE_EXCLUDES = [
  'node_modules',
  'dist',
  '.git',
  '.astro',
  '.vercel',
  '.netlify',
  'test-results',
  'playwright-report',
];

export type TemplateSource =
  | { kind: 'github'; ref: string; resolvedFrom: 'flag' | 'latest-release' | 'fallback' }
  | { kind: 'local'; dir: string };

export interface TemplateSourceFlags {
  ref?: string;
  template?: string;
}

export interface ResolveSourceDeps {
  fetchLatestTag?: () => Promise<string | null>;
  notice?: (message: string) => void;
  cwd?: string;
}

/**
 * Fetches the tag name of the latest GitHub release of Velocity.
 * Returns null on any error or timeout.
 */
export async function fetchLatestReleaseTag(timeoutMs = 4000): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'create-velocity-astro',
    };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { tag_name?: unknown };
    return typeof data.tag_name === 'string' && data.tag_name ? data.tag_name : null;
  } catch {
    return null;
  }
}

/**
 * Resolves CLI flags into a template source. Default: latest GitHub release,
 * falling back to `main` with a notice.
 */
export async function resolveTemplateSource(
  flags: TemplateSourceFlags,
  deps: ResolveSourceDeps = {}
): Promise<TemplateSource> {
  const { fetchLatestTag = () => fetchLatestReleaseTag(), notice = () => {}, cwd = process.cwd() } = deps;

  if (flags.ref && flags.template) {
    throw new Error('Use either --ref or --template, not both.');
  }

  if (flags.template) {
    const dir = resolve(cwd, flags.template);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      throw new Error(`--template directory not found: ${dir}`);
    }
    return { kind: 'local', dir };
  }

  if (flags.ref) {
    return { kind: 'github', ref: flags.ref, resolvedFrom: 'flag' };
  }

  const tag = await fetchLatestTag();
  if (tag) {
    return { kind: 'github', ref: tag, resolvedFrom: 'latest-release' };
  }

  notice(
    `Could not determine the latest Velocity release; using the "${DEFAULT_BRANCH}" branch. ` +
      'Pass --ref <tag> to pin a version.'
  );
  return { kind: 'github', ref: DEFAULT_BRANCH, resolvedFrom: 'fallback' };
}

/** Human-readable label for messages. */
export function describeSource(source: TemplateSource): string {
  return source.kind === 'local' ? `local template ${source.dir}` : `${GITHUB_REPO}#${source.ref}`;
}

/** Value recorded in .velocity.json. */
export function sourceRecord(source: TemplateSource): { source: 'github'; ref: string } | { source: 'local'; path: string } {
  return source.kind === 'local' ? { source: 'local', path: source.dir } : { source: 'github', ref: source.ref };
}

/**
 * Copies a local template directory, skipping build output, dependencies and VCS data.
 */
export function copyLocalTemplate(srcDir: string, destDir: string): void {
  const root = resolve(srcDir);
  cpSync(root, destDir, {
    recursive: true,
    force: true,
    filter: (src) => {
      if (resolve(src) === root) return true;
      return !LOCAL_TEMPLATE_EXCLUDES.includes(basename(src));
    },
  });
}

/**
 * Downloads (or copies) the template into destDir.
 */
export async function fetchTemplate(source: TemplateSource, destDir: string): Promise<void> {
  if (source.kind === 'local') {
    copyLocalTemplate(source.dir, destDir);
    return;
  }
  await downloadTemplate(`${TEMPLATE_REPO}#${source.ref}`, {
    dir: destDir,
    force: true,
  });
}

/** Lockfiles each package manager writes. */
export const LOCKFILES: Record<PackageManager, string[]> = {
  pnpm: ['pnpm-lock.yaml'],
  npm: ['package-lock.json', 'npm-shrinkwrap.json'],
  yarn: ['yarn.lock'],
  bun: ['bun.lockb', 'bun.lock'],
};

/**
 * Returns lockfile names that do not belong to the chosen package manager.
 */
export function lockfilesToRemove(packageManager: PackageManager): string[] {
  return Object.entries(LOCKFILES)
    .filter(([pm]) => pm !== packageManager)
    .flatMap(([, files]) => files);
}

/**
 * Keeps the lockfile matching the chosen package manager (Velocity ships a
 * CI-tested pnpm-lock.yaml) and deletes the rest.
 */
export function applyLockfilePolicy(projectDir: string, packageManager: PackageManager): string[] {
  const removed: string[] = [];
  for (const file of lockfilesToRemove(packageManager)) {
    const full = resolve(projectDir, file);
    if (existsSync(full)) {
      unlinkSync(full);
      removed.push(file);
    }
  }
  return removed;
}
