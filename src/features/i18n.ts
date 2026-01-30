import { existsSync } from 'node:fs';
import { copyDirectory } from '../utils/fs.js';
import { getI18nTemplatePath } from '../template.js';

/**
 * Applies i18n overlay to a scaffolded project
 * This copies i18n-specific files that override/extend the base template
 */
export async function applyI18n(targetDir: string): Promise<void> {
  const i18nTemplatePath = getI18nTemplatePath();

  if (!existsSync(i18nTemplatePath)) {
    throw new Error(`i18n template not found at ${i18nTemplatePath}`);
  }

  // Copy all i18n overlay files, overwriting existing ones
  copyDirectory(i18nTemplatePath, targetDir, true);
}

/**
 * List of files that will be added/modified when i18n is enabled
 */
export const I18N_FILES = [
  'src/i18n/config.ts',
  'src/i18n/index.ts',
  'src/i18n/translations/en.ts',
  'src/i18n/translations/es.ts',
  'src/i18n/translations/fr.ts',
  'src/components/i18n/LanguageSwitcher.astro',
  'src/layouts/BaseLayout.astro',
  'src/pages/[lang]/index.astro',
  'astro.config.mjs',
];
