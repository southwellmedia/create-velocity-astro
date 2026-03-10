import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, dirname, relative } from 'node:path';
import { tmpdir } from 'node:os';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import { downloadTemplate } from 'giget';
import type { UpgradeOptions, UpgradeManifest, MigrationStep } from './types.js';
import { readVelocityConfig, writeVelocityConfig } from './utils/velocity-config.js';
import { readJson } from './utils/fs.js';
import { diffProjects, summarizeDiffs, computeFileHashes } from './utils/diff.js';
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

declare const CLI_VERSION: string;

const TEMPLATE_REPO = 'github:southwellmedia/velocity';

// Hardcoded fallback safe list if manifest is missing from template
const FALLBACK_SAFE_FILES = [
  'src/components/ui/',
  'src/components/seo/',
  'src/components/layout/',
  'src/layouts/',
  'src/lib/',
  'src/styles/tokens/',
  'src/styles/themes/',
  'src/styles/global.css',
  'src/content.config.ts',
  'src/config/nav.config.ts',
  'tsconfig.json',
  'eslint.config.js',
  '.prettierrc',
  '.prettierignore',
  '.gitignore',
  'vercel.json',
  'netlify.toml',
  'wrangler.toml',
];

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

    const regex = new RegExp(migration.pattern);
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

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  // Update dependencies
  for (const [name, version] of Object.entries(manifest.dependencies.update)) {
    if (pkg.dependencies?.[name] !== undefined) {
      pkg.dependencies[name] = version;
    } else if (pkg.devDependencies?.[name] !== undefined) {
      pkg.devDependencies[name] = version;
    } else {
      // Default to dependencies
      if (!pkg.dependencies) pkg.dependencies = {};
      pkg.dependencies[name] = version;
    }
  }

  // Remove dependencies
  for (const name of manifest.dependencies.remove) {
    if (pkg.dependencies?.[name] !== undefined) {
      delete pkg.dependencies[name];
    }
    if (pkg.devDependencies?.[name] !== undefined) {
      delete pkg.devDependencies[name];
    }
  }

  // Add new dependencies
  for (const [name, version] of Object.entries(manifest.dependencies.add)) {
    if (!pkg.dependencies) pkg.dependencies = {};
    pkg.dependencies[name] = version;
  }

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

  // 2. Download latest template to temp dir
  const spinner = p.spinner();
  spinner.start('Downloading latest template...');

  const tempDir = join(tmpdir(), `velocity-upgrade-${Date.now()}`);

  try {
    await downloadTemplate(TEMPLATE_REPO, {
      dir: tempDir,
      force: true,
    });
    spinner.stop('Template downloaded');
  } catch (error) {
    spinner.stop('Failed to download template');
    p.log.error(
      pc.red(
        'Could not download template. Check your internet connection.\n' +
        (error instanceof Error ? error.message : '')
      )
    );
    cleanup(tempDir);
    process.exit(1);
  }

  // 3. Read velocity-manifest.json from fresh template
  let manifest: UpgradeManifest;
  const manifestPath = join(tempDir, 'velocity-manifest.json');

  if (existsSync(manifestPath)) {
    manifest = readJson<UpgradeManifest>(manifestPath);
  } else {
    // Fallback: use hardcoded safe list
    p.log.warn(pc.yellow('Manifest not found in template. Using fallback file list.'));

    // Try to read version from template's package.json
    let templateVersion = config.version;
    const templatePkgPath = join(tempDir, 'package.json');
    if (existsSync(templatePkgPath)) {
      const templatePkg = readJson<{ version?: string }>(templatePkgPath);
      if (templatePkg.version) {
        templateVersion = templatePkg.version;
      }
    }

    manifest = {
      version: templateVersion,
      minCliVersion: '1.0.0',
      files: {
        safe: FALLBACK_SAFE_FILES,
        protected: [],
      },
      dependencies: {
        update: {},
        remove: [],
        add: {},
      },
      migrations: [],
    };
  }

  // Check CLI version requirement
  if (isVersionLessThan(CLI_VERSION, manifest.minCliVersion)) {
    p.log.error(
      pc.red(
        `This upgrade requires create-velocity-astro >= ${manifest.minCliVersion}.\n` +
        'Run `npm update -g create-velocity-astro` to update.'
      )
    );
    cleanup(tempDir);
    process.exit(1);
  }

  // Filter migrations to only those relevant to the user's current version
  manifest.migrations = filterMigrations(manifest.migrations, config.version);

  // Check if already on latest version
  if (config.version === manifest.version) {
    showUpgradeIntro(config.version, manifest.version);
    p.log.info(pc.green(`Already on v${manifest.version}. Nothing to upgrade.`));
    p.outro('');
    cleanup(tempDir);
    return;
  }

  // 4. Diff safe files, passing stored hashes for user-modification detection
  const diffs = diffProjects(targetDir, tempDir, manifest, config.fileHashes);
  const { added, modified, conflict } = summarizeDiffs(diffs);

  // If no changes at all
  if (added === 0 && modified === 0 && conflict === 0 &&
      Object.keys(manifest.dependencies.update).length === 0 &&
      manifest.dependencies.remove.length === 0 &&
      Object.keys(manifest.dependencies.add).length === 0) {
    showUpgradeIntro(config.version, manifest.version);
    p.log.info(pc.green('All files are up to date. Updating version marker only.'));
    if (!dryRun) {
      writeVelocityConfig(targetDir, {
        ...config,
        version: manifest.version,
        updatedAt: new Date().toISOString().slice(0, 10),
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
  let backupDir = '';
  if (conflictDiffs.length > 0) {
    backupDir = backupConflicts(targetDir, conflictDiffs, config.version);
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

  // 6c. Merge package.json dependencies
  const hasDepChanges =
    Object.keys(manifest.dependencies.update).length > 0 ||
    manifest.dependencies.remove.length > 0 ||
    Object.keys(manifest.dependencies.add).length > 0;

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
  if (conflictDiffs.length > 0) {
    showConflictNotice(backupDir, conflictDiffs);
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
