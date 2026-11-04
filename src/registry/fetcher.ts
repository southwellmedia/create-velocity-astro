/**
 * Registry Fetcher
 * Fetches the component registry for a template source (GitHub ref or local directory)
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ComponentRegistry } from './types.js';
import type { TemplateSource } from '../template-source.js';

const RAW_BASE = 'https://raw.githubusercontent.com/southwellmedia/velocity';

const cache = new Map<string, ComponentRegistry>();

/**
 * Fetches the component registry. Defaults to the `main` branch on GitHub.
 * Results are cached per source for the duration of the process.
 */
export async function fetchRegistry(source?: TemplateSource): Promise<ComponentRegistry> {
  const key = source?.kind === 'local' ? `local:${source.dir}` : `ref:${source?.ref ?? 'main'}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let registry: ComponentRegistry;

  if (source?.kind === 'local') {
    const registryPath = join(source.dir, 'component-registry.json');
    if (!existsSync(registryPath)) {
      throw new Error(`component-registry.json not found in ${source.dir}`);
    }
    registry = JSON.parse(readFileSync(registryPath, 'utf-8')) as ComponentRegistry;
  } else {
    const ref = source?.ref ?? 'main';
    try {
      const response = await fetch(`${RAW_BASE}/${encodeURIComponent(ref)}/component-registry.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
      }
      registry = (await response.json()) as ComponentRegistry;
    } catch (error) {
      throw new Error(
        `Could not fetch component registry. Please check your internet connection.\n${error instanceof Error ? error.message : ''}`
      );
    }
  }

  cache.set(key, registry);
  return registry;
}

/**
 * Fetches a single file from the velocity repository
 */
export async function fetchComponentFile(filePath: string, ref = 'main'): Promise<string> {
  const url = `${RAW_BASE}/${encodeURIComponent(ref)}/${filePath}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    return response.text();
  } catch (error) {
    throw new Error(
      `Could not fetch file: ${filePath}\n${error instanceof Error ? error.message : ''}`
    );
  }
}

/**
 * Clears the cached registry
 */
export function clearRegistryCache(): void {
  cache.clear();
}
