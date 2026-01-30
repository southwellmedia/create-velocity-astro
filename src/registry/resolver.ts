/**
 * Dependency Resolver
 * Resolves component dependencies and collects all required files
 */

import type { ComponentRegistry, ComponentSelection, ResolvedComponents } from './types.js';

/**
 * Resolves dependencies for requested components
 * Returns all components, utilities, files, and npm packages needed
 */
export function resolveDependencies(
  selection: ComponentSelection,
  registry: ComponentRegistry
): ResolvedComponents {
  const resolved = new Set<string>();
  const utilities = new Set<string>();
  const files = new Set<string>();
  const npmPackages = new Set<string>();

  // Handle different selection modes
  let requestedComponents: string[] = [];

  switch (selection.mode) {
    case 'none':
      return { components: [], utilities: [], files: [], npmPackages: [] };

    case 'all':
      requestedComponents = Object.keys(registry.components);
      break;

    case 'categories':
      if (selection.categories) {
        requestedComponents = Object.entries(registry.components)
          .filter(([, comp]) => selection.categories!.includes(comp.category))
          .map(([id]) => id);
      }
      break;

    case 'individual':
      requestedComponents = selection.components || [];
      break;
  }

  // Recursively resolve each component's dependencies
  function resolve(componentId: string): void {
    if (resolved.has(componentId)) return;

    const component = registry.components[componentId];
    if (!component) {
      console.warn(`Component not found: ${componentId}`);
      return;
    }

    // Resolve component dependencies first (recursive)
    for (const dep of component.dependencies.components) {
      resolve(dep);
    }

    // Collect utilities
    for (const util of component.dependencies.utilities) {
      utilities.add(util);
    }

    // Collect files
    for (const file of component.files) {
      files.add(file);
    }

    resolved.add(componentId);
  }

  // Resolve all requested components
  for (const componentId of requestedComponents) {
    resolve(componentId);
  }

  // Collect utility files and npm packages
  for (const utilId of utilities) {
    const utility = registry.utilities[utilId];
    if (utility) {
      for (const file of utility.files) {
        files.add(file);
      }
      for (const pkg of utility.npm) {
        npmPackages.add(pkg);
      }
    }
  }

  return {
    components: [...resolved],
    utilities: [...utilities],
    files: [...files],
    npmPackages: [...npmPackages],
  };
}

/**
 * Gets all components in a category
 */
export function getComponentsByCategory(
  categoryId: string,
  registry: ComponentRegistry
): string[] {
  return Object.entries(registry.components)
    .filter(([, comp]) => comp.category === categoryId)
    .map(([id]) => id);
}

/**
 * Gets the dependency tree for a component (for visualization)
 */
export function getDependencyTree(
  componentId: string,
  registry: ComponentRegistry,
  visited = new Set<string>()
): { id: string; name: string; deps: ReturnType<typeof getDependencyTree>[] } | null {
  if (visited.has(componentId)) return null;
  visited.add(componentId);

  const component = registry.components[componentId];
  if (!component) return null;

  const deps = component.dependencies.components
    .map((dep) => getDependencyTree(dep, registry, visited))
    .filter((d): d is NonNullable<typeof d> => d !== null);

  return {
    id: componentId,
    name: component.name,
    deps,
  };
}

/**
 * Validates that all components exist in the registry
 */
export function validateComponents(
  componentIds: string[],
  registry: ComponentRegistry
): { valid: boolean; invalid: string[] } {
  const invalid = componentIds.filter((id) => !registry.components[id]);
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

/**
 * Validates that all categories exist in the registry
 */
export function validateCategories(
  categoryIds: string[],
  registry: ComponentRegistry
): { valid: boolean; invalid: string[] } {
  const invalid = categoryIds.filter((id) => !registry.categories[id]);
  return {
    valid: invalid.length === 0,
    invalid,
  };
}

/**
 * Gets summary stats for a component selection
 */
export function getSelectionStats(
  resolved: ResolvedComponents,
  registry: ComponentRegistry
): { componentCount: number; fileCount: number; categories: string[] } {
  const categories = new Set<string>();

  for (const componentId of resolved.components) {
    const component = registry.components[componentId];
    if (component) {
      categories.add(component.category);
    }
  }

  return {
    componentCount: resolved.components.length,
    fileCount: resolved.files.length,
    categories: [...categories],
  };
}
