import type { UpgradeManifest } from '../types.js';

type DependencySection = 'dependencies' | 'devDependencies' | 'optionalDependencies' | 'peerDependencies';
const DEPENDENCY_SECTIONS: DependencySection[] = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

export type PackageJson = Partial<Record<DependencySection, Record<string, string>>> & Record<string, unknown>;

/**
 * Returns true if the manifest declares any dependency change.
 */
export function hasDependencyChanges(deps: Partial<UpgradeManifest['dependencies']>): boolean {
  return (
    Object.keys(deps.update ?? {}).length > 0 ||
    (deps.remove ?? []).length > 0 ||
    Object.keys(deps.add ?? {}).length > 0 ||
    Object.keys(deps.addDev ?? {}).length > 0
  );
}

/**
 * Applies manifest dependency changes to a parsed package.json (mutates and returns it).
 *
 * - `update`: bumps a package in every section it currently lives in; packages
 *   the project does not have are left alone.
 * - `remove`: deletes from dependencies and devDependencies.
 * - `add`: sets in dependencies.
 * - `addDev`: sets in devDependencies (moving it out of dependencies if present).
 */
export function applyDependencyChanges(
  pkg: PackageJson,
  deps: Partial<UpgradeManifest['dependencies']>
): PackageJson {
  for (const [name, version] of Object.entries(deps.update ?? {})) {
    for (const section of DEPENDENCY_SECTIONS) {
      const entries = pkg[section];
      if (entries && entries[name] !== undefined) {
        entries[name] = version;
      }
    }
  }

  for (const name of deps.remove ?? []) {
    if (pkg.dependencies?.[name] !== undefined) delete pkg.dependencies[name];
    if (pkg.devDependencies?.[name] !== undefined) delete pkg.devDependencies[name];
  }

  for (const [name, version] of Object.entries(deps.add ?? {})) {
    if (!pkg.dependencies) pkg.dependencies = {};
    pkg.dependencies[name] = version;
  }

  for (const [name, version] of Object.entries(deps.addDev ?? {})) {
    if (!pkg.devDependencies) pkg.devDependencies = {};
    pkg.devDependencies[name] = version;
    if (pkg.dependencies?.[name] !== undefined) delete pkg.dependencies[name];
  }

  return pkg;
}

/**
 * Applies the manifest's package.json changes (mutates and returns it).
 * Scripts a project customized are kept.
 */
export function applyPackageJsonChanges(
  pkg: PackageJson,
  changes: UpgradeManifest['packageJson'] = {}
): PackageJson {
  if (changes.engines) {
    pkg.engines = { ...(pkg.engines as Record<string, string> | undefined), ...changes.engines };
  }

  const scripts = { ...(pkg.scripts as Record<string, string> | undefined) };
  for (const [name, { value, replaces }] of Object.entries(changes.scripts ?? {})) {
    if (scripts[name] === undefined || scripts[name] === replaces) scripts[name] = value;
  }
  if (Object.keys(scripts).length > 0) pkg.scripts = scripts;

  return pkg;
}
