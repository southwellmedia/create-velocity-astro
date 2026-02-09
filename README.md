<p align="center">
  <img src="https://raw.githubusercontent.com/southwellmedia/velocity/main/public/velocity-lightmode.svg" alt="Velocity" width="320" />
</p>

<h1 align="center">create-velocity-astro</h1>

<p align="center">Scaffold and upgrade production-ready <a href="https://github.com/southwellmedia/velocity">Velocity</a> projects in seconds.</p>

Velocity is an opinionated Astro 6 + Tailwind CSS v4 starter kit with 27+ components, i18n support, SEO optimization, and deployment-ready configuration.

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
```

The upgrade command will:

1. **Replace framework files** — UI components, layouts, utilities, and config files are updated to the latest version
2. **Update dependencies** — `package.json` is merged with new dependency versions (your custom fields are preserved)
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
| `--pages` | boolean | false | Generate starter pages interactively |
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

# Exclude all optional components
--components=none

# Include specific categories
--components=ui
--components=ui,patterns
--components=ui,patterns,hero
```

**Component Categories:**

| Category | Components | Count |
|----------|------------|-------|
| `ui` | Button, Input, Card, Badge, Alert, Dialog, Tabs, Select, Checkbox, Radio, Textarea, Tooltip, Dropdown, Skeleton, Logo, CodeBlock, SocialProof, Avatar, TerminalDemo, VerticalTabs, CTA | 21 |
| `patterns` | ContactForm, NewsletterForm, FormField | 3 |
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

Full i18n support with:
- Locale-prefixed routes (`/en/`, `/es/`, `/fr/`)
- Language switcher component
- Translated navigation and content
- SEO hreflang tags

### Custom Pages Generation

```bash
npm create velocity-astro@latest my-site --pages
```

Interactive prompt to generate starter pages (services, pricing, team, etc.).

## How It Works

### Architecture

```
User runs CLI
    │
    ▼
Downloads FULL Velocity repo from GitHub (via giget)
    │
    ▼
Applies local template overlays (i18n, base)
    │
    ▼
Configures based on CLI options
    │
    ▼
Installs dependencies
```

The CLI downloads the complete [Velocity repository](https://github.com/southwellmedia/velocity) at runtime, then applies configuration overlays based on your selections. This means you always get the latest Velocity features.

### 8-Step Scaffolding Process

1. **Download template** - Fetches Velocity from GitHub via `giget`
2. **Configure components** - Filters to selected component categories
3. **Apply i18n overlay** - Adds internationalization if enabled
4. **Remove demo content** - Strips demo pages if `--demo=false`
5. **Generate pages** - Creates starter pages if requested
6. **Update package.json** - Sets project name and cleans metadata
7. **Initialize git** - Creates git repository with initial commit
8. **Install dependencies** - Runs package manager install

### Template Overlay System

The CLI uses a template overlay approach:

- **Base Velocity**: Downloaded from GitHub (always fresh)
- **i18n overlay**: Adds locale routing, translations, language switcher
- **Base template**: Minimal pages for non-demo projects

Overlays are applied in order, with later files overwriting earlier ones.

### Component Registry

Components are managed via `component-registry.json` in Velocity. The registry defines:

- Component files and locations
- Dependencies between components
- Required utilities (like `cn` for class merging)
- Category groupings

When you select categories, the CLI resolves all dependencies automatically.

## What's Included

Every Velocity project includes:

| Feature | Description |
|---------|-------------|
| **Astro 6** | Latest Astro with View Transitions |
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
| UI Components | `--components` | 27+ production-ready components |
| i18n Support | `--i18n` | Multi-language routing and translations |
| Starter Pages | `--pages` | Generate custom pages interactively |

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
