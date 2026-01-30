import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * Recursively copies a directory
 */
export function copyDirectory(src: string, dest: string, overwrite = false): void {
  if (!existsSync(src)) {
    throw new Error(`Source directory does not exist: ${src}`);
  }

  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, overwrite);
    } else {
      if (overwrite || !existsSync(destPath)) {
        const destDir = dirname(destPath);
        if (!existsSync(destDir)) {
          mkdirSync(destDir, { recursive: true });
        }
        copyFileSync(srcPath, destPath);
      }
    }
  }
}

/**
 * Checks if a directory is empty
 */
export function isEmptyDir(path: string): boolean {
  if (!existsSync(path)) return true;
  const files = readdirSync(path);
  return files.length === 0 || (files.length === 1 && files[0] === '.git');
}

/**
 * Reads a JSON file and parses it
 */
export function readJson<T = Record<string, unknown>>(path: string): T {
  const content = readFileSync(path, 'utf-8');
  return JSON.parse(content) as T;
}

/**
 * Writes an object as JSON to a file
 */
export function writeJson(path: string, data: unknown): void {
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Checks if path exists and is a directory
 */
export function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}
