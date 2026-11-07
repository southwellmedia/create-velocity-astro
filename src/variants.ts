/**
 * Variant engine.
 *
 * Implements the `scaffold` section of Velocity's `velocity-manifest.json`
 * (see variants/README.md in the Velocity repo). The CLI ships no template
 * files: Velocity declares every variant, and this module applies them.
 *
 * Used by both `scaffold` (on the fresh download before it is copied into the
 * project) and `upgrade` (on the fresh download before diffing, with the
 * options recorded in the project's .velocity.json).
 */

import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, normalize, relative, resolve } from 'node:path';
import semver from 'semver';
import type { ComponentRegistry, ComponentSelection } from './registry/types.js';
import { resolveDependencies } from './registry/resolver.js';
import { copyDirectory, readJson } from './utils/fs.js';

export const MANIFEST_FILENAME = 'velocity-manifest.json';
export const REGISTRY_FILENAME = 'component-registry.json';

export interface ScaffoldVariant {
  id?: string;
  when?: Record<string, unknown>;
  overlay?: string;
  remove?: string[];
  /** Registry ids added to components.alwaysInclude when this variant applies ("*" = keep all) */
  alwaysInclude?: string[];
}

export interface ScaffoldSection {
  schemaVersion?: number;
  minCliVersion?: string;
  node?: string;
  variants?: ScaffoldVariant[];
  components?: {
    optionalDirs?: string[];
    alwaysInclude?: string[];
  };
  cleanup?: string[];
  /** npm script names removed from the project's package.json after cleanup */
  cleanupScripts?: string[];
  /** `false` skips writing .velocity/baseline.json (contract step 5); anything else writes it */
  baseline?: boolean;
}

/** Scaffold options that variant `when` clauses may match against. */
export interface VariantOptions {
  demo: boolean;
  i18n: boolean;
}

const KNOWN_WHEN_KEYS: ReadonlyArray<keyof VariantOptions> = ['demo', 'i18n'];

export class ScaffoldGateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScaffoldGateError';
  }
}

/**
 * Reads velocity-manifest.json from a template directory. Returns null if missing.
 */
export function readManifest<T = Record<string, unknown>>(templateDir: string): T | null {
  const manifestPath = join(templateDir, MANIFEST_FILENAME);
  if (!existsSync(manifestPath)) return null;
  return readJson<T>(manifestPath);
}

/**
 * Reads component-registry.json from a template directory. Returns null if missing
 * or unreadable.
 */
export function readLocalRegistry(templateDir: string): ComponentRegistry | null {
  const registryPath = join(templateDir, REGISTRY_FILENAME);
  if (!existsSync(registryPath)) return null;
  try {
    return readJson<ComponentRegistry>(registryPath);
  } catch {
    return null;
  }
}

/**
 * Returns the manifest's `scaffold` section, or throws if the template predates
 * the variant contract (Velocity < 2.0).
 */
export function getScaffoldSection(manifest: unknown, refLabel?: string): ScaffoldSection {
  const scaffold =
    manifest && typeof manifest === 'object'
      ? (manifest as { scaffold?: unknown }).scaffold
      : undefined;

  if (!scaffold || typeof scaffold !== 'object' || Array.isArray(scaffold)) {
    const where = refLabel ? ` (${refLabel})` : '';
    throw new ScaffoldGateError(
      `The downloaded Velocity template${where} has no "scaffold" section in velocity-manifest.json.\n` +
        'This version of create-velocity-astro requires Velocity >= 2.0.\n' +
        'Pick a Velocity 2.x release with --ref <tag> (for example --ref v2.0.0), ' +
        'or use create-velocity-astro@1 for older Velocity versions.'
    );
  }

  return scaffold as ScaffoldSection;
}

/**
 * Throws if the template requires a newer CLI than this one.
 */
export function assertCliVersion(scaffold: ScaffoldSection, cliVersion: string): void {
  const required = scaffold.minCliVersion;
  if (!required) return;

  const min = semver.valid(semver.coerce(required));
  const current = semver.valid(semver.coerce(cliVersion));
  if (!min || !current) return;

  if (semver.gt(min, current)) {
    throw new ScaffoldGateError(
      `This Velocity template requires create-velocity-astro >= ${required} (you have ${cliVersion}).\n` +
        'Run `npm create velocity-astro@latest` to use the latest CLI.'
    );
  }
}

export interface NodeCheckResult {
  ok: boolean;
  required?: string;
  current: string;
}

/**
 * Checks the running Node version against `scaffold.node`. A missing or
 * invalid range is treated as satisfied.
 */
export function checkNodeVersion(
  scaffold: ScaffoldSection,
  nodeVersion: string = process.version
): NodeCheckResult {
  const range = scaffold.node;
  if (!range || !semver.validRange(range)) {
    return { ok: true, current: nodeVersion };
  }
  const ok = semver.satisfies(nodeVersion, range, { includePrerelease: true });
  return { ok, required: range, current: nodeVersion };
}

/**
 * A variant applies when every key in `when` equals the option of the same name.
 * Keys the CLI does not recognise make the variant not apply. A missing or
 * empty `when` always applies.
 */
export function variantMatches(variant: ScaffoldVariant, options: VariantOptions): boolean {
  const when = variant.when;
  if (when === undefined || when === null) return true;
  if (typeof when !== 'object' || Array.isArray(when)) return false;

  for (const [key, expected] of Object.entries(when)) {
    if (!(KNOWN_WHEN_KEYS as readonly string[]).includes(key)) return false;
    if (options[key as keyof VariantOptions] !== expected) return false;
  }
  return true;
}

/**
 * Resolves a manifest-provided relative path inside `rootDir`. Throws if the
 * path is absolute or escapes the root.
 */
function resolveInside(rootDir: string, relPath: string): string {
  if (typeof relPath !== 'string' || relPath.trim() === '' || isAbsolute(relPath)) {
    throw new Error(`Invalid path in velocity-manifest.json scaffold section: ${JSON.stringify(relPath)}`);
  }
  const root = resolve(rootDir);
  const full = resolve(root, normalize(relPath));
  const rel = relative(root, full);
  if (rel === '' || rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Path escapes the project root in velocity-manifest.json: ${relPath}`);
  }
  return full;
}

/**
 * Deletes project-relative paths (files or directories). Missing paths are ignored.
 */
export function removePaths(rootDir: string, paths: string[] | undefined): void {
  for (const relPath of paths ?? []) {
    const full = resolveInside(rootDir, relPath);
    if (existsSync(full)) {
      rmSync(full, { recursive: true, force: true });
    }
  }
}

/**
 * Applies variants in manifest order. Returns the ids (or indexes) of applied variants.
 */
export function applyVariants(
  rootDir: string,
  scaffold: ScaffoldSection,
  options: VariantOptions
): string[] {
  const applied: string[] = [];
  const variants = Array.isArray(scaffold.variants) ? scaffold.variants : [];

  variants.forEach((variant, index) => {
    if (!variant || typeof variant !== 'object') return;
    if (!variantMatches(variant, options)) return;

    if (variant.overlay) {
      const overlayDir = resolveInside(rootDir, variant.overlay);
      if (!existsSync(overlayDir) || !statSync(overlayDir).isDirectory()) {
        throw new Error(
          `Variant "${variant.id ?? index}" overlay directory not found: ${variant.overlay}`
        );
      }
      copyDirectory(overlayDir, rootDir, true);
    }

    removePaths(rootDir, variant.remove);
    applied.push(variant.id ?? String(index));
  });

  return applied;
}

/** Wildcard id in alwaysInclude: keep every component (skip pruning). */
export const KEEP_ALL_COMPONENTS = '*';

/**
 * Returns `components.alwaysInclude` plus the `alwaysInclude` ids of every
 * variant that applies for these options, in manifest order.
 */
export function collectAlwaysInclude(scaffold: ScaffoldSection, options: VariantOptions): string[] {
  const ids = [...(scaffold.components?.alwaysInclude ?? [])];
  const variants = Array.isArray(scaffold.variants) ? scaffold.variants : [];
  for (const variant of variants) {
    if (!variant || typeof variant !== 'object' || !variantMatches(variant, options)) continue;
    if (Array.isArray(variant.alwaysInclude)) ids.push(...variant.alwaysInclude);
  }
  return ids;
}

/** Recursively lists files under absDir as forward-slash paths prefixed with relBase. */
function walkFilesRelative(absDir: string, relBase: string): string[] {
  const results: string[] = [];
  if (!existsSync(absDir)) return results;

  for (const entry of readdirSync(absDir, { withFileTypes: true })) {
    const absPath = join(absDir, entry.name);
    const relPath = `${relBase}/${entry.name}`;
    if (entry.isDirectory()) {
      results.push(...walkFilesRelative(absPath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Removes empty subdirectories of `dir` bottom-up. `dir` itself is kept, even
 * when empty (matches Velocity's reference implementation).
 */
function removeEmptySubdirs(dir: string): void {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const child = join(dir, entry.name);
    removeEmptySubdirs(child);
    if (readdirSync(child).length === 0) rmSync(child, { recursive: true, force: true });
  }
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

/**
 * Computes the set of files to keep for a component selection: the selection's
 * resolved files plus `alwaysInclude` ids and their transitive registry
 * dependencies. Returns null when every file should be kept.
 */
export function resolveFilesToKeep(
  scaffold: ScaffoldSection,
  selection: ComponentSelection,
  registry: ComponentRegistry | null
): Set<string> | null {
  const alwaysInclude = scaffold.components?.alwaysInclude ?? [];
  if (selection.mode === 'all' || alwaysInclude.includes(KEEP_ALL_COMPONENTS)) return null;

  const keep = new Set<string>();

  if (!registry) {
    // Without a registry we can only honour "none" when nothing must be kept.
    if (selection.mode === 'none' && alwaysInclude.length === 0) return keep;
    return null;
  }

  if (selection.mode !== 'none') {
    for (const file of resolveDependencies(selection, registry).files) keep.add(toPosix(file));
  }
  if (alwaysInclude.length > 0) {
    const always = resolveDependencies({ mode: 'individual', components: alwaysInclude }, registry);
    for (const file of always.files) keep.add(toPosix(file));
  }
  return keep;
}

export interface ComponentSelectionResult {
  /** False when pruning was skipped (mode "all", alwaysInclude "*", or no registry available). */
  pruned: boolean;
  removed: string[];
}

/**
 * Prunes component files. Only files under `components.optionalDirs` are ever
 * deleted; registry files elsewhere (e.g. src/actions/index.ts) are untouched.
 */
export function applyComponentSelection(
  rootDir: string,
  scaffold: ScaffoldSection,
  selection: ComponentSelection,
  registry: ComponentRegistry | null
): ComponentSelectionResult {
  const keep = resolveFilesToKeep(scaffold, selection, registry);
  if (keep === null) return { pruned: false, removed: [] };

  const removed: string[] = [];
  for (const dir of scaffold.components?.optionalDirs ?? []) {
    const relDir = toPosix(dir);
    const absDir = resolveInside(rootDir, relDir);
    if (!existsSync(absDir)) continue;

    for (const relFile of walkFilesRelative(absDir, relDir)) {
      if (!keep.has(relFile)) {
        rmSync(join(rootDir, ...relFile.split('/')), { force: true });
        removed.push(relFile);
      }
    }
    removeEmptySubdirs(absDir);
  }

  return { pruned: true, removed };
}

/**
 * Deletes the named npm scripts from package.json (names not present are
 * ignored). Like Velocity's reference implementation, package.json is
 * rewritten whenever the list is non-empty. Returns the names removed.
 */
export function removePackageScripts(rootDir: string, names: string[] | undefined): string[] {
  if (!Array.isArray(names) || names.length === 0) return [];
  const pkgPath = join(rootDir, 'package.json');
  if (!existsSync(pkgPath)) return [];

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> };
  const removed: string[] = [];
  for (const name of names) {
    if (pkg.scripts && Object.prototype.hasOwnProperty.call(pkg.scripts, name)) {
      delete pkg.scripts[name];
      removed.push(name);
    }
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  return removed;
}

export interface PipelineInput {
  options: VariantOptions;
  componentSelection: ComponentSelection;
  /** Registry to resolve components against; defaults to the template's own registry. */
  registry?: ComponentRegistry | null;
}

export interface PipelineResult {
  appliedVariants: string[];
  components: ComponentSelectionResult;
}

/**
 * Runs the full scaffold pipeline on a downloaded template directory:
 * variants (in order) → component selection → cleanup → cleanupScripts. Applied variants'
 * `alwaysInclude` ids are added to `components.alwaysInclude`.
 */
export function runVariantPipeline(
  rootDir: string,
  scaffold: ScaffoldSection,
  input: PipelineInput
): PipelineResult {
  const registry = input.registry === undefined ? readLocalRegistry(rootDir) : input.registry;

  const appliedVariants = applyVariants(rootDir, scaffold, input.options);
  const effective: ScaffoldSection = {
    ...scaffold,
    components: {
      ...scaffold.components,
      alwaysInclude: collectAlwaysInclude(scaffold, input.options),
    },
  };
  const components = applyComponentSelection(rootDir, effective, input.componentSelection, registry);
  removePaths(rootDir, scaffold.cleanup);
  removePackageScripts(rootDir, scaffold.cleanupScripts);

  return { appliedVariants, components };
}

/**
 * Parses the `features.components` string stored in .velocity.json back into a
 * ComponentSelection ("all", "none", "categories:a,b", "individual:x,y").
 */
export function parseStoredComponentSelection(value: string | undefined): ComponentSelection {
  if (!value || value === 'all') return { mode: 'all' };
  if (value === 'none') return { mode: 'none' };

  const [mode, list = ''] = value.split(':', 2);
  const items = list.split(',').map((s) => s.trim()).filter(Boolean);
  if (mode === 'categories') return { mode: 'categories', categories: items };
  if (mode === 'individual') return { mode: 'individual', components: items };
  return { mode: 'all' };
}


export interface GateInput {
  cliVersion: string;
  nodeVersion?: string;
  /** "scaffold" warns on an unmet Node range; "upgrade" throws. */
  mode: 'scaffold' | 'upgrade';
  /** Shown in error messages, e.g. "southwellmedia/velocity#v2.0.0" */
  sourceLabel?: string;
}

export interface GateResult {
  scaffold: ScaffoldSection;
  /** Set when the Node range is unmet in scaffold mode */
  nodeWarning?: string;
}

/**
 * Runs every version gate against a downloaded manifest (null if the template
 * has no velocity-manifest.json). Throws ScaffoldGateError on a hard failure.
 */
export function checkGates(manifest: unknown, input: GateInput): GateResult {
  const scaffold = getScaffoldSection(manifest, input.sourceLabel);
  assertCliVersion(scaffold, input.cliVersion);

  const node = checkNodeVersion(scaffold, input.nodeVersion ?? process.version);
  if (!node.ok) {
    const message =
      `Velocity requires Node.js ${node.required}, but you are running ${node.current}.`;
    if (input.mode === 'upgrade') {
      throw new ScaffoldGateError(`${message}\nUpgrade Node.js before upgrading this project.`);
    }
    return {
      scaffold,
      nodeWarning: `${message} The project will be created, but install/build may fail until you upgrade Node.js.`,
    };
  }

  return { scaffold };
}
