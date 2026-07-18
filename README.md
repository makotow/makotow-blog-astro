# blog.makotow.net

AstroPaper-based rebuild of `blog.makotow.net`, migrated from the legacy Hugo site.

The migration keeps the existing public URL contract:

- Canonical article URLs stay on `/YYYY/MM/DD/:slug/`.
- Legacy `/post/YYYY/MM/DD/:slug/` URLs redirect to canonical article URLs.
- Hugo aliases and `/index.xml` redirect through `public/_redirects` for Cloudflare Static Assets.
- RSS is generated at `/rss.xml`.

## Stack

- Astro
- AstroPaper
- Tailwind CSS
- Pagefind
- Cloudflare Workers Static Assets
- GitHub Actions

## Commands

Run commands from this directory.

```bash
npm ci
npm run dev
npm run build
npm run deploy
npm run format:check
npm run lint
npm run verify:migration
npm run review:content
npm run verify:links
npm run lhci
```

`npm run build` type-checks the Astro project, builds the static site, indexes the generated HTML with Pagefind, and copies the Pagefind assets into `public/pagefind`.
`npm run lhci` runs Lighthouse CI against the generated `dist` site and writes local reports to `reports/lighthouse`.

## Deployment

Cloudflare Workers Builds settings:

- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Node.js: `26` (`.node-version`)

Static assets are configured in `wrangler.jsonc` with `assets.directory` set to `./dist`.
The deploy script runs `wrangler deploy --no-autoconfig` so Wrangler does not try to add the Astro Cloudflare adapter.

The project includes `public/_redirects`; the Astro build copies it to `dist/_redirects` and Cloudflare Static Assets should apply those redirect rules.

### Google Analytics 4

Production builds enable Google Analytics when a GA4 measurement ID is provided:

```text
PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Set this as a build-time environment variable in Cloudflare Workers Builds. The
tag is omitted from development builds and from any build where the variable is
unset, including pull-request previews unless the variable is made available to
them.

The site uses Astro's `ClientRouter`. Keep **Enhanced measurement > Page views >
Page changes based on browser history events** enabled in the GA4 web data
stream. Do not add a separate `astro:page-load` page-view event unless automatic
history tracking is disabled, or page views will be counted twice.

## Quality Gates

The GitHub Actions CI workflow runs:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm run verify:migration`
- `npm run review:content`
- `npm run verify:links`
- `npm run lhci` in a separate non-blocking Lighthouse CI job

The migration verification checks all 57 migrated Hugo posts, generated canonical files, and 108 redirect rules. Internal link verification checks generated HTML in `dist`.
Lighthouse reports are uploaded as a GitHub Actions artifact; score assertions are warnings during the initial rollout.

## Content

Migrated posts live under `src/content/posts/YYYY/MM/DD/:slug.md`.

When editing content:

- Keep existing slugs and dates unless a redirect is intentionally added.
- Keep public article URLs on `/YYYY/MM/DD/:slug/`.
- Prefer local images beside the migrated post when possible.
- Keep per-post `ogImage` values when present; they are used for metadata and the article cover.

See `AGENTS.md` for the operational rules used by coding agents.
