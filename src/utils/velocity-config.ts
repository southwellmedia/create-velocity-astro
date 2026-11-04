import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { VelocityConfig, ScaffoldOptions } from '../types.js';
import { readJson, writeJson } from './fs.js';
import { sourceRecord } from '../template-source.js';

const CONFIG_FILENAME = '.velocity.json';

/**
 * Reads .velocity.json from a project directory.
 * Returns null if the file doesn't exist.
 */
export function readVelocityConfig(projectDir: string): VelocityConfig | null {
  const configPath = join(projectDir, CONFIG_FILENAME);
  if (!existsSync(configPath)) {
    return null;
  }
  return readJson<VelocityConfig>(configPath);
}

/**
 * Writes .velocity.json to a project directory.
 */
export function writeVelocityConfig(projectDir: string, config: VelocityConfig): void {
  const configPath = join(projectDir, CONFIG_FILENAME);
  writeJson(configPath, config);
}

/**
 * Builds a VelocityConfig from scaffold options for initial project creation.
 */
export function createInitialConfig(options: ScaffoldOptions, version: string): VelocityConfig {
  const today = new Date().toISOString().slice(0, 10);

  let componentsValue: string;
  switch (options.componentSelection.mode) {
    case 'all':
      componentsValue = 'all';
      break;
    case 'none':
      componentsValue = 'none';
      break;
    case 'categories':
      componentsValue = `categories:${options.componentSelection.categories?.join(',') ?? ''}`;
      break;
    case 'individual':
      componentsValue = `individual:${options.componentSelection.components?.join(',') ?? ''}`;
      break;
  }

  return {
    version,
    createdAt: today,
    updatedAt: today,
    features: {
      demo: options.demo,
      i18n: options.i18n,
      components: componentsValue,
    },
    template: sourceRecord(options.templateSource),
  };
}
