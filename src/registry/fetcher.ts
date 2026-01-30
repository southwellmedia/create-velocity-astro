/**
 * Registry Fetcher
 * Fetches the component registry from GitHub
 */

import type { ComponentRegistry } from './types.js';

const REGISTRY_URL = 'https://raw.githubusercontent.com/southwellmedia/velocity/main/component-registry.json';

let cachedRegistry: ComponentRegistry | null = null;

/**
 * Fetches the component registry from GitHub
 * Results are cached for the duration of the process
 */
export async function fetchRegistry(): Promise<ComponentRegistry> {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  try {
    const response = await fetch(REGISTRY_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
    }

    cachedRegistry = await response.json() as ComponentRegistry;
    return cachedRegistry;
  } catch (error) {
    throw new Error(
      `Could not fetch component registry. Please check your internet connection.\n${error instanceof Error ? error.message : ''}`
    );
  }
}

/**
 * Fetches a single file from the velocity repository
 */
export async function fetchComponentFile(filePath: string): Promise<string> {
  const url = `https://raw.githubusercontent.com/southwellmedia/velocity/main/${filePath}`;

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
  cachedRegistry = null;
}
