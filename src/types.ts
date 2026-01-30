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
