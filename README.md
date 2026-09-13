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

`npm run build` type-checks the Astro project, builds the static site, and then
indexes that generated HTML into `dist/pagefind`. It does not write generated
search assets back into `public/`. Verify search with `npm run preview` after a
fresh build; the development server deliberately does not load a stale index.
`npm run lhci` runs two Lighthouse samples for each representative home,
article, and search URL in both desktop and mobile profiles. Assertions use the
median run and fail below `0.90` for performance, accessibility, best practices,
or SEO. Reports are written under `reports/lighthouse/{desktop,mobile}`.

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

The site uses standard full-document navigation. GA4 initializes once per page
load; do not add a separate client-side navigation page-view event.

## Quality Gates

The GitHub Actions CI workflow runs:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm run verify:migration`
- `npm run review:content`
- `npm run verify:links`
- `npm run lhci` in a separate blocking Lighthouse CI job

The migration verification checks all 57 migrated Hugo posts, generated canonical files, and 108 redirect rules. Internal link verification checks generated HTML in `dist`.
Lighthouse reports are uploaded as a GitHub Actions artifact even when an
assertion fails. Local Chrome and GitHub Actions can produce slightly different
timings; two samples and median-run aggregation reduce this variance without
weakening the `0.90` thresholds.

## Content

Migrated posts live under `src/content/posts/YYYY/MM/DD/:slug.md`.

When editing content:

- Keep existing slugs and dates unless a redirect is intentionally added.
- Keep public article URLs on `/YYYY/MM/DD/:slug/`.
- Production includes a non-draft post only when the build time is at or after
  its `pubDatetime`. Because the site is static, a rebuild and deployment after
  that instant is required to publish it. Development includes valid drafts and
  future posts for author preview.
- Prefer local images beside the migrated post when possible.
- Keep per-post `ogImage` values when present; they are used for metadata and the article cover.

See `AGENTS.md` for the operational rules used by coding agents.

Repository-local implementation tasks are tracked in
[`docs/issues/`](docs/issues/README.md). Each issue is scoped so a coding agent
can implement and verify it independently.
