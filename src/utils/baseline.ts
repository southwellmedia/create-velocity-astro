/**
 * `.velocity/baseline.json`: step 5 of Velocity's scaffold contract
 * (variants/README.md). It records the SHA-256 of every Velocity-owned file
 * (`files.safe`) as shipped, so the project's `check:agent` can warn when an
 * agent edits a file the next upgrade replaces.
 *
 * Mirrors `velocityOwnedFiles` and `writeBaseline` in Velocity's
 * scripts/check-agent.mjs byte for byte. It is reimplemented here rather than
 * run from the project, because older Velocity releases don't ship that script.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const BASELINE_PATH = '.velocity/baseline.json';

export const BASELINE_NOTE =
  'Written by check:agent. Rewrite after an upgrade with npm run check:agent -- --write-baseline.';

/** Folders check-agent.mjs never walks into. */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.astro',
  'dist',
  '.velocity-backup',
  'test-results',
  'playwright-report',
]);

export interface Baseline {
  note: string;
  files: Record<string, string>;
}

/** Project-relative, forward-slash paths of files under `rel`, skipping build and dependency folders. */
function walk(root: string, rel: string): string[] {
  const abs = join(root, rel);
  if (!existsSync(abs)) return [];
  if (statSync(abs).isFile()) return [rel];
  return readdirSync(abs, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) return [];
    const child = rel ? `${rel}/${entry.name}` : entry.name;
    return entry.isDirectory() ? walk(root, child) : [child];
  });
}

/** Files under the manifest's `files.safe` entries that exist in the project, sorted and de-duplicated. */
export function velocityOwnedFiles(root: string, safe: string[]): string[] {
  return [...new Set(safe.flatMap((entry) => walk(root, entry.replace(/\/$/, ''))))].sort();
}

/** Base64 SHA-256 of a file's bytes, as check-agent.mjs stores it. */
function sha256(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('base64');
}

export function computeBaseline(root: string, safe: string[]): Baseline {
  const files = Object.fromEntries(
    velocityOwnedFiles(root, safe).map((rel) => [rel, sha256(join(root, rel))])
  );
  return { note: BASELINE_NOTE, files };
}

/**
 * Writes `.velocity/baseline.json` unless the manifest opts out with
 * `scaffold.baseline: false`. Returns the number of files recorded, or null
 * when nothing was written.
 */
export function writeBaseline(
  root: string,
  manifest: { files?: { safe?: string[] }; scaffold?: { baseline?: unknown } } | null | undefined
): number | null {
  if (!manifest || manifest.scaffold?.baseline === false) return null;
  const baseline = computeBaseline(root, manifest.files?.safe ?? []);
  const target = join(root, BASELINE_PATH);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(baseline, null, 2) + '\n');
  return Object.keys(baseline.files).length;
}
