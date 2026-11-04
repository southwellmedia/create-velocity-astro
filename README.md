<p align="center">
  <img src="https://raw.githubusercontent.com/southwellmedia/velocity/main/src/assets/branding/logo-full.svg" alt="Velocity" width="320" />
</p>

<h1 align="center">create-velocity-astro</h1>

<p align="center">Create and upgrade <a href="https://github.com/southwellmedia/velocity">Velocity</a> projects: a production-ready Astro 7 and Tailwind CSS v4 starter kit.</p>

<p align="center">
  <a href="https://docs.deployvelocity.com">Documentation</a> ·
  <a href="https://www.deployvelocity.com">Website</a> ·
  <a href="https://demo.deployvelocity.com">Demo</a>
</p>

## Quick Start

```bash
# pnpm (recommended)
pnpm create velocity-astro@latest my-site

# npm
npm create velocity-astro@latest my-site

# yarn
yarn create velocity-astro my-site

# bun
bun create velocity-astro my-site
```

The wizard asks what to include. With npm, put `--` before any flags so they reach the CLI:

```bash
npm create velocity-astro@latest my-site -- --demo --i18n
```

## Requirements

- **Generated projects:** Node.js 22.23.4 or later. Node 24 LTS is recommended.
- **The CLI:** Node.js 20.19.0 or later.
- **Package manager:** npm, pnpm, yarn or bun. Git is optional.

CLI 2.x works with Velocity 2.0 and later. The 1.x CLI is deprecated and no longer creates working projects, so upgrade any older project with the command below.

## What You Get

| Feature | Description |
|---------|-------------|
| **Astro 7 and Tailwind CSS v4** | With TypeScript, React islands and MDX |
| **58 components** | Accessible, typed and dark-mode ready |
| **Working forms** | Contact and newsletter forms on Astro Actions |
| **Deployment** | Adapter detected for Vercel and Netlify, Node everywhere else, Cloudflare opt-in |
| **Strict CSP** | Hash-based Content Security Policy on by default |
| **Site search** | Pagefind, with no external service |
| **SEO** | Meta tags, Open Graph images, JSON-LD, sitemap and RSS |
| **Languages** | Add one by listing it in `src/i18n/locales.mjs` |
| **Tests** | Vitest, plus Playwright with axe accessibility checks |
| **Analytics and consent** | GA4 and GTM through environment variables, with a consent banner |

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--demo` | prompt | Include the demo landing, About and Contact pages, component showcase and sample content |
| `--components` | prompt | Which components to include (see below) |
| `--i18n` | prompt | Enable Spanish and French alongside English |
| `--pages [names]` | - | Generate starter pages: `--pages "Pricing, Team"`, or `--pages` to be asked |
| `--ref <tag\|branch>` | latest release | Velocity version to use |
| `--template <dir>` | - | Use a local Velocity checkout |
| `--no-install` | - | Skip installing dependencies |
| `-y, --yes` | - | Skip prompts: a minimal project with all components, using the package manager you ran the CLI with |
| `-h, --help` | - | Show help |
| `-v, --version` | - | Show the version |

### Components

```bash
--components                # all components
--components=none           # only what core pages need
--components=ui,patterns    # specific categories: ui, patterns, hero
```

Demo projects always keep every component, because the demo pages use them. Components that core pages need are always kept, along with everything they depend on.

### Examples

```bash
# Minimal starter
pnpm create velocity-astro@latest my-site -y --components=none

# Everything
pnpm create velocity-astro@latest my-site --demo --components --i18n

# With starter pages
pnpm create velocity-astro@latest my-site -y --pages "Pricing Plans, Team"

# A specific Velocity version
pnpm create velocity-astro@latest my-site --ref v2.0.0
```

Each page from `--pages` gets a view, a route in every language, a nav item and translation strings.

## Upgrade an Existing Project

Commit your work, then run this from your project:

```bash
# Preview the changes
pnpm create velocity-astro@latest upgrade --dry-run

# Upgrade
pnpm create velocity-astro@latest upgrade
pnpm install
```

`upgrade` also accepts `--yes`, `--ref` and `--template`. It:

1. **Updates Velocity's files**, such as components, layouts and utilities. If you edited one, your version is saved to `.velocity-backup/` first.
2. **Updates dependencies** and `package.json` scripts, keeping scripts you customized.
3. **Leaves your files alone**, including your pages, content and site config. A release can add new files alongside them.
4. **Lists manual steps**, with the files each one affects.

Breaking releases can replace or remove specific files once, because the old version can't work with the new one. `--dry-run` lists them, and your versions are saved to `.velocity-backup/`.

Upgrading from 1.x? Follow the [v1 to v2 guide](https://docs.deployvelocity.com/upgrade-guides/v1-to-v2/). Projects need a `.velocity.json` file, which CLI 1.6.0 and later create.

## How It Works

The CLI ships no template files. It downloads a Velocity release from GitHub and applies the `scaffold` section of that release's `velocity-manifest.json`, so a project always matches the version it came from. Velocity's CI builds every project shape the CLI can create.

The format is documented in [`variants/README.md`](https://github.com/southwellmedia/velocity/blob/main/variants/README.md).

If GitHub's release API can't be reached, the CLI falls back to Velocity's `main` branch and tells you.

## After Creating a Project

```bash
cd my-site
pnpm dev        # Start the dev server at localhost:4321
pnpm build      # Build for production
pnpm validate   # Lint, type check, test and build
```

Then set your details in `src/config/site.config.ts`, add `SITE_URL` to `.env` (see `.env.example`), and replace the logos in `src/assets/branding/`. The [documentation](https://docs.deployvelocity.com) covers the rest.

## Troubleshooting

- **Download fails:** check your connection and that GitHub is reachable, then try again.
- **Directory already exists:** the wizard asks before overwriting. `--yes` stops instead, so use a new name.
- **Flags are ignored with npm:** add `--` before them.
- **Installation fails:** the project is still created. Run your package manager's install command in it.
- **"requires a newer CLI":** use `@latest`, as in the commands above.

See the [CLI troubleshooting guide](https://docs.deployvelocity.com/cli/troubleshooting/) for more.

## Contributing

```bash
npm ci
npx vitest run
npm run build

# Scaffold, install and build every option combination
node scripts/smoke.mjs --template ../velocity

# Upgrade real projects made with the 1.x CLI
node scripts/upgrade-smoke.mjs --template ../velocity
```

Both scripts need pnpm. CI runs them against Velocity `main`.

### Releasing

Bump `version` in `package.json` and merge to `main`, then push a matching tag. The `Publish to npm` workflow tests and publishes it:

```bash
git tag v2.1.0
git push origin v2.1.0
```

## License

MIT - [Southwell Media](https://southwellmedia.com)
