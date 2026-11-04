import { describe, it, expect } from 'vitest';
import { summarizeDiffs } from '../../../src/utils/diff.js';
import type { FileDiff } from '../../../src/types.js';

describe('summarizeDiffs', () => {
  it('returns zeros for an empty array', () => {
    expect(summarizeDiffs([])).toEqual({ added: 0, modified: 0, unchanged: 0, conflict: 0 });
  });

  it('counts a single added file', () => {
    const diffs: FileDiff[] = [
      { path: 'new-file.ts', status: 'added', category: 'safe' },
    ];
    expect(summarizeDiffs(diffs)).toEqual({ added: 1, modified: 0, unchanged: 0, conflict: 0 });
  });

  it('counts a single modified file', () => {
    const diffs: FileDiff[] = [
      { path: 'changed.ts', status: 'modified', category: 'safe' },
    ];
    expect(summarizeDiffs(diffs)).toEqual({ added: 0, modified: 1, unchanged: 0, conflict: 0 });
  });

  it('counts a single unchanged file', () => {
    const diffs: FileDiff[] = [
      { path: 'same.ts', status: 'unchanged', category: 'safe' },
    ];
    expect(summarizeDiffs(diffs)).toEqual({ added: 0, modified: 0, unchanged: 1, conflict: 0 });
  });

  it('ignores removed files (not counted in any bucket)', () => {
    const diffs: FileDiff[] = [
      { path: 'deleted.ts', status: 'removed', category: 'safe' },
    ];
    expect(summarizeDiffs(diffs)).toEqual({ added: 0, modified: 0, unchanged: 0, conflict: 0 });
  });

  it('counts a mix of statuses correctly', () => {
    const diffs: FileDiff[] = [
      { path: 'a.ts', status: 'added', category: 'safe' },
      { path: 'b.ts', status: 'added', category: 'safe' },
      { path: 'c.ts', status: 'modified', category: 'protected' },
      { path: 'd.ts', status: 'unchanged', category: 'safe' },
      { path: 'e.ts', status: 'unchanged', category: 'protected' },
      { path: 'f.ts', status: 'unchanged', category: 'safe' },
      { path: 'g.ts', status: 'removed', category: 'safe' },
    ];
    expect(summarizeDiffs(diffs)).toEqual({ added: 2, modified: 1, unchanged: 3, conflict: 0 });
  });

  it('handles all items of the same status', () => {
    const diffs: FileDiff[] = [
      { path: 'a.ts', status: 'modified', category: 'safe' },
      { path: 'b.ts', status: 'modified', category: 'safe' },
      { path: 'c.ts', status: 'modified', category: 'protected' },
    ];
    expect(summarizeDiffs(diffs)).toEqual({ added: 0, modified: 3, unchanged: 0, conflict: 0 });
  });

  it('handles a large number of diffs', () => {
    const diffs: FileDiff[] = [];
    for (let i = 0; i < 100; i++) {
      diffs.push({ path: `added-${i}.ts`, status: 'added', category: 'safe' });
    }
    for (let i = 0; i < 50; i++) {
      diffs.push({ path: `modified-${i}.ts`, status: 'modified', category: 'safe' });
    }
    for (let i = 0; i < 25; i++) {
      diffs.push({ path: `unchanged-${i}.ts`, status: 'unchanged', category: 'safe' });
    }
    expect(summarizeDiffs(diffs)).toEqual({ added: 100, modified: 50, unchanged: 25, conflict: 0 });
  });

  it('works with both safe and protected categories', () => {
    const diffs: FileDiff[] = [
      { path: 'safe-file.ts', status: 'added', category: 'safe' },
      { path: 'protected-file.ts', status: 'added', category: 'protected' },
    ];
    // summarizeDiffs counts by status, not category
    expect(summarizeDiffs(diffs)).toEqual({ added: 2, modified: 0, unchanged: 0, conflict: 0 });
  });
});
