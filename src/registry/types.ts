/**
 * Component Registry Types
 * Defines the structure of the component registry
 */

export interface CategoryEntry {
  name: string;
  description: string;
}

export interface UtilityEntry {
  name: string;
  description: string;
  files: string[];
  npm: string[];
}

export interface ComponentDependencies {
  utilities: string[];
  components: string[];
}

export interface ComponentEntry {
  name: string;
  category: string;
  files: string[];
  dependencies: ComponentDependencies;
  premium: boolean;
}

export interface ComponentRegistry {
  version: string;
  categories: Record<string, CategoryEntry>;
  utilities: Record<string, UtilityEntry>;
  components: Record<string, ComponentEntry>;
}

export type ComponentSelectionMode = 'none' | 'categories' | 'individual' | 'all';

export interface ComponentSelection {
  mode: ComponentSelectionMode;
  categories?: string[];
  components?: string[];
}

export interface ResolvedComponents {
  components: string[];
  utilities: string[];
  files: string[];
  npmPackages: string[];
}
