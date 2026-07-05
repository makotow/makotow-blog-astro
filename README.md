# blog.makotow.net

AstroPaper-based rebuild of `blog.makotow.net`, migrated from the legacy Hugo site.

The migration keeps the existing public URL contract:

- Canonical article URLs stay on `/YYYY/MM/DD/:slug/`.
- Legacy `/post/YYYY/MM/DD/:slug/` URLs redirect to canonical article URLs.
- Hugo aliases and `/index.xml` redirect through `public/_redirects` for Cloudflare Pages.
- RSS is generated at `/rss.xml`.

## Stack

- Astro
- AstroPaper
- Tailwind CSS
- Pagefind
- Cloudflare Pages
- GitHub Actions

## Commands

Run commands from this directory.

```bash
npm ci
npm run dev
npm run build
npm run format:check
npm run lint
npm run verify:migration
npm run review:content
npm run verify:links
```

`npm run build` type-checks the Astro project, builds the static site, indexes the generated HTML with Pagefind, and copies the Pagefind assets into `public/pagefind`.

## Deployment

Cloudflare Pages settings:

- Build command: `npm run build`
- Build output directory: `dist`
- Node.js: `26` (`.node-version`)

The project includes `public/_redirects`; Cloudflare Pages should deploy it as `_redirects` in the generated site.

## Quality Gates

The GitHub Actions CI workflow runs:

- `npm ci`
- `npm run format:check`
- `npm run lint`
- `npm run build`
- `npm run verify:migration`
- `npm run review:content`
- `npm run verify:links`

The migration verification checks all 57 migrated Hugo posts, generated canonical files, and 108 redirect rules. Internal link verification checks generated HTML in `dist`.

## Content

Migrated posts live under `src/content/posts/YYYY/MM/DD/:slug.md`.

When editing content:

- Keep existing slugs and dates unless a redirect is intentionally added.
- Keep public article URLs on `/YYYY/MM/DD/:slug/`.
- Prefer local images beside the migrated post when possible.
- Keep per-post `ogImage` values when present; they are used for metadata and the article cover.

See `AGENTS.md` for the operational rules used by coding agents.
