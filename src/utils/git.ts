import { execa } from 'execa';

/**
 * Initializes a git repository in the target directory
 */
export async function initGit(targetDir: string): Promise<boolean> {
  try {
    await execa('git', ['init'], { cwd: targetDir });
    await execa('git', ['add', '-A'], { cwd: targetDir });
    await execa('git', ['commit', '-m', 'Initial commit from create-velocity'], {
      cwd: targetDir,
    });
    return true;
  } catch {
    // Git may not be installed or configured
    return false;
  }
}

/**
 * Checks if git is available
 */
export async function isGitInstalled(): Promise<boolean> {
  try {
    await execa('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}
