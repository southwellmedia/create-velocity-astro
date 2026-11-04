#!/usr/bin/env node
/**
 * Upgrade test: create real projects with the last 1.x CLI, upgrade them with
 * this CLI, then install, type check and build.
 *
 *   node scripts/upgrade-smoke.mjs --template ../velocity [--only demo] [--keep]
 *
 * Requires a built CLI (`npm run build`), pnpm on PATH and network access.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mri from 'mri';

const OLD_CLI = 'create-velocity-astro@1.8.1';
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = mri(process.argv.slice(2), { string: ['template', 'only'], boolean: ['keep'] });

if (!args.template) {
  console.log('Usage: node scripts/upgrade-smoke.mjs --template <velocity dir> [--only <name>] [--keep]');
  process.exit(1);
}

const template = resolve(args.template);
const cli = join(repoRoot, 'dist', 'index.js');
const workDir = mkdtempSync(join(tmpdir(), 'velocity-upgrade-'));
const astro = join('node_modules', 'astro', 'bin', 'astro.mjs');

const shapes = [
  { name: 'demo', flags: ['--demo', '--components'] },
  { name: 'minimal', flags: ['--components'] },
  { name: 'demo-i18n', flags: ['--demo', '--components', '--i18n'] },
].filter((s) => !args.only || s.name.includes(args.only));

function run(cmd, list, cwd, env = {}) {
  const r = spawnSync(cmd, list, {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, CI: 'true', ...env },
  });
  return { ok: r.status === 0, output: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

const results = [];
for (const { name, flags } of shapes) {
  const dir = join(workDir, name);
  console.log(`\n▶ ${name}`);
  const steps = [
    ['create with 1.x', () => run('npx', ['--yes', OLD_CLI, name, '--yes', ...flags], workDir, { npm_config_user_agent: 'pnpm/10' })],
    ['commit', () => run('git', ['-c', 'user.name=ci', '-c', 'user.email=ci@example.com', 'add', '-A'], dir)],
    ['upgrade', () => run(process.execPath, [cli, 'upgrade', '--yes', '--template', template], dir)],
    ['install', () => run('pnpm', ['install', '--no-frozen-lockfile', '--prefer-offline'], dir)],
    ['check', () => run(process.execPath, [astro, 'check'], dir)],
    ['build', () => run(process.execPath, [astro, 'build'], dir, { DEPLOY_TARGET: 'node' })],
  ];

  let ok = true;
  for (const [label, exec] of steps) {
    const r = exec();
    console.log(`  ${r.ok ? '✓' : '✗'} ${label}`);
    if (!r.ok) {
      console.log(r.output.split('\n').slice(-40).join('\n'));
      ok = false;
      break;
    }
  }
  results.push({ name, ok });
}

if (!args.keep) rmSync(workDir, { recursive: true, force: true });
else console.log(`\nKept: ${workDir}`);

console.log('\nSummary');
for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.name}`);
process.exit(results.every((r) => r.ok) ? 0 : 1);
