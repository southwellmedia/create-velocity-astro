import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { BRIEF_FILE, BRIEF_TEMPLATE, buildBrief, parseSiteFlags, seedSite, setSiteName, supportsSiteSetup, titleCase } from '../../../src/features/site.js';
import { removeEmptyParents } from '../../../src/upgrade.js';
import { existsSync } from 'node:fs';

const tempDirs: string[] = [];
afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

/** Velocity 2.5's brief template (kept in sync with velocity/variants/agents/.agents/skills/velocity-start-site). */
const TEMPLATE = `# Site brief

Status: draft
<!-- The project's memory. -->

## Business

<!-- What the business is and does. -->

## Audience

<!-- Who the site is for. -->

## Primary action

## Voice

## Brand

<!-- Site name, logo, brand colour. -->

## Design

<!-- What the user said about the look. -->

## Languages

<!-- Enabled locales. -->

## Sitemap

<!-- One line per page. -->

## Facts

## Placeholders

## Assumptions

## Decisions log

<!-- Dated, one line each. -->
`;

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'site-'));
  tempDirs.push(dir);
  for (const [rel, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), text);
  }
  return dir;
}

const section = (brief: string, heading: string) => {
  const start = brief.indexOf(`## ${heading}\n`);
  const end = brief.indexOf('\n## ', start + 1);
  return brief.slice(start, end < 0 ? undefined : end);
};

describe('supportsSiteSetup', () => {
  it('opens for Velocity 2.5 and later, prereleases included', () => {
    expect(supportsSiteSetup('2.5.0')).toBe(true);
    expect(supportsSiteSetup('2.5.0-beta.1')).toBe(true);
    expect(supportsSiteSetup('2.6.1')).toBe(true);
    expect(supportsSiteSetup('3.0.0')).toBe(true);
  });

  it('stays closed for older or unknown templates, which get the previous flow', () => {
    expect(supportsSiteSetup('2.4.1')).toBe(false);
    expect(supportsSiteSetup('2.4.9-rc.1')).toBe(false);
    expect(supportsSiteSetup(null)).toBe(false);
    expect(supportsSiteSetup('not-a-version')).toBe(false);
  });
});

describe('parseSiteFlags', () => {
  it('reads every site flag', () => {
    const { options, error, ignored } = parseSiteFlags({ start: 'own', name: " Rosa's Bakery ", describe: 'Neighbourhood bakery in Leith' });
    expect(error).toBeUndefined();
    expect(ignored).toEqual([]);
    expect(options).toEqual({ start: 'own', name: "Rosa's Bakery", describe: 'Neighbourhood bakery in Leith' });
  });

  it('keeps --demo as an alias for --start demo, with --start winning', () => {
    expect(parseSiteFlags({ demo: true }).options.start).toBe('demo');
    expect(parseSiteFlags({ demo: true, start: 'blank' }).options.start).toBe('blank');
    expect(parseSiteFlags({}).options.start).toBeUndefined();
  });

  it('names a bad --start', () => {
    expect(parseSiteFlags({ start: 'shop' }).error).toMatch(/--start must be one of own, demo, blank/);
  });

  it('accepts but ignores CLI 2.2 design flags, so old commands still run', () => {
    const { options, error, ignored } = parseSiteFlags({ direction: 'warm-local', brand: '#c2410c' });
    expect(error).toBeUndefined();
    expect(ignored).toEqual(['--direction', '--brand']);
    expect(options).toEqual({});
  });
});

describe('helpers', () => {
  it('title-cases project names', () => {
    expect(titleCase('rosas-bakery')).toBe('Rosas Bakery');
    expect(titleCase('my_velocity site')).toBe('My Velocity Site');
  });

  it('sets the site name, quoting it safely', () => {
    const config = "export const siteConfig = {\n  name: 'My Site',\n  description: 'x',\n};\n";
    expect(setSiteName(config, "Rosa's Bakery")).toContain(`name: "Rosa's Bakery",`);
    expect(setSiteName("name: 'Already Named'", 'X')).toBe("name: 'Already Named'");
  });
});

describe('buildBrief', () => {
  const base = { start: 'own' as const, locales: ['en', 'es'], pages: [] as string[] };

  it('marks the brief as seeded and writes only what the user typed', () => {
    const brief = buildBrief(TEMPLATE, { ...base, name: "Rosa's Bakery", describe: 'Neighbourhood bakery in Leith', pages: ['Menu', 'Visit Us'] });
    expect(brief).toMatch(/^Status: seeded by CLI$/m);
    expect(section(brief, 'Business')).toContain('Neighbourhood bakery in Leith');
    expect(section(brief, 'Brand')).toContain("- Site name: Rosa's Bakery");
    expect(section(brief, 'Languages')).toContain('- en (default)\n- es');
    expect(section(brief, 'Sitemap')).toContain('- Menu → planned');
    expect(section(brief, 'Decisions log')).toMatch(/project created with create-velocity-astro\./);
    // Nothing invented: unanswered headings keep their guidance for the agent.
    expect(section(brief, 'Audience')).toBe('## Audience\n\n<!-- Who the site is for. -->\n');
    expect(section(brief, 'Design')).toBe('## Design\n\n<!-- What the user said about the look. -->\n');
  });

  it('keeps every heading in order', () => {
    const headings = (text: string) => [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings(buildBrief(TEMPLATE, { ...base, describe: 'x', name: 'y', pages: ['A'] }))).toEqual(headings(TEMPLATE));
  });
});

describe('seedSite', () => {
  it('writes the brief, site name and README title into a 2.5 project', () => {
    const dir = project({
      [BRIEF_TEMPLATE]: TEMPLATE,
      'src/config/site.config.ts': "const siteConfig = {\n  name: 'My Site',\n};\n",
      'README.md': '# My Site\n\nBuilt with Velocity.\n',
    });
    expect(seedSite(dir, { start: 'own', name: 'Rosa', locales: ['en'], pages: [] })).toBe(true);
    expect(readFileSync(join(dir, BRIEF_FILE), 'utf-8')).toMatch(/Status: seeded by CLI/);
    expect(readFileSync(join(dir, 'src/config/site.config.ts'), 'utf-8')).toContain('name: "Rosa"');
    expect(readFileSync(join(dir, 'README.md'), 'utf-8')).toMatch(/^# Rosa$/m);
  });

  it('does nothing for a template without the brief (before 2.5)', () => {
    const dir = project({ 'src/config/site.config.ts': "name: 'My Site'" });
    expect(seedSite(dir, { start: 'own', name: 'Rosa', locales: ['en'], pages: [] })).toBe(false);
    expect(readFileSync(join(dir, 'src/config/site.config.ts'), 'utf-8')).toBe("name: 'My Site'");
  });
});

describe('removeEmptyParents', () => {
  it('deletes folders that removed files leave empty, and nothing else', () => {
    const dir = project({ '.agents/design/sections/x.astro': '', '.agents/skills/a/SKILL.md': 'keep' });
    rmSync(join(dir, '.agents/design/sections/x.astro'));
    removeEmptyParents(dir, ['.agents/design/sections/x.astro']);
    expect(existsSync(join(dir, '.agents/design'))).toBe(false);
    expect(existsSync(join(dir, '.agents/skills/a/SKILL.md'))).toBe(true);
  });
});
