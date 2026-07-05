# CLAUDE.md

This repository contains the Astro version of `blog.makotow.net`.

## Purpose

- Preserve the long-lived blog archive while migrating from Hugo to Astro.
- Keep existing public article URLs in the form `/YYYY/MM/DD/:slug/`.
- Treat the blog as a small production system operated with AI-agent assistance.
- Prefer content correctness, URL stability, RSS continuity, and simple readable design over visual parity with the old Hugo theme.

## Project Layout

- `src/content/posts/YYYY/MM/DD/<slug>.md`: migrated blog posts.
- `src/content/pages/about.md`: About page content.
- `public/_redirects`: Cloudflare Pages redirects generated from Hugo aliases.
- `scripts/migrate-hugo-content.mjs`: converts Hugo posts into Astro content.
- `scripts/verify-migration.mjs`: verifies canonical URLs, redirects, RSS, and sitemap.
- `scripts/review-content.mjs`: prepares human review inventory for migrated posts.
- `scripts/verify-internal-links.mjs`: checks generated internal links in `dist/`.
- `reports/`: generated migration and review reports.

## Required Commands

Run these before treating a migration or content change as complete:

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run review:content
npm run verify:links
```

Notes:

- `npm run verify:migration` checks `dist/`. Run `npm run build` first.
- In sandboxed environments, local HTTP checks may be skipped. File, redirect, RSS, and sitemap checks still run.
- `npm run verify:links` checks generated HTML in `dist/`. Run `npm run build` first.

## Content Rules

- Do not change existing article URLs unless the user explicitly requests it.
- Preserve case-sensitive and dotted slugs such as `Introduction-to-servicemesh-part1`, `19.07`, and `19.04.1`.
- Preserve Hugo `aliases` as Cloudflare Pages 301 redirects.
- Keep English posts mixed into the main archive; do not introduce `/en/` routing unless the user decides to.
- Keep raw HTML embeds if they are part of the migrated content, but verify representative posts manually.
- Use `ogImage` as both OGP metadata and article cover image when a post defines it.
- Posts without `ogImage` use `public/default-og.jpg` for OGP metadata.

## Design Rules

- Base design on AstroPaper.
- Keep the UI content-first, fast, and restrained.
- Do not attempt pixel parity with the old Hugo theme.
- Avoid heavy client-side JavaScript and decorative redesigns.
- Maintain readable Japanese typography: system Japanese font stack, comfortable line height, and stable code block overflow.
- Confirm dark mode and mobile display when changing layout or typography.

## Deployment Assumptions

- Cloudflare Pages is the provisional hosting target.
- `_redirects` is part of the deployment contract and must be present in `dist/`.
- RSS compatibility requires `/index.xml` to redirect to `/rss.xml`.
- Sitemap generation must continue to work.

## Do Not Do

- Do not push directly to the production branch once GitHub/Cloudflare deployment is connected.
- Do not remove redirects for legacy aliases.
- Do not run dependency major upgrades or `npm audit fix --force` without explicit user approval.
- Do not delete generated reports just to make the tree look cleaner.
- Do not touch the old Hugo repository except for read-only comparison or explicitly requested archival tasks.
