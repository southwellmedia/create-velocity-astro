import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as p from '@clack/prompts';
import { execa } from 'execa';
import type { ScaffoldOptions, UpgradeManifest } from './types.js';
import { getInstallCommand } from './utils/package-manager.js';
import { seedSite, supportsSiteSetup, type BriefInput } from './features/site.js';
import { initGit } from './utils/git.js';
import { showSuccess, showWarning } from './prompts.js';
import { generatePages } from './features/pages.js';
import { createInitialConfig, writeVelocityConfig } from './utils/velocity-config.js';
import { copyDirectory } from './utils/fs.js';
import { computeFileHashes } from './utils/diff.js';
import { writeBaseline } from './utils/baseline.js';
import { applyLockfilePolicy, describeSource, fetchTemplate } from './template-source.js';
import { checkGates, readManifest, runVariantPipeline } from './variants.js';

declare const CLI_VERSION: string;

/**
 * Updates the package.json with the new project name
 */
function updatePackageJson(targetDir: string, projectName: string): void {
  const pkgPath = join(targetDir, 'package.json');

  if (!existsSync(pkgPath)) {
    throw new Error('package.json not found in template');
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  pkg.version = '0.1.0';
  delete pkg.repository;
  delete pkg.bugs;
  delete pkg.homepage;

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function removeQuietly(path: string): void {
  try {
    rmSync(path, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Main scaffold function.
 *
 * The template is fetched into a staging directory, checked against the
 * manifest's version gates, transformed by Velocity's own variant pipeline
 * (variants → component selection → cleanup), and only then copied into the
 * target directory. The CLI ships no template files of its own.
 */
export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const {
    projectName,
    targetDir,
    demo,
    componentSelection,
    i18n,
    pages,
    pageLayout,
    packageManager,
    templateSource,
    install = true,
    site,
  } = options;
  const spinner = p.spinner();
  const stagingDir = mkdtempSync(join(tmpdir(), 'velocity-scaffold-'));
  const sourceLabel = describeSource(templateSource);

  let manifest: UpgradeManifest | null = null;
  try {
    // Step 1: Fetch the template
    spinner.start(
      templateSource.kind === 'local'
        ? `Copying template from ${templateSource.dir}...`
        : `Downloading Velocity (${templateSource.ref}) from GitHub...`
    );
    try {
      await fetchTemplate(templateSource, stagingDir);
      spinner.stop(`Template fetched (${sourceLabel})`);
    } catch (error) {
      spinner.stop('Failed to fetch template');
      throw new Error(
        templateSource.kind === 'local'
          ? `Could not copy template from ${templateSource.dir}.\n${error instanceof Error ? error.message : ''}`
          : `Could not download ${sourceLabel}. Check your internet connection and that the ref exists.\n${error instanceof Error ? error.message : ''}`
      );
    }

    // Step 2: Version gates
    manifest = readManifest<UpgradeManifest>(stagingDir);
    const { scaffold: scaffoldSection, nodeWarning } = checkGates(manifest, {
      cliVersion: CLI_VERSION,
      mode: 'scaffold',
      sourceLabel,
    });
    if (nodeWarning) showWarning(nodeWarning);

    // Step 3: Variants → component selection → cleanup (Velocity's manifest)
    spinner.start('Applying Velocity variants...');
    try {
      const result = runVariantPipeline(stagingDir, scaffoldSection, {
        options: { demo, i18n },
        componentSelection,
      });
      const parts = [
        result.appliedVariants.length > 0
          ? `variants: ${result.appliedVariants.join(', ')}`
          : 'no variants',
      ];
      if (componentSelection.mode !== 'all' && !result.components.pruned) {
        parts.push('component registry unavailable, kept all components');
      }
      spinner.stop(`Template configured (${parts.join('; ')})`);
    } catch (error) {
      spinner.stop('Failed to apply variants');
      throw error;
    }

    // Step 4: CLI-level cleanup: VCS data and lockfiles for other package managers
    removeQuietly(join(stagingDir, '.git'));
    applyLockfilePolicy(stagingDir, packageManager);

    // Step 5: Move into the target directory
    copyDirectory(stagingDir, targetDir, true);
  } finally {
    removeQuietly(stagingDir);
  }

  // Step 6: Generate starter pages if requested
  if (pages.length > 0) {
    spinner.start(`Generating ${pages.length} starter page${pages.length > 1 ? 's' : ''}...`);
    try {
      const result = generatePages(targetDir, pages, pageLayout);
      spinner.stop(
        result.generated.length > 0
          ? `Generated pages: ${result.generated.join(', ')}`
          : 'No pages generated'
      );
      for (const warning of result.warnings) showWarning(warning);
    } catch (error) {
      spinner.stop('Failed to generate pages');
      throw error;
    }
  }

  // Step 7: Update package.json
  spinner.start('Configuring project...');
  try {
    updatePackageJson(targetDir, projectName);
    spinner.stop('Project configured');
  } catch (error) {
    spinner.stop('Failed to configure project');
    throw error;
  }

  // Step 8: Write .velocity.json (template version + resolved ref + safe-file hashes)
  try {
    let templateVersion = manifest?.version;
    if (!templateVersion) {
      const pkg = JSON.parse(readFileSync(join(targetDir, 'package.json'), 'utf-8')) as { version?: string };
      templateVersion = pkg.version ?? '0.0.0';
    }

    const velocityConfig = createInitialConfig(options, templateVersion);
    if (manifest?.files?.safe) {
      velocityConfig.fileHashes = computeFileHashes(targetDir, manifest.files.safe);
    }
    writeVelocityConfig(targetDir, velocityConfig);
  } catch {
    // Non-fatal — project still usable without .velocity.json
  }

  // Step 8b: Record Velocity-owned files as shipped (.velocity/baseline.json),
  // so check:agent can spot later edits. Written before git init so it lands in
  // the initial commit.
  try {
    writeBaseline(targetDir, manifest);
  } catch (error) {
    showWarning(
      `Could not write .velocity/baseline.json (${error instanceof Error ? error.message : String(error)}). ` +
        'Run "npm run check:agent -- --write-baseline" to create it.'
    );
  }

  // Step 9: Seed the site brief and name (own site, Velocity 2.5+ templates)
  const seeding = site?.start === 'own' && supportsSiteSetup(manifest?.version);
  const briefInput: BriefInput | undefined = seeding && site ? { ...site, locales: readLocales(targetDir), pages } : undefined;
  if (briefInput) {
    if (!seedSite(targetDir, briefInput)) {
      showWarning('This Velocity version has no site brief template; skipped .agents/site.md.');
    }
  } else if (site?.start === 'own' && manifest && !supportsSiteSetup(manifest.version)) {
    showWarning(`Velocity ${manifest.version} predates the site brief (2.5); created a minimal project.`);
  }

  // Step 10: Install dependencies
  if (install) {
    spinner.start(`Installing dependencies with ${packageManager}...`);
    try {
      const installCmd = getInstallCommand(packageManager);
      const [cmd, ...args] = installCmd.split(' ');
      await execa(cmd!, args, { cwd: targetDir });
      spinner.stop('Dependencies installed');
    } catch {
      spinner.stop('Failed to install dependencies');
      showWarning(`Run "${getInstallCommand(packageManager)}" manually to install dependencies`);
    }
  }

  // Step 11: Initialize git, last, so the first commit holds the finished project
  spinner.start('Initializing git repository...');
  const gitInitialized = await initGit(targetDir);
  if (gitInitialized) {
    spinner.stop('Git repository initialized');
  } else {
    spinner.stop('Git not available, skipping');
  }

  showSuccess(`Project "${projectName}" created successfully!`);
}

/** Locales enabled in the scaffolded project (src/i18n/locales.mjs), default first. */
function readLocales(projectDir: string): string[] {
  const file = join(projectDir, 'src/i18n/locales.mjs');
  if (!existsSync(file)) return ['en'];
  const text = readFileSync(file, 'utf-8');
  const list = /locales\s*=\s*\[([^\]]*)\]/.exec(text)?.[1];
  const locales = [...(list ?? '').matchAll(/['"]([\w-]+)['"]/g)].map((m) => m[1]!);
  const fallback = /defaultLocale\s*=\s*['"]([\w-]+)['"]/.exec(text)?.[1] ?? 'en';
  return locales.length ? [fallback, ...locales.filter((l) => l !== fallback)] : [fallback];
}
