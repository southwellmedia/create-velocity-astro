import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { UpgradeManifest, FileDiff } from '../types.js';

/**
 * Computes SHA-256 hash of a file's contents.
 */
export function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Computes hashes for all files under the given paths, relative to baseDir.
 */
export function computeFileHashes(
  baseDir: string,
  paths: string[]
): Record<string, string> {
  const hashes: Record<string, string> = {};
  const expanded = expandPaths(paths, baseDir);

  for (const filePath of expanded) {
    const fullPath = join(baseDir, filePath);
    if (existsSync(fullPath) && !statSync(fullPath).isDirectory()) {
      hashes[filePath] = hashFile(fullPath);
    }
  }

  return hashes;
}

/**
 * Recursively collects all file paths under a directory, relative to baseDir.
 */
function walkDir(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else {
      results.push(relative(baseDir, fullPath));
    }
  }
  return results;
}

/**
 * Expands a list of file/directory paths into individual file paths.
 * If a path ends with "/" or is a directory in freshDir, expands to all files within.
 */
function expandPaths(paths: string[], freshDir: string): string[] {
  const files: string[] = [];

  for (const p of paths) {
    const fullPath = join(freshDir, p);

    if (p.endsWith('/') || (existsSync(fullPath) && statSync(fullPath).isDirectory())) {
      files.push(...walkDir(fullPath, freshDir));
    } else {
      files.push(p);
    }
  }

  return [...new Set(files)];
}

/**
 * Normalizes path separators to forward slashes for consistent hash lookups
 * across Windows and Unix.
 */
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

/**
 * Compares files between the current project and a fresh template download.
 * Only examines files listed in the manifest's "safe" list.
 *
 * Uses stored file hashes (from .velocity.json) to detect user modifications:
 * - If the user's file matches its stored hash → user hasn't modified it → safe to overwrite
 * - If the user's file differs from its stored hash → user customized it → conflict
 * - If no stored hash exists (pre-hash upgrade) → falls back to overwrite (legacy behavior)
 */
export function diffProjects(
  currentDir: string,
  freshDir: string,
  manifest: UpgradeManifest,
  storedHashes?: Record<string, string>
): FileDiff[] {
  const diffs: FileDiff[] = [];
  const safeFiles = expandPaths(manifest.files.safe, freshDir);

  for (const filePath of safeFiles) {
    const currentPath = join(currentDir, filePath);
    const freshPath = join(freshDir, filePath);
    const normalizedPath = normalizePath(filePath);

    // Fresh template file doesn't exist (shouldn't happen, but handle gracefully)
    if (!existsSync(freshPath)) continue;

    if (!existsSync(currentPath)) {
      diffs.push({ path: filePath, status: 'added', category: 'safe' });
    } else {
      const currentContent = readFileSync(currentPath);
      const freshContent = readFileSync(freshPath);

      if (Buffer.compare(currentContent, freshContent) === 0) {
        diffs.push({ path: filePath, status: 'unchanged', category: 'safe' });
      } else {
        // Template changed this file. Check if the user also modified it.
        const storedHash = storedHashes?.[normalizedPath];

        if (storedHash) {
          const currentHash = createHash('sha256').update(currentContent).digest('hex');
          if (currentHash !== storedHash) {
            // User modified this file AND template changed it → conflict
            diffs.push({ path: filePath, status: 'conflict', category: 'safe' });
          } else {
            // User hasn't touched it, only template changed → safe to overwrite
            diffs.push({ path: filePath, status: 'modified', category: 'safe' });
          }
        } else {
          // No stored hash (legacy project or first hash-aware upgrade).
          // Fall back to overwrite, but mark as modified so it shows in summary.
          diffs.push({ path: filePath, status: 'modified', category: 'safe' });
        }
      }
    }
  }

  return diffs;
}

/**
 * Returns a summary count of diff statuses.
 */
export function summarizeDiffs(diffs: FileDiff[]): {
  added: number;
  modified: number;
  unchanged: number;
  conflict: number;
} {
  let added = 0;
  let modified = 0;
  let unchanged = 0;
  let conflict = 0;

  for (const diff of diffs) {
    switch (diff.status) {
      case 'added':
        added++;
        break;
      case 'modified':
        modified++;
        break;
      case 'unchanged':
        unchanged++;
        break;
      case 'conflict':
        conflict++;
        break;
    }
  }

  return { added, modified, unchanged, conflict };
}
