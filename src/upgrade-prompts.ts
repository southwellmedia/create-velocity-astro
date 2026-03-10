import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { FileDiff, MigrationStep, UpgradeManifest } from './types.js';
import { summarizeDiffs } from './utils/diff.js';

/**
 * Shows the upgrade intro with version info.
 */
export function showUpgradeIntro(currentVersion: string, latestVersion: string): void {
  console.log();
  p.intro(pc.bgCyan(pc.black(' Velocity Upgrade ')));
  p.log.info(
    `Current version: ${pc.dim(`v${currentVersion}`)}\n` +
    `Latest version:  ${pc.green(`v${latestVersion}`)}`
  );
}

/**
 * Shows a summary of changes that will be applied.
 */
export function showChangeSummary(
  diffs: FileDiff[],
  manifest: UpgradeManifest
): void {
  const { added, modified, conflict } = summarizeDiffs(diffs);
  const migrationCount = manifest.migrations.length;

  const lines: string[] = [];

  // List conflict files first (most important)
  const conflictFiles = diffs.filter((d) => d.status === 'conflict');
  if (conflictFiles.length > 0) {
    lines.push(pc.bold(pc.yellow('  Conflicts (user-modified files that also changed in template):')));
    for (const f of conflictFiles) {
      lines.push(`    ${pc.yellow('⚠')} ${f.path} ${pc.dim('→ backup created, template version applied')}`);
    }
  }

  // List specific files that will be modified
  const modifiedFiles = diffs.filter((d) => d.status === 'modified');
  const addedFiles = diffs.filter((d) => d.status === 'added');

  if (modifiedFiles.length > 0) {
    lines.push(pc.bold('  Files to update:'));
    for (const f of modifiedFiles) {
      lines.push(`    ${pc.yellow('~')} ${f.path}`);
    }
  }
  if (addedFiles.length > 0) {
    lines.push(pc.bold('  New files:'));
    for (const f of addedFiles) {
      lines.push(`    ${pc.green('+')} ${f.path}`);
    }
  }

  // List specific dependency changes
  const depUpdates = Object.entries(manifest.dependencies.update);
  const depRemoves = manifest.dependencies.remove;
  const depAdds = Object.entries(manifest.dependencies.add);

  if (depUpdates.length > 0 || depRemoves.length > 0 || depAdds.length > 0) {
    lines.push(pc.bold('  Dependency changes:'));
    for (const [name, version] of depUpdates) {
      lines.push(`    ${pc.cyan('~')} ${name} → ${version}`);
    }
    for (const name of depRemoves) {
      lines.push(`    ${pc.red('-')} ${name}`);
    }
    for (const [name, version] of depAdds) {
      lines.push(`    ${pc.green('+')} ${name}@${version}`);
    }
  }

  if (migrationCount > 0) {
    lines.push(`  ${pc.yellow(`${migrationCount}`)} manual migration step${migrationCount !== 1 ? 's' : ''} ${pc.dim('(shown after upgrade)')}`);
  }

  // Summary counts
  const summary = [];
  if (modified > 0) summary.push(`${modified} updated`);
  if (added > 0) summary.push(`${added} added`);
  if (conflict > 0) summary.push(`${pc.yellow(`${conflict} conflicts`)}`);
  summary.push(`${manifest.files.protected.length} protected ${pc.dim('(not touched)')}`);

  lines.push('');
  lines.push(`  ${pc.dim('Totals: ' + summary.join(', '))}`);

  if (lines.length > 0) {
    p.log.message(pc.bold('Changes to apply:') + '\n' + lines.join('\n'));
  }
}

/**
 * Shows a notice about protected files that may need manual attention.
 */
export function showProtectedNotice(manifest: UpgradeManifest): void {
  const protectedFiles = manifest.files.protected;
  if (protectedFiles.length === 0) return;

  const lines = [
    `The following files were ${pc.bold('not modified')} to preserve your customizations:`,
    '',
  ];

  for (const f of protectedFiles) {
    lines.push(`  ${pc.dim('-')} ${f}`);
  }

  lines.push('');
  lines.push(pc.dim('If the upgrade requires changes to these files, they will appear in the manual steps below.'));

  p.log.info(lines.join('\n'));
}

/**
 * Shows a notice about conflict files that were backed up.
 */
export function showConflictNotice(backupDir: string, conflicts: FileDiff[]): void {
  if (conflicts.length === 0) return;

  const lines = [
    pc.yellow(`${conflicts.length} file${conflicts.length !== 1 ? 's were' : ' was'} backed up because you modified ${conflicts.length !== 1 ? 'them' : 'it'}:`),
    '',
  ];

  for (const f of conflicts) {
    lines.push(`  ${pc.yellow('⚠')} ${f.path}`);
  }

  lines.push('');
  lines.push(`Your versions are saved in: ${pc.cyan(backupDir)}`);
  lines.push(pc.dim('Compare your backup against the new version and merge your customizations back in.'));

  p.log.warning(lines.join('\n'));
}

/**
 * Asks user to confirm the upgrade. Returns true to proceed.
 * In dry-run mode, shows what would happen without asking.
 * With --yes flag, skips the interactive prompt.
 */
export async function confirmUpgrade(dryRun: boolean, yes: boolean): Promise<boolean> {
  if (dryRun) {
    p.log.info(pc.dim('Dry run — no changes will be made.'));
    return false;
  }

  if (yes) {
    p.log.info(pc.dim('Proceeding with upgrade (--yes).'));
    return true;
  }

  const proceed = await p.confirm({
    message: 'Proceed with upgrade?',
    initialValue: true,
  });

  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Upgrade cancelled.');
    return false;
  }

  return true;
}

/**
 * Shows manual migration steps with file matches.
 */
export function showManualSteps(
  migrations: MigrationStep[],
  matchResults: Map<string, string[]>
): void {
  if (migrations.length === 0) return;

  const lines: string[] = [];

  for (let i = 0; i < migrations.length; i++) {
    const step = migrations[i]!;
    const matches = matchResults.get(step.title) ?? [];

    lines.push(`${pc.bold(`${i + 1}. ${step.title}`)}`);
    lines.push(`   ${step.description}`);

    if (matches.length > 0) {
      lines.push(`   ${pc.yellow('⚠')} Found matches in: ${matches.join(', ')}`);
    }

    lines.push('');
  }

  p.log.warning(pc.bold('Manual steps required:') + '\n\n' + lines.join('\n'));
}

/**
 * Shows the upgrade completion message.
 */
export function showUpgradeOutro(hasDepChanges: boolean): void {
  if (hasDepChanges) {
    p.log.info(`Run ${pc.cyan('pnpm install')} to update dependencies.`);
  }
  p.outro(pc.green('Upgrade complete! Review the manual steps above.'));
}

/**
 * Warns about dirty git state.
 */
export async function warnDirtyGit(yes: boolean): Promise<boolean> {
  if (yes) {
    p.log.warn(pc.yellow('You have uncommitted changes. Proceeding anyway (--yes).'));
    return true;
  }

  p.log.warn(pc.yellow('You have uncommitted changes. We recommend committing or stashing first.'));

  const proceed = await p.confirm({
    message: 'Continue anyway?',
    initialValue: false,
  });

  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Upgrade cancelled.');
    return false;
  }

  return true;
}
