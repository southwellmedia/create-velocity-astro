<p align="center">
  <img src="https://raw.githubusercontent.com/southwellmedia/velocity/main/src/assets/branding/logo-full.svg" alt="Velocity" width="320" />
</p>

<h1 align="center">create-velocity-astro</h1>

<p align="center">Scaffold and upgrade production-ready <a href="https://github.com/southwellmedia/velocity">Velocity</a> projects in seconds.</p>

Velocity is an opinionated Astro 7 + Tailwind CSS v4 starter kit with 40+ components, i18n support, SEO optimization, and deployment-ready configuration.

## Requirements

- **Generated projects** need **Node.js >= 22.23.4** (Astro 7). Node 24 LTS is recommended; Velocity's `.nvmrc` pins 24.
- **The CLI itself** runs on Node.js >= 20.19.0. If your Node is older than the template requires, `create` warns and `upgrade` stops.
- `create-velocity-astro` 2.x works with **Velocity 2.0 and later**. For older Velocity versions use `create-velocity-astro@1`.

## Quick Start

```bash
# npm
npm create velocity-astro@latest my-site

# pnpm (recommended)
pnpm create velocity-astro my-site

# yarn
yarn create velocity-astro my-site

# bun
bun create velocity-astro my-site
```

## Upgrade an Existing Project

Already have a Velocity project? Upgrade to the latest version:

```bash
# Preview what will change (no files modified)
pnpm create velocity-astro upgrade --dry-run

# Run the upgrade
pnpm create velocity-astro upgrade

# Skip confirmation prompts
pnpm create velocity-astro upgrade --yes

# Upgrade to a specific Velocity release (default: latest release)
pnpm create velocity-astro upgrade --ref v2.1.0
```

The upgrade command will:

1. **Replace framework files** — UI components, layouts, utilities, and config files are updated to the latest version. The fresh download is first put through the same variant pipeline your project was created with (demo / i18n / component selection from `.velocity.json`), so a minimal or i18n project is compared against minimal or i18n files
2. **Update dependencies** — `package.json` is merged with new dependency versions: packages are bumped in whichever section they already live in (`dependencies` or `devDependencies`), new runtime and dev dependencies are added, and your custom fields are preserved
3. **Protect your files** — Pages, content, site config, and customized components are never touched
4. **Show manual migration steps** — Breaking changes are listed with affected files so you know exactly what to update

> Requires a project created with `create-velocity-astro` v1.6.0+ (which writes a `.velocity.json` tracking file).

## CLI Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `upgrade` | command | - | Upgrade an existing Velocity project |
| `--demo` | boolean | prompt | Include demo landing page and sample content |
| `--components` | string | prompt | Component selection (see below) |
| `--i18n` | boolean | prompt | Add internationalization support |
| `--pages [names]` | string | - | Generate starter pages: `--pages` prompts for names, `--pages "Pricing, Team"` uses them |
| `--ref <tag\|branch>` | string | latest release | Velocity tag or branch to scaffold / upgrade from |
| `--template <dir>` | string | - | Use a local Velocity checkout instead of GitHub |
| `--no-install` | boolean | false | Skip installing dependencies |
| `--dry-run` | boolean | false | Preview upgrade changes without applying |
| `-y, --yes` | boolean | false | Skip prompts, use defaults |
| `-h, --help` | - | - | Show help message |
| `-v, --version` | - | - | Show version number |

### Component Selection

The `--components` flag controls which UI components are included:

```bash
# Include all components (default with -y)
--components
--components=all

# Exclude optional components (components core pages need are kept)
--components=none

# Include specific categories
--components=ui
--components=ui,patterns
--components=ui,patterns,hero
```

Only directories Velocity marks as optional (`src/components/ui`, `src/components/patterns`, `src/components/hero`) are ever pruned. Components that core pages import (for example the newsletter form and search input) are always kept, together with their dependencies. With `--demo`, every component is kept, because the demo pages (such as the components showcase) use them all.

**Component Categories:**

| Category | Components | Count |
|----------|------------|-------|
| `ui` | Button, Input, Textarea, Select, Checkbox, Radio, Switch, Card, Badge, Avatar, AvatarGroup, Table, Pagination, Progress, Skeleton, Alert, Toast, Tooltip, Dialog, Dropdown, Tabs, VerticalTabs, Accordion, Separator, Icon, CodeBlock, Logo, CTA, NpmCopyButton, SocialProof, TerminalDemo | 31 |
| `patterns` | ContactForm, NewsletterForm, FormField, SearchInput, PasswordInput, StatCard, EmptyState | 7 |
| `hero` | Hero (flexible hero section) | 1 |

## Component Features

### Header

Flexible navigation header with variant-based configuration:

```astro
<Header
  layout="default"        <!-- default | centered | minimal -->
  position="sticky"       <!-- fixed | sticky | static -->
  size="md"               <!-- sm | md | lg -->
  variant="default"       <!-- default | solid | transparent -->
  colorScheme="default"   <!-- default | invert -->
  showCta={true}
  showThemeToggle={true}
  showLanguageSwitcher={true}  <!-- i18n only -->
/>
```

### Footer

Four layout variants for different site needs:

```astro
<Footer
  layout="simple"         <!-- simple | columns | minimal | stacked -->
  background="default"    <!-- default | secondary | invert -->
  columns={3}             <!-- 2 | 3 | 4 (columns layout only) -->
  showSocial={true}
  showCopyright={true}
  socialLinks={[{ platform: 'github', href: '...' }]}
  legalLinks={[{ label: 'Privacy', href: '/privacy' }]}
/>
```

### Hero

Flexible hero section with multiple layout options:

```astro
<Hero
  layout="single"         <!-- single | split -->
  splitRatio="1:1"        <!-- 1:1 | 1:2 | 2:1 -->
  align="left"            <!-- left | center | right -->
  background="default"    <!-- default | secondary | invert | gradient | image -->
  size="lg"               <!-- sm | md | lg | xl -->
  showGrid={true}
  showBlob={true}
  title="Your Title"
  titleHighlight="Title"  <!-- text to highlight in brand color -->
  description="..."
/>
```

### CTA

Reusable call-to-action section:

```astro
<CTA
  variant="default"       <!-- default | invert -->
  size="lg"               <!-- sm | md | lg | xl -->
  align="center"          <!-- center | left -->
  showLogo={true}
  heading="Ready to start?"
  headingHighlight="start"
  description="Get started in seconds."
  showCopyCommand={true}
/>
```

### Button

Production-ready button with variants:

```astro
<Button
  variant="primary"       <!-- primary | secondary | outline | ghost | destructive -->
  size="md"               <!-- sm | md | lg -->
  colorScheme="default"   <!-- default | invert -->
  fullWidth={false}
  icon={false}
  href="/path"            <!-- renders as <a> when provided -->
/>
```

## Examples

### Minimal Project (fastest)

```bash
npm create velocity-astro@latest my-site -y --demo=false --components=none
```

Creates a clean starter with just layouts, SEO components, and basic pages.

### Full-Featured Project

```bash
npm create velocity-astro@latest my-site --demo --components --i18n
```

Includes everything: demo landing page, all components, and i18n support.

### Production Site Setup

```bash
npm create velocity-astro@latest client-site --demo --components=ui,patterns
```

Demo content to customize, plus UI and form components for building pages.

### i18n Multi-Language Site

```bash
npm create velocity-astro@latest global-site --i18n --demo
```

Enables additional locales and site-copy translations. Locale routing, UI strings, hreflang tags and the language switcher are part of Velocity core; the `i18n` variant switches them on.

### Custom Pages Generation

```bash
npm create velocity-astro@latest my-site --pages
npm create velocity-astro@latest my-site -y --pages "Pricing Plans, Team"
```

For each page (e.g. "Pricing Plans") the CLI creates:

- `src/views/PricingPlansView.astro`: the page content, using `PageLayout` (or `LandingLayout`) and `useTranslations`
- `src/pages/pricing-plans.astro`: the default-locale page
- `src/pages/[lang]/[...pricingPlans].astro`: the page for other locales (generates nothing while only one locale is enabled, so adding locales later just works)
- a `pricingPlans` route and nav item in `src/config/nav.config.ts`
- `pricingPlansPage.title` / `.description` strings in every `src/i18n/translations/*.ts` (English text; translate as needed)

Pages whose route, view or page file already exists are skipped with a warning.

## How It Works

### Architecture

```
User runs CLI
    │
    ▼
Resolves the Velocity version (--ref, --template, or the latest GitHub release)
    │
    ▼
Downloads that Velocity version (via giget) into a staging directory
    │
    ▼
Checks velocity-manifest.json → scaffold (CLI version, Node version)
    │
    ▼
Applies Velocity's variants, component selection and cleanup
    │
    ▼
Copies the result into your project, configures it and installs dependencies
```

**The CLI ships no template files.** Everything a generated project can contain lives in the [Velocity repository](https://github.com/southwellmedia/velocity), and Velocity's CI builds every option combination. The CLI is a small, generic engine that follows the `scaffold` section of Velocity's `velocity-manifest.json`.

### Variants

Velocity declares its variants in `velocity-manifest.json`:

```jsonc
"scaffold": {
  "schemaVersion": 1,
  "minCliVersion": "2.0.0",
  "node": ">=22.23.4",
  "variants": [
    { "id": "i18n",    "when": { "i18n": true },  "overlay": "variants/i18n",    "remove": [] },
    { "id": "demo",    "when": { "demo": true },  "alwaysInclude": ["*"] },
    { "id": "minimal", "when": { "demo": false }, "overlay": "variants/minimal", "remove": ["src/components/landing"] }
  ],
  "components": {
    "optionalDirs": ["src/components/ui", "src/components/patterns", "src/components/hero"],
    "alwaysInclude": ["search-input", "newsletter-form"]
  },
  "cleanup": ["variants"],
  "cleanupScripts": ["test:scaffold"]
}
```

The CLI then:

1. Applies each variant **in order**, but only if every key in `when` equals your choice for that option (`demo`, `i18n`). The variant's `overlay` directory (if any) is copied over the project (overwriting files), then each path in `remove` is deleted, and its `alwaysInclude` ids are added to `components.alwaysInclude`.
2. Prunes components, but only inside `components.optionalDirs`. Components in `alwaysInclude`, and everything they depend on in `component-registry.json`, are always kept. The id `"*"` keeps every component.
3. Deletes every path in `cleanup`, then removes the npm scripts named in `cleanupScripts` from `package.json`.
4. Keeps `pnpm-lock.yaml` (the lockfile Velocity's CI tested) when you choose pnpm, and removes lockfiles that don't match your package manager.

`upgrade` runs steps 1–3 on the fresh download, using the options recorded in `.velocity.json`, before comparing files.

### Choosing a Velocity version

By default the CLI uses the **latest GitHub release** of Velocity. If GitHub can't be reached, it falls back to `main` and tells you. Override this with:

```bash
# A tag or branch
npm create velocity-astro@latest my-site --ref v2.0.0

# A local checkout (node_modules, dist, .git, .astro, .vercel, .netlify,
# test-results and playwright-report are skipped)
npm create velocity-astro@latest my-site --template ../velocity
```

The resolved ref (or local path) and Velocity version are recorded in `.velocity.json`. `upgrade` accepts the same `--ref` and `--template` flags.

If the chosen Velocity version requires a newer CLI, the CLI stops and asks you to run `npm create velocity-astro@latest`. If it predates Velocity 2.0 (no `scaffold` section), the CLI stops and suggests picking a 2.x release with `--ref`.

### Component Registry

Components are managed via `component-registry.json` in Velocity. The registry defines:

- Component files and locations
- Dependencies between components
- Required utilities (like `cn` for class merging)
- Category groupings

When you select categories, the CLI resolves all dependencies automatically, using the registry from the Velocity version being scaffolded.

## Contributing: smoke test

`scripts/smoke.mjs` scaffolds every combination of {demo, no demo} × {i18n, no i18n} × {all components, `--components=none`} from a Velocity checkout, installs with pnpm and runs `astro build`:

```bash
npm run build
node scripts/smoke.mjs --template ../velocity
```

The `Velocity scaffold smoke test` GitHub Actions workflow runs the same script against Velocity `main`, or any ref you pass when running it manually.

## What's Included

Every Velocity project includes:

| Feature | Description |
|---------|-------------|
| **Astro 7** | Latest Astro with native view transitions |
| **Tailwind CSS v4** | Modern utility-first CSS with native cascade layers |
| **TypeScript** | Full type safety throughout |
| **React** | For interactive islands and components |
| **MDX** | Write content with JSX components |
| **SEO** | Meta tags, Open Graph, JSON-LD schemas |
| **Sitemap** | Auto-generated sitemap.xml |
| **RSS Feed** | Built-in RSS support |
| **Dark Mode** | System-aware theme switching |
| **ESLint + Prettier** | Code quality and formatting |
| **Analytics Ready** | GA4 and GTM support via env vars |

### Optional Features

| Feature | Flag | Description |
|---------|------|-------------|
| Demo content | `--demo` | Landing page, sample blog posts, about/contact pages |
| UI Components | `--components` | 40+ production-ready components |
| i18n Support | `--i18n` | Multi-language routing and translations |
| Starter Pages | `--pages` | Generate starter pages (views, routes, nav and translations) |

## Configuration

### Environment Variables

Create a `.env` file to configure analytics and verification:

```env
# Analytics (optional)
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
PUBLIC_GTM_ID=GTM-XXXXXXX

# Site Verification (optional)
GOOGLE_SITE_VERIFICATION=your-verification-code
BING_SITE_VERIFICATION=your-verification-code

# Site URL (required for production)
SITE_URL=https://your-domain.com
```

### Site Configuration

Edit `src/config/site.config.ts` to customize:

```typescript
const siteConfig: SiteConfig = {
  name: 'Your Site Name',
  description: 'Your site description',
  url: 'https://your-domain.com',
  author: 'Your Name',
  email: 'hello@example.com',

  // Branding
  branding: {
    logo: { alt: 'Your Logo' },
    favicon: { svg: '/favicon.svg' },
    colors: {
      themeColor: '#F94C10',
      backgroundColor: '#ffffff',
    },
  },
};
```

### Branding Files

Replace these files with your own branding:

- `public/favicon.svg` - Site favicon
- `src/assets/branding/` - Logo SVG files

## Development

After scaffolding, run:

```bash
cd my-site
npm run dev     # Start dev server at localhost:4321
npm run build   # Build for production
npm run preview # Preview production build
```

## Deployment

Velocity includes ready-to-use configurations for:

- **Vercel** - Zero-config deployment
- **Netlify** - Includes `netlify.toml`
- **Cloudflare Pages** - SSR-ready

## Troubleshooting

### Network Errors

If template download fails:
- Check your internet connection
- Verify GitHub is accessible
- Try again in a few minutes

### Directory Already Exists

The CLI will prompt to overwrite existing directories. Use a new directory name or clear the existing one.

### Permission Errors

On Unix systems, you may need to set execute permissions:

```bash
chmod +x node_modules/.bin/create-velocity-astro
```

### Dependency Installation Fails

If automatic installation fails:

```bash
cd my-site
npm install  # or pnpm install / yarn
```

## Requirements

- **Node.js** 18.0.0 or higher
- **Package Manager**: npm, pnpm, yarn, or bun
- **Git** (optional, for repository initialization)

## Related

- [Velocity](https://github.com/southwellmedia/velocity) - The Astro starter kit
- [Astro](https://astro.build) - The web framework
- [Tailwind CSS](https://tailwindcss.com) - The CSS framework

## License

MIT - [Southwell Media](https://southwellmedia.com)
