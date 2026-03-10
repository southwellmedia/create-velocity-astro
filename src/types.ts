import type { ComponentSelection } from './registry/types.js';

export interface CliOptions {
  projectName?: string;
  demo?: boolean;
  components?: string | boolean;
  i18n?: boolean;
  pages?: boolean;
  help?: boolean;
  version?: boolean;
  yes?: boolean;
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
  };
  migrations: MigrationStep[];
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
}

export interface FileDiff {
  path: string;
  status: 'added' | 'modified' | 'unchanged' | 'removed' | 'conflict';
  category: 'safe' | 'protected';
}
