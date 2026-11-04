import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  clean: true,
  dts: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  shims: true,
  banner: {
    js: '#!/usr/bin/env node',
  },
  define: {
    CLI_VERSION: JSON.stringify(version),
  },
});
