import type { ComponentSelection } from './registry/types.js';
import type { TemplateSource } from './template-source.js';
import type { ScaffoldSection } from './variants.js';
import type { SiteOptions, StartMode } from './features/site.js';

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
  start?: string;
  name?: string;
  describe?: string;
  /** No longer used (CLI 2.2); accepted so old commands still run */
  direction?: string;
  brand?: string;
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
  /** What the project is for: seeds .agents/site.md (Velocity 2.5+) */
  site?: SiteOptions;
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export interface PromptAnswers {
  projectName: string;
  site: SiteOptions;
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
    /** What the user chose to start: their own site, the demo, or a blank project */
    start?: StartMode;
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
    /** Protected paths that are still added when the project does not have them */
    seed?: string[];
  };
  dependencies: {
    update: Record<string, string>;
    remove: string[];
    add: Record<string, string>;
    /** Packages to add (or bump) in devDependencies */
    addDev?: Record<string, string>;
  };
  /** Changes to the project's package.json besides dependencies */
  packageJson?: {
    engines?: Record<string, string>;
    /** Added when missing, or updated when the script still equals `replaces` */
    scripts?: Record<string, { value: string; replaces?: string }>;
  };
  migrations: MigrationStep[];
  scaffold?: ScaffoldSection;
}

export interface MigrationStep {
  title: string;
  description: string;
  pattern?: string;
  searchPaths?: string[];
  /** Paths backed up and replaced once, when upgrading across this migration */
  replace?: string[];
  /** Paths backed up and deleted once, when upgrading across this migration */
  remove?: string[];
  /** Only applies to projects created with these options */
  when?: Record<string, boolean>;
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
  status: 'added' | 'modified' | 'unchanged' | 'kept' | 'removed' | 'conflict';
  category: 'safe' | 'protected';
}
