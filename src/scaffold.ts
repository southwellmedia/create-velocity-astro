import { existsSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import * as p from '@clack/prompts';
import { execa } from 'execa';
import { downloadTemplate } from 'giget';
import type { ScaffoldOptions } from './types.js';
import type { ComponentSelection, ResolvedComponents } from './registry/types.js';
import { getI18nTemplatePath, getBaseTemplatePath } from './template.js';
import { getInstallCommand } from './utils/package-manager.js';
import { initGit } from './utils/git.js';
import { showSuccess, showWarning } from './prompts.js';
import { generatePages } from './features/pages.js';
import { fetchRegistry } from './registry/fetcher.js';
import { resolveDependencies } from './registry/resolver.js';
import { createInitialConfig, writeVelocityConfig } from './utils/velocity-config.js';
import { readJson } from './utils/fs.js';

// GitHub repository for the Velocity template
const TEMPLATE_REPO = 'github:southwellmedia/velocity';

// Files/directories to remove after download
const CLEANUP_ITEMS = [
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  '.git',
];

// Demo-specific content to remove when --demo is false
// Includes both base paths and i18n paths to handle all scenarios
const DEMO_CONTENT = [
  // Landing page components
  'src/components/landing',
  'src/components/hero',
  // Landing-specific pages (base paths)
  'src/pages/index.astro',
  'src/pages/about.astro',
  'src/pages/contact.astro',
  'src/pages/components.astro',
  // Landing-specific pages (i18n paths)
  'src/pages/[lang]/index.astro',
  'src/pages/[lang]/[...about].astro',
  'src/pages/[lang]/[...contact].astro',
  'src/pages/[lang]/[...components].astro',
  // Landing layout (depends on Navbar from landing components)
  'src/layouts/LandingLayout.astro',
  // Demo content
  'src/content/blog',
  'src/content/faqs',
  'src/content/authors',
  'src/content/pages',
];

// Optional component directories (for removal when mode='none')
// Note: layout, seo, landing, blog are core template - not optional
const OPTIONAL_COMPONENT_DIRS = [
  'src/components/ui',
  'src/components/patterns',
  'src/components/hero',
];

/**
 * Copies template files recursively
 */
function copyTemplateFiles(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyTemplateFiles(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Removes files/directories from the target
 */
function removeItems(targetDir: string, items: string[]): void {
  for (const item of items) {
    const itemPath = join(targetDir, item);
    if (existsSync(itemPath)) {
      try {
        rmSync(itemPath, { recursive: true, force: true });
      } catch {
        // Ignore errors - item may not exist or be locked
      }
    }
  }
}

/**
 * Recursively collects all file paths relative to the project root
 */
function walkFilesRelative(absDir: string, relativeBase: string): string[] {
  const results: string[] = [];
  if (!existsSync(absDir)) return results;

  const entries = readdirSync(absDir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = join(absDir, entry.name);
    const relPath = `${relativeBase}/${entry.name}`;
    if (entry.isDirectory()) {
      results.push(...walkFilesRelative(absPath, relPath));
    } else {
      results.push(relPath);
    }
  }
  return results;
}

/**
 * Recursively removes empty directories bottom-up
 */
function removeEmptyDirs(dir: string): void {
  if (!existsSync(dir)) return;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      removeEmptyDirs(join(dir, entry.name));
    }
  }

  // Re-read after cleaning children
  const remaining = readdirSync(dir);
  if (remaining.length === 0) {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Keeps only specified files, removes everything else in optional component directories.
 * Walks recursively to handle nested subcategory folders (e.g. ui/form/Button/).
 */
function keepOnlyFiles(targetDir: string, filesToKeep: Set<string>): void {
  // Only filter optional component directories - core template dirs are untouched
  const componentDirs = [
    'src/components/ui',
    'src/components/patterns',
    'src/components/hero',
  ];

  for (const dir of componentDirs) {
    const dirPath = join(targetDir, dir);
    if (!existsSync(dirPath)) continue;

    // Recursively walk all files in the directory
    const allFiles = walkFilesRelative(dirPath, dir);
    for (const relativePath of allFiles) {
      if (!filesToKeep.has(relativePath)) {
        try {
          rmSync(join(targetDir, relativePath), { force: true });
        } catch {
          // Ignore errors
        }
      }
    }

    // Clean up empty directories (bottom-up)
    removeEmptyDirs(dirPath);
  }
}

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

/**
 * Applies base template (minimal pages) when demo is not selected
 */
function applyBaseTemplate(targetDir: string): void {
  const baseTemplate = getBaseTemplatePath();
  if (existsSync(baseTemplate)) {
    copyTemplateFiles(baseTemplate, targetDir);
  }
}

/**
 * Applies the i18n overlay to the project
 */
function applyI18nOverlay(targetDir: string): void {
  const i18nTemplate = getI18nTemplatePath();
  copyTemplateFiles(i18nTemplate, targetDir);
}

/**
 * Creates empty content directories with .gitkeep files
 */
function createContentDirectories(targetDir: string): void {
  const contentDirs = [
    'src/content/blog',
  ];

  for (const dir of contentDirs) {
    const dirPath = join(targetDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      writeFileSync(join(dirPath, '.gitkeep'), '');
    }
  }
}

/**
 * Applies selective component filtering based on registry resolution
 */
async function applyComponentSelection(
  targetDir: string,
  selection: ComponentSelection
): Promise<void> {
  // Handle 'all' mode - keep everything
  if (selection.mode === 'all') {
    return;
  }

  // Handle 'none' mode - remove optional components only
  if (selection.mode === 'none') {
    removeItems(targetDir, OPTIONAL_COMPONENT_DIRS);
    return;
  }

  // For 'categories' and 'individual' modes, we need the registry
  let resolved: ResolvedComponents;
  try {
    const registry = await fetchRegistry();
    resolved = resolveDependencies(selection, registry);
  } catch {
    // If registry fetch fails, fall back to keeping all components
    console.warn('Could not fetch component registry, keeping all components');
    return;
  }

  // Create set of files to keep
  const filesToKeep = new Set(resolved.files);

  // Keep only the resolved files
  keepOnlyFiles(targetDir, filesToKeep);

  // Ensure utility files are present if needed
  if (resolved.utilities.includes('cn')) {
    const cnPath = join(targetDir, 'src/lib/cn.ts');
    const cnDir = dirname(cnPath);
    if (!existsSync(cnDir)) {
      mkdirSync(cnDir, { recursive: true });
    }
  }
}

/**
 * Main scaffold function
 *
 * IMPORTANT: Step order matters for option combinations
 * - i18n overlay is applied BEFORE demo removal
 * - This ensures demo=Yes + i18n=Yes gets full translated demo
 * - And demo=No + i18n=Yes gets i18n routing without demo pages
 */
export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { projectName, targetDir, demo, componentSelection, i18n, pages, pageLayout, packageManager } = options;
  const spinner = p.spinner();

  // Step 1: Download base template from GitHub
  spinner.start('Downloading template from GitHub...');

  try {
    await downloadTemplate(TEMPLATE_REPO, {
      dir: targetDir,
      force: true,
    });
    removeItems(targetDir, CLEANUP_ITEMS);
    spinner.stop('Template downloaded');
  } catch (error) {
    spinner.stop('Failed to download template');
    throw new Error(
      `Could not download template from GitHub. Please check your internet connection.\n${error instanceof Error ? error.message : ''}`
    );
  }

  // Step 2: Apply component selection
  if (componentSelection.mode !== 'all') {
    spinner.start('Configuring components...');
    try {
      await applyComponentSelection(targetDir, componentSelection);
      spinner.stop('Components configured');
    } catch (error) {
      spinner.stop('Failed to configure components');
      throw error;
    }
  }

  // Step 3: Apply i18n overlay if requested (BEFORE demo removal)
  // This ensures demo=Yes + i18n=Yes gets translated demo pages
  if (i18n) {
    spinner.start('Adding i18n support...');
    try {
      applyI18nOverlay(targetDir);
      spinner.stop('i18n support added');
    } catch (error) {
      spinner.stop('Failed to add i18n support');
      throw error;
    }
  }

  // Step 4: Remove demo content LAST (handles both base and i18n paths)
  // This runs after i18n overlay so it can remove i18n demo pages if needed
  if (!demo) {
    spinner.start('Configuring minimal template...');
    removeItems(targetDir, DEMO_CONTENT);
    applyBaseTemplate(targetDir);
    createContentDirectories(targetDir);
    spinner.stop('Minimal template configured');
  }

  // Step 5: Generate starter pages if requested
  if (pages.length > 0) {
    spinner.start(`Generating ${pages.length} starter page${pages.length > 1 ? 's' : ''}...`);
    try {
      const generatedFiles = await generatePages(targetDir, pages, pageLayout, i18n);
      spinner.stop(`Generated ${generatedFiles.length} page file${generatedFiles.length > 1 ? 's' : ''}`);
    } catch (error) {
      spinner.stop('Failed to generate pages');
      throw error;
    }
  }

  // Step 6: Update package.json
  spinner.start('Configuring project...');
  try {
    updatePackageJson(targetDir, projectName);
    spinner.stop('Project configured');
  } catch (error) {
    spinner.stop('Failed to configure project');
    throw error;
  }

  // Step 6.5: Write .velocity.json
  try {
    let templateVersion = '0.1.0-beta';
    const manifestPath = join(targetDir, 'velocity-manifest.json');
    const pkgPath = join(targetDir, 'package.json');

    if (existsSync(manifestPath)) {
      const manifest = readJson<{ version?: string }>(manifestPath);
      if (manifest.version) templateVersion = manifest.version;
    } else if (existsSync(pkgPath)) {
      const pkg = readJson<{ version?: string }>(pkgPath);
      if (pkg.version) templateVersion = pkg.version;
    }

    const velocityConfig = createInitialConfig(options, templateVersion);
    writeVelocityConfig(targetDir, velocityConfig);
  } catch {
    // Non-fatal — project still usable without .velocity.json
  }

  // Step 7: Initialize git
  spinner.start('Initializing git repository...');
  const gitInitialized = await initGit(targetDir);
  if (gitInitialized) {
    spinner.stop('Git repository initialized');
  } else {
    spinner.stop('Git not available, skipping');
  }

  // Step 8: Install dependencies
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

  showSuccess(`Project "${projectName}" created successfully!`);
}
