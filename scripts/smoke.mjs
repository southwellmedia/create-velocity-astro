#!/usr/bin/env node
/**
 * Smoke test: scaffold every option combination from a Velocity checkout,
 * install with pnpm, and run `astro build`.
 *
 *   node scripts/smoke.mjs --template ../velocity [--keep] [--cli dist/index.js] [--only demo-i18n-all]
 *
 * Combinations: {demo, no-demo} × {i18n, no-i18n} × {components all, components=none},
 * plus two `--pages "Pricing Plans"` runs (default options and --i18n) that are
 * also served with `astro preview` and checked over HTTP.
 * Requires a built CLI (`npm run build`) and pnpm on PATH.
 */

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import mri from 'mri';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const args = mri(process.argv.slice(2), {
  string: ['template', 'cli', 'only'],
  boolean: ['keep', 'help'],
  alias: { h: 'help' },
});

if (args.help || !args.template) {
  console.log(
    'Usage: node scripts/smoke.mjs --template <velocity dir> [--cli <path>] [--only <name,...>] [--keep]'
  );
  process.exit(args.help ? 0 : 1);
}

const templateDir = resolve(args.template);
const cliPath = resolve(args.cli ?? join(repoRoot, 'dist', 'index.js'));

if (!existsSync(templateDir)) {
  console.error(`Template directory not found: ${templateDir}`);
  process.exit(1);
}
if (!existsSync(cliPath)) {
  console.error(`CLI not found at ${cliPath}. Run "npm run build" first.`);
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const workDir = mkdtempSync(join(tmpdir(), 'velocity-smoke-'));

const combos = [];
for (const demo of [true, false]) {
  for (const i18n of [true, false]) {
    for (const components of ['all', 'none']) {
      const name = `${demo ? 'demo' : 'nodemo'}-${i18n ? 'i18n' : 'noi18n'}-${components}`;
      combos.push({ name, demo, i18n, components });
    }
  }
}
combos.push(
  { name: 'pages-default', demo: false, i18n: false, components: 'all', pages: 'Pricing Plans', serve: ['/pricing-plans'] },
  {
    name: 'pages-i18n',
    demo: false,
    i18n: true,
    components: 'all',
    pages: 'Pricing Plans',
    serve: ['/pricing-plans', '/es/pricing-plans'],
  }
);

const only = args.only ? new Set(String(args.only).split(',').map((s) => s.trim())) : null;
const selected = only ? combos.filter((c) => only.has(c.name)) : combos;
if (selected.length === 0) {
  console.error(`No combinations match --only ${args.only}. Available: ${combos.map((c) => c.name).join(', ')}`);
  process.exit(1);
}

function run(label, command, commandArgs, cwd, logFile) {
  const started = Date.now();
  // pnpm is a .cmd shim on Windows and needs a shell; node never does. With a
  // shell, pass one command string (pnpm args here contain no spaces).
  const useShell = isWindows && command !== process.execPath;
  const result = spawnSync(useShell ? [command, ...commandArgs].join(' ') : command, useShell ? [] : commandArgs, {
    cwd,
    encoding: 'utf-8',
    shell: useShell,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    maxBuffer: 256 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}${result.error ? `\n${result.error.message}` : ''}`;
  writeFileSync(logFile, `$ ${command} ${commandArgs.join(' ')}\n\n${output}`);
  return {
    ok: result.status === 0,
    label,
    seconds: Math.round((Date.now() - started) / 1000),
    output,
    logFile,
  };
}

/**
 * Starts `astro preview`, fetches each path and checks for a 200 response that
 * contains `expectText`. Always stops the server.
 */
async function serve(projectDir, paths, expectText, logFile, port) {
  const started = Date.now();
  const astroBin = join(projectDir, 'node_modules', 'astro', 'bin', 'astro.mjs');
  const child = spawn(process.execPath, [astroBin,'preview', '--port', String(port), '--host', '127.0.0.1'], {
    cwd: projectDir,
    env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
  });
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));

  const lines = [];
  let ok = true;
  try {
    for (const path of paths) {
      const url = `http://127.0.0.1:${port}${path}`;
      let response = null;
      let body = '';
      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        try {
          response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(5000) });
          body = await response.text();
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 500));
        }
      }
      const pass = Boolean(response && response.status === 200 && body.includes(expectText));
      lines.push(`${pass ? 'OK  ' : 'FAIL'} GET ${path} → ${response ? response.status : 'no response'}${response && !body.includes(expectText) ? ` (missing "${expectText}")` : ''}`);
      if (!pass) ok = false;
    }
  } finally {
    child.kill();
  }
  output = `${lines.join('\n')}\n\n--- astro preview ---\n${output}`;
  writeFileSync(logFile, output);
  for (const line of lines) console.log(`      ${line}`);
  return { ok, label: 'serve', seconds: Math.round((Date.now() - started) / 1000), output, logFile };
}

function tail(text, lines = 40) {
  return text.trim().split(/\r?\n/).slice(-lines).join('\n');
}

console.log(`Template: ${templateDir}`);
console.log(`CLI:      ${cliPath}`);
console.log(`Work dir: ${workDir}`);
console.log(`Running ${selected.length} combination(s)\n`);

const results = [];

for (const combo of selected) {
  const projectDir = join(workDir, combo.name);
  const steps = [];

  const cliArgs = [
    cliPath,
    combo.name,
    '-y',
    '--template',
    templateDir,
    `--components=${combo.components}`,
    '--no-install',
  ];
  if (combo.demo) cliArgs.push('--demo');
  if (combo.i18n) cliArgs.push('--i18n');
  if (combo.pages) cliArgs.push('--pages', combo.pages);

  console.log(`▶ ${combo.name}`);

  const pipeline = [
    ['scaffold', process.execPath, cliArgs, workDir],
    // Mirror what users get: pnpm install with Velocity's lockfile, without
    // CI's implicit --frozen-lockfile.
    ['install', 'pnpm', ['install', '--no-frozen-lockfile'], projectDir],
    ['build', 'pnpm', ['exec', 'astro', 'build'], projectDir],
  ];

  let failed = null;
  for (const [label, command, commandArgs, cwd] of pipeline) {
    if (label !== 'scaffold' && !existsSync(projectDir)) {
      failed = { ok: false, label, seconds: 0, output: 'Project directory was not created', logFile: '-' };
      break;
    }
    const step = run(label, command, commandArgs, cwd, join(workDir, `${combo.name}.${label}.log`));
    steps.push(step);
    console.log(`  ${step.ok ? '✓' : '✗'} ${label} (${step.seconds}s)`);
    if (!step.ok) {
      failed = step;
      break;
    }
  }

  if (!failed && combo.serve) {
    const step = await serve(
      projectDir,
      combo.serve,
      'Pricing Plans',
      join(workDir, `${combo.name}.serve.log`),
      4400 + selected.indexOf(combo)
    );
    console.log(`  ${step.ok ? '✓' : '✗'} serve (${step.seconds}s)`);
    if (!step.ok) failed = step;
  }

  if (failed) {
    console.log(`  --- ${failed.label} output (tail) ---\n${tail(failed.output)}\n  --- full log: ${failed.logFile}`);
  }

  results.push({ name: combo.name, ok: !failed, failedStep: failed?.label });

  if (!args.keep && !failed) {
    try {
      rmSync(projectDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    } catch {
      // Windows can hold a lock briefly after the preview server stops. The OS temp dir clears it.
    }
  }
}

console.log('\nSummary');
console.log('-------');
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  (failed at ${r.failedStep})`}`);
}

const failures = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failures}/${results.length} passed`);

if (!args.keep && failures === 0) {
  rmSync(workDir, { recursive: true, force: true });
} else {
  console.log(`Projects and logs kept in ${workDir}`);
}

if (process.env.GITHUB_STEP_SUMMARY) {
  const rows = results.map((r) => `| ${r.name} | ${r.ok ? '✅ pass' : `❌ fail (${r.failedStep})`} |`);
  writeFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    ['## Velocity scaffold smoke test', '', '| Combination | Result |', '| --- | --- |', ...rows, ''].join('\n'),
    { flag: 'a' }
  );
}

process.exit(failures === 0 ? 0 : 1);
