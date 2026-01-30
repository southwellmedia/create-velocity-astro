import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolves the path to the base template (minimal pages)
 */
export function getBaseTemplatePath(): string {
  const templatePath = resolve(__dirname, '..', 'templates', 'base');

  if (existsSync(templatePath)) {
    return templatePath;
  }

  throw new Error('Could not find base template. Package may be corrupted.');
}

/**
 * Resolves the path to the i18n overlay template
 */
export function getI18nTemplatePath(): string {
  const templatePath = resolve(__dirname, '..', 'templates', 'i18n');

  if (existsSync(templatePath)) {
    return templatePath;
  }

  throw new Error('Could not find i18n template. Package may be corrupted.');
}
