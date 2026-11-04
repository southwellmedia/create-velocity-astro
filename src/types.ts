import type { ComponentSelection } from './registry/types.js';
import type { TemplateSource } from './template-source.js';
import type { ScaffoldSection } from './variants.js';

export interface CliOptions {
  projectName?: string;
  demo?: boolean;
  components?: string | boolean;
  i18n?: boolean;
  pages?: string;
  help?: boolean;
  version?: boolean;
  yes?: boolean;
  ref?: string;
  template?: string;
  install?: boolean;
}

export type PageLayout = 'page' | 'landing';

export interface ScaffoldOptions {
  projectName: string;
  targetDir: string;
  demo: boolean;
  componentSelection: ComponentSelection;
  i18n: boolean;
  pages: string[];
  pageLayout: PageLayout;
  packageManager: PackageManager;
  /** Where the Velocity template comes from (GitHub ref or local directory) */
  templateSource: TemplateSource;
  /** Install dependencies after scaffolding (default true) */
  install?: boolean;
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export interface PromptAnswers {
  projectName: string;
  demo: boolean;
  componentSelection: ComponentSelection;
  i18n: boolean;
  pages: string[];
  pageLayout: PageLayout;
  packageManager: PackageManager;
}

export interface VelocityConfig {
  version: string;
  createdAt: string;
  updatedAt: string;
  features: {
    demo: boolean;
    i18n: boolean;
    components: string;
  };
  /** Template the project was created from / last upgraded to */
  template?: { source: 'github'; ref: string } | { source: 'local'; path: string };
  /** SHA-256 hashes of safe files at last scaffold/upgrade, keyed by relative path */
  fileHashes?: Record<string, string>;
}

export interface UpgradeManifest {
  version: string;
  minCliVersion: string;
  files: {
    safe: string[];
    protected: string[];
  };
  dependencies: {
    update: Record<string, string>;
    remove: string[];
    add: Record<string, string>;
    /** Packages to add (or bump) in devDependencies */
    addDev?: Record<string, string>;
  };
  migrations: MigrationStep[];
  scaffold?: ScaffoldSection;
}

export interface MigrationStep {
  title: string;
  description: string;
  pattern?: string;
  searchPaths?: string[];
  fromVersion?: string;  // Only show if user's version >= this
  toVersion?: string;    // Only show if user's version < this
}

export interface UpgradeOptions {
  targetDir: string;
  dryRun: boolean;
  yes: boolean;
  /** Velocity tag or branch to upgrade to (default: latest release) */
  ref?: string;
  /** Local Velocity checkout to upgrade from */
  template?: string;
}

export interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'unchanged' | 'removed' | 'conflict';
  category: 'safe' | 'protected';
}
