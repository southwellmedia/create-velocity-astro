import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import {
  BRIEF_FILE,
  BRIEF_TEMPLATE,
  buildBrief,
  directionFontPackages,
  isDirection,
  normalizeHex,
  parseSiteFlags,
  seedSite,
  setSiteName,
  supportsSiteSetup,
  titleCase,
} from '../../../src/features/site.js';

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

- Direction:
- Why:
- Brand colour:
- Fonts:
- Radius and density:
- Imagery:
- Section rhythm:
  - Home:

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
    const { options, error } = parseSiteFlags({
      start: 'own',
      name: " Rosa's Bakery ",
      describe: 'Neighbourhood bakery in Leith',
      direction: 'warm-local',
      brand: 'C2410C',
    });
    expect(error).toBeUndefined();
    expect(options).toEqual({ start: 'own', name: "Rosa's Bakery", describe: 'Neighbourhood bakery in Leith', direction: 'warm-local', brand: '#c2410c' });
  });

  it('keeps --demo as an alias for --start demo, with --start winning', () => {
    expect(parseSiteFlags({ demo: true }).options.start).toBe('demo');
    expect(parseSiteFlags({ demo: true, start: 'blank' }).options.start).toBe('blank');
    expect(parseSiteFlags({}).options.start).toBeUndefined();
  });

  it('names the bad flag', () => {
    expect(parseSiteFlags({ start: 'shop' }).error).toMatch(/--start must be one of own, demo, blank/);
    expect(parseSiteFlags({ direction: 'brutalist' }).error).toMatch(/--direction must be one of editorial,.*or auto/);
    expect(parseSiteFlags({ brand: 'orange' }).error).toMatch(/--brand must be a hex colour/);
  });
});

describe('helpers', () => {
  it('normalizes hex colours', () => {
    expect(normalizeHex('#C41')).toBe('#cc4411');
    expect(normalizeHex('c2410c')).toBe('#c2410c');
    expect(normalizeHex('#c2410')).toBeUndefined();
    expect(normalizeHex(undefined)).toBeUndefined();
  });

  it('title-cases project names', () => {
    expect(titleCase('rosas-bakery')).toBe('Rosas Bakery');
    expect(titleCase('my_velocity site')).toBe('My Velocity Site');
  });

  it('knows the five directions and auto', () => {
    for (const id of ['editorial', 'warm-local', 'clinical', 'bold-product', 'minimal-portfolio', 'auto']) expect(isDirection(id)).toBe(true);
    expect(isDirection('default')).toBe(false);
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
    const brief = buildBrief(TEMPLATE, {
      ...base,
      name: "Rosa's Bakery",
      describe: 'Neighbourhood bakery in Leith',
      direction: 'warm-local',
      brand: '#c2410c',
      fonts: ['Nunito'],
      pages: ['Menu', 'Visit Us'],
    });
    expect(brief).toMatch(/^Status: seeded by CLI$/m);
    expect(section(brief, 'Business')).toContain('Neighbourhood bakery in Leith');
    expect(section(brief, 'Brand')).toContain("- Site name: Rosa's Bakery\n- Brand colour: #c2410c");
    const design = section(brief, 'Design');
    expect(design).toContain('- Direction: warm-local');
    expect(design).toContain('- Brand colour: #c2410c');
    expect(design).toContain('- Fonts: Nunito');
    expect(design).toContain('- Imagery:\n');
    expect(section(brief, 'Languages')).toContain('- en (default)\n- es');
    expect(section(brief, 'Sitemap')).toContain('- Menu → (sections to plan) → planned');
    // Nothing invented: unanswered headings keep their guidance for the agent.
    expect(section(brief, 'Audience')).toBe('## Audience\n\n<!-- Who the site is for. -->\n');
    expect(section(brief, 'Facts')).toBe('## Facts\n');
  });

  it('leaves the direction to the agent on auto, and records a pending command', () => {
    const auto = buildBrief(TEMPLATE, { ...base, direction: 'auto' });
    expect(section(auto, 'Design')).toContain('- Direction: agent to choose');
    expect(section(auto, 'Business')).toBe('## Business\n\n<!-- What the business is and does. -->\n');
    const pending = buildBrief(TEMPLATE, { ...base, direction: 'clinical', pendingCommand: 'npm run design -- direction --base clinical' });
    expect(section(pending, 'Decisions log')).toContain('Direction not applied yet: run `npm run design -- direction --base clinical`.');
  });

  it('keeps every heading in order', () => {
    const headings = (text: string) => [...text.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(headings(buildBrief(TEMPLATE, { ...base, describe: 'x', name: 'y', brand: '#000000', direction: 'editorial', pages: ['A'] }))).toEqual(headings(TEMPLATE));
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

describe('directionFontPackages', () => {
  it("reads a direction's fonts from the template, with the design script's package names", () => {
    const dir = project({
      '.agents/design/directions/editorial.json': JSON.stringify({ fonts: { display: { family: 'Fraunces' }, body: { family: 'Source Sans 3' } } }),
      '.agents/design/directions/warm-local.json': JSON.stringify({ fonts: { display: { family: 'Nunito' }, body: { family: 'Nunito' } } }),
    });
    expect(directionFontPackages(dir, 'editorial')).toEqual({
      families: ['Source Sans 3', 'Fraunces'],
      packages: ['@fontsource-variable/source-sans-3', '@fontsource-variable/fraunces'],
    });
    expect(directionFontPackages(dir, 'warm-local').packages).toEqual(['@fontsource-variable/nunito']);
    expect(directionFontPackages(dir, 'clinical')).toEqual({ families: [], packages: [] });
  });
});
