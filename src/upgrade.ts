import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { UpgradeOptions, UpgradeManifest, MigrationStep } from './types.js';
import { readVelocityConfig, writeVelocityConfig } from './utils/velocity-config.js';
import { diffProjects, diffStructural, summarizeDiffs, computeFileHashes } from './utils/diff.js';
import { applyDependencyChanges, applyPackageJsonChanges, hasDependencyChanges } from './utils/dependencies.js';
import type { PackageJson } from './utils/dependencies.js';
import {
  showUpgradeIntro,
  showChangeSummary,
  confirmUpgrade,
  showManualSteps,
  showProtectedNotice,
  showConflictNotice,
  showUpgradeOutro,
  warnDirtyGit,
} from './upgrade-prompts.js';
import { describeSource, fetchTemplate, resolveTemplateSource, sourceRecord } from './template-source.js';
import type { TemplateSource } from './template-source.js';
import {
  checkGates,
  parseStoredComponentSelection,
  readManifest,
  runVariantPipeline,
  ScaffoldGateError,
} from './variants.js';

declare const CLI_VERSION: string;

/**
 * Checks if the project has uncommitted git changes.
 */
function hasUncommittedChanges(targetDir: string): boolean {
  try {
    const result = execSync('git status --porcelain', {
      cwd: targetDir,
      encoding: 'utf-8',
    });
    return result.trim().length > 0;
  } catch {
    // Not a git repo or git not available — skip the check
    return false;
  }
}

/**
 * Compares two semver-like version strings.
 * Returns true if `current` < `required`.
 */
function isVersionLessThan(current: string, required: string): boolean {
  const parse = (v: string) =>
    v.replace(/^v/, '').split(/[-.]/).map((p) => {
      const n = parseInt(p, 10);
      return isNaN(n) ? 0 : n;
    });

  const a = parse(current);
  const b = parse(required);
  const len = Math.max(a.length, b.length);

  for (let i = 0; i < len; i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false;
}

/**
 * Filters migrations to only those applicable for the user's version range.
 * A migration applies if:
 *   - No fromVersion/toVersion: always applies (legacy behavior)
 *   - If toVersion is set and user's current version is NOT less than toVersion, skip (user already past this migration)
 *   - If fromVersion is set and user's current version IS less than fromVersion, skip (user hasn't reached the version where this migration matters)
 *   - Otherwise, include it
 */
function filterMigrations(migrations: MigrationStep[], currentVersion: string): MigrationStep[] {
  return migrations.filter((m) => {
    // No version constraints — always show (legacy)
    if (!m.fromVersion && !m.toVersion) return true;

    // User already past this migration's target version
    if (m.toVersion && !isVersionLessThan(currentVersion, m.toVersion)) return false;

    // User hasn't reached the starting version for this migration
    if (m.fromVersion && isVersionLessThan(currentVersion, m.fromVersion)) return false;

    return true;
  });
}

/**
 * Scans user files for migration patterns and returns matches.
 */
function compilePattern(pattern: string): RegExp {
  try {
    return new RegExp(pattern);
  } catch {
    // A bad pattern in a manifest must not stop an upgrade: match it literally
    return new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  }
}

function scanForMigrationPatterns(
  targetDir: string,
  migrations: MigrationStep[]
): Map<string, string[]> {
  const results = new Map<string, string[]>();

  for (const migration of migrations) {
    if (!migration.pattern) {
      results.set(migration.title, []);
      continue;
    }

    const regex = compilePattern(migration.pattern);
    const matches: string[] = [];

    // Determine search paths
    const searchPaths = migration.searchPaths?.length
      ? migration.searchPaths
      : ['src/'];

    for (const searchPath of searchPaths) {
      const fullPath = join(targetDir, searchPath);
      if (!existsSync(fullPath)) continue;

      const files = walkFiles(fullPath);
      for (const file of files) {
        try {
          const content = readFileSync(file, 'utf-8');
          if (regex.test(content)) {
            matches.push(relative(targetDir, file));
          }
        } catch {
          // Skip unreadable files
        }
      }
    }

    results.set(migration.title, matches);
  }

  return results;
}

/**
 * Recursively walks a directory and returns all file paths.
 */
function walkFiles(dir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const stat = statSync(dir);
  if (!stat.isDirectory()) {
    return [dir];
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip node_modules and .git
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Merges dependency changes into the project's package.json.
 */
function mergePackageJsonDeps(
  targetDir: string,
  manifest: UpgradeManifest
): void {
  const pkgPath = join(targetDir, 'package.json');
  if (!existsSync(pkgPath)) return;

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as PackageJson;
  applyDependencyChanges(pkg, manifest.dependencies);
  applyPackageJsonChanges(pkg, manifest.packageJson);
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Backs up conflicting files to .velocity-backup/<version>/.
 * Returns the backup directory path.
 */
function backupConflicts(
  targetDir: string,
  conflicts: { path: string }[],
  fromVersion: string
): string {
  const backupDir = join(targetDir, '.velocity-backup', fromVersion);

  for (const conflict of conflicts) {
    const srcPath = join(targetDir, conflict.path);
    const destPath = join(backupDir, conflict.path);
    const destDir = dirname(destPath);

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
    }
  }

  return backupDir;
}

/**
 * Main upgrade orchestration function.
 */
export async function upgrade(options: UpgradeOptions): Promise<void> {
  const { targetDir, dryRun, yes } = options;

  // 1. Read .velocity.json
  const config = readVelocityConfig(targetDir);
  if (!config) {
    p.log.error(
      pc.red(
        "This doesn't appear to be a Velocity project.\n" +
        'Run this command from a project created with create-velocity-astro.'
      )
    );
    process.exit(1);
  }

  // Check for dirty git state
  if (hasUncommittedChanges(targetDir)) {
    const proceed = await warnDirtyGit(yes);
    if (!proceed) return;
  }

  // 2. Resolve the template source and fetch it into a temp dir
  let templateSource: TemplateSource;
  try {
    templateSource = await resolveTemplateSource(
      { ref: options.ref, template: options.template },
      { notice: (message) => p.log.warn(pc.yellow(message)) }
    );
  } catch (error) {
    p.log.error(pc.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
  const sourceLabel = describeSource(templateSource);

  const spinner = p.spinner();
  spinner.start(`Fetching template (${sourceLabel})...`);

  const tempDir = join(tmpdir(), `velocity-upgrade-${Date.now()}`);

  try {
    await fetchTemplate(templateSource, tempDir);
    spinner.stop(`Template fetched (${sourceLabel})`);
  } catch (error) {
    spinner.stop('Failed to fetch template');
    p.log.error(
      pc.red(
        `Could not fetch ${sourceLabel}. Check your internet connection and that the ref exists.\n` +
        (error instanceof Error ? error.message : '')
      )
    );
    cleanup(tempDir);
    process.exit(1);
  }

  // 3. Read velocity-manifest.json and run the version gates
  let manifest: UpgradeManifest;

  try {
    const rawManifest = readManifest<UpgradeManifest>(tempDir);
    const { scaffold: scaffoldSection } = checkGates(rawManifest, {
      cliVersion: CLI_VERSION,
      mode: 'upgrade',
      sourceLabel,
    });
    manifest = normalizeManifest(rawManifest!);

    // Legacy top-level CLI version requirement
    if (manifest.minCliVersion && isVersionLessThan(CLI_VERSION, manifest.minCliVersion)) {
      throw new ScaffoldGateError(
        `This upgrade requires create-velocity-astro >= ${manifest.minCliVersion}.\n` +
        'Run `npm create velocity-astro@latest upgrade` to use the latest CLI.'
      );
    }

    // 3b. Apply the variant pipeline the project was scaffolded with, so a
    // minimal or i18n project is compared against minimal / i18n files.
    runVariantPipeline(tempDir, scaffoldSection, {
      options: {
        demo: Boolean(config.features?.demo),
        i18n: Boolean(config.features?.i18n),
      },
      componentSelection: parseStoredComponentSelection(config.features?.components),
    });
  } catch (error) {
    p.log.error(pc.red(error instanceof Error ? error.message : String(error)));
    cleanup(tempDir);
    process.exit(1);
  }

  // Filter migrations to only those relevant to the user's current version
  manifest.migrations = filterMigrations(manifest.migrations, config.version).filter((migration) =>
    Object.entries(migration.when ?? {}).every(
      ([option, value]) => Boolean(config.features?.[option as keyof typeof config.features]) === value
    )
  );

  // Check if already on latest version
  if (config.version === manifest.version) {
    showUpgradeIntro(config.version, manifest.version);
    p.log.info(pc.green(`Already on v${manifest.version}. Nothing to upgrade.`));
    p.outro('');
    cleanup(tempDir);
    return;
  }

  // 4. Diff safe files, passing stored hashes for user-modification detection
  const safeDiffs = diffProjects(targetDir, tempDir, manifest, config.fileHashes);
  const diffs = [...safeDiffs, ...diffStructural(targetDir, tempDir, manifest, safeDiffs)];
  const { added, modified, conflict } = summarizeDiffs(diffs);

  // If no changes at all
  if (added === 0 && modified === 0 && conflict === 0 && !diffs.some((d) => d.status === 'removed') &&
      !hasDependencyChanges(manifest.dependencies)) {
    showUpgradeIntro(config.version, manifest.version);
    p.log.info(pc.green('All files are up to date. Updating version marker only.'));
    if (!dryRun) {
      writeVelocityConfig(targetDir, {
        ...config,
        version: manifest.version,
        updatedAt: new Date().toISOString().slice(0, 10),
        template: sourceRecord(templateSource),
      });
    }
    p.outro('');
    cleanup(tempDir);
    return;
  }

  // 5. Show summary and confirm
  showUpgradeIntro(config.version, manifest.version);
  showChangeSummary(diffs, manifest);

  const shouldProceed = await confirmUpgrade(dryRun, yes);

  if (dryRun) {
    // In dry-run mode, still show protected notice and manual migration steps
    showProtectedNotice(manifest);
    const matchResults = scanForMigrationPatterns(targetDir, manifest.migrations);
    showManualSteps(manifest.migrations, matchResults);
    p.outro(pc.dim('Dry run complete. No changes were made.'));
    cleanup(tempDir);
    return;
  }

  if (!shouldProceed) {
    cleanup(tempDir);
    return;
  }

  // 6. Apply changes
  spinner.start('Applying changes...');

  // 6a. Back up conflicting files before overwriting
  const conflictDiffs = diffs.filter((d) => d.status === 'conflict');
  const removedDiffs = diffs.filter((d) => d.status === 'removed');
  let backupDir = '';
  const backupDiffs = [...conflictDiffs, ...removedDiffs];
  if (backupDiffs.length > 0) {
    backupDir = backupConflicts(targetDir, backupDiffs, config.version);
  }

  // 6b. Copy modified, added, and conflicting safe files (conflicts get template version)
  const changedDiffs = diffs.filter(
    (d) => d.status === 'added' || d.status === 'modified' || d.status === 'conflict'
  );
  for (const diff of changedDiffs) {
    const src = join(tempDir, diff.path);
    const dest = join(targetDir, diff.path);
    const destDir = dirname(dest);

    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }

    copyFileSync(src, dest);
  }

  for (const diff of removedDiffs) {
    rmSync(join(targetDir, diff.path), { force: true });
  }

  // 6c. Merge package.json dependencies
  const hasDepChanges = hasDependencyChanges(manifest.dependencies) || Boolean(manifest.packageJson);

  if (hasDepChanges) {
    mergePackageJsonDeps(targetDir, manifest);
  }

  // 6d. Compute and store file hashes for the new state
  const newHashes = computeFileHashes(targetDir, manifest.files.safe);

  // 6e. Update .velocity.json with new version and file hashes
  writeVelocityConfig(targetDir, {
    ...config,
    version: manifest.version,
    updatedAt: new Date().toISOString().slice(0, 10),
    template: sourceRecord(templateSource),
    fileHashes: newHashes,
  });

  spinner.stop('Changes applied');

  // Report results
  if (modified > 0) {
    p.log.success(pc.green(`Updated ${modified} framework file${modified !== 1 ? 's' : ''}`));
  }
  if (added > 0) {
    p.log.success(pc.green(`Added ${added} new file${added !== 1 ? 's' : ''}`));
  }
  if (hasDepChanges) {
    p.log.success(pc.green('Updated package.json dependencies'));
  }
  p.log.success(pc.green('Updated .velocity.json'));

  // 7. Show conflict notice (before protected notice, as it's more urgent)
  if (backupDiffs.length > 0) {
    showConflictNotice(backupDir, backupDiffs);
  }

  // 8. Show protected file notice
  showProtectedNotice(manifest);

  // 9. Scan for migration patterns and show manual steps
  const matchResults = scanForMigrationPatterns(targetDir, manifest.migrations);
  showManualSteps(manifest.migrations, matchResults);

  // 10. Show outro
  showUpgradeOutro(hasDepChanges);

  cleanup(tempDir);
}

/**
 * Cleans up temporary directory.
 */
function cleanup(tempDir: string): void {
  try {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Fills in optional manifest fields so the rest of the upgrade can rely on them.
 */
function normalizeManifest(manifest: UpgradeManifest): UpgradeManifest {
  return {
    ...manifest,
    files: {
      safe: manifest.files?.safe ?? [],
      protected: manifest.files?.protected ?? [],
      seed: manifest.files?.seed ?? [],
    },
    dependencies: {
      update: manifest.dependencies?.update ?? {},
      remove: manifest.dependencies?.remove ?? [],
      add: manifest.dependencies?.add ?? {},
      addDev: manifest.dependencies?.addDev ?? {},
    },
    migrations: manifest.migrations ?? [],
  };
}
