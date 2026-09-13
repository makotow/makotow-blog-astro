---
id: BLOG-010
title: Upgrade to Astro 7
status: done
priority: P2
depends_on:
  - BLOG-002
  - BLOG-003
  - BLOG-004
  - BLOG-005
  - BLOG-006
  - BLOG-007
  - BLOG-008
  - BLOG-009
---

# Upgrade to Astro 7

## Resolution

Astro and its official integrations were upgraded together to Astro `7.3.2`
and Vite `8.3.0`. The existing `unified()` Markdown pipeline remains in place,
and `compressHTML: true` preserves the Astro 6 whitespace behavior while the
project stays on that processor. Tailwind continues to use the supported
`@tailwindcss/vite` integration. The archive counters now use an explicit CSS
margin instead of source whitespace.

The production build generated 168 pages, 166 optimized images, RSS, the
sitemap index, redirects, and a Pagefind index for 58 pages. Migration checks
passed for 57 canonical article files and 108 redirects, and all 2,962 internal
links passed. Browser checks passed for home, archives, tags, search (including
34 results for `Astro`), an image- and code-heavy WebAssembly article, a recent
Japanese article, an English-title/mixed-content article, navigation, sharing,
and light/dark theme switching.

Lighthouse passed both desktop and mobile profiles over two runs for home,
article, and search. Performance, best practices, and SEO scored `1.00` in all
runs; accessibility scored `1.00`, `0.95`, and `0.96` respectively. GitHub
Actions was not run from this uncommitted working tree, so the next CI run must
confirm the hosted runner. `npm install` reports 22 audit findings (2 low, 4
moderate, 16 high); dependency remediation is intentionally separate from this
framework-only major upgrade.

## Problem

The project uses Astro 6 while the current official documentation targets Astro 7. The major upgrade includes Vite 8, the Rust Astro compiler, new whitespace behavior, and a new default Markdown processor.

This repository uses Vite plugins, remark/rehype plugins, preserved migrated HTML, and Japanese prose, so the upgrade must be isolated and verified visually rather than bundled into unrelated cleanup.

## Required change

1. Read the current official Astro 7 upgrade guide before editing dependencies.
2. Upgrade Astro and official integrations together in one dedicated change.
3. Keep the existing `unified()` Markdown processor initially because the project depends on remark and rehype plugins. Do not migrate to Satteri in the same issue.
4. Review Tailwind's Vite integration against Vite 8.
5. Resolve Rust compiler errors without changing rendered article meaning.
6. Audit inline-element whitespace, especially Japanese/English boundaries, navigation labels, dates, and share links. Add explicit spaces where required.
7. Replace or remove Astro 6 experimental configuration that is no longer valid.
8. Do not perform unrelated dependency major upgrades.

## Acceptance criteria

- `package.json` and lockfile use compatible Astro 7 and official-integration versions.
- No deprecated or removed Astro API used by this repository remains.
- Existing canonical URLs, RSS, sitemap, redirects, article HTML, and image paths remain stable.
- Representative Japanese and English-content pages have no whitespace regression.
- Search, theme, navigation, and code highlighting work in the production build.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run review:content
npm run verify:links
npm run lhci
npm ls --depth=0
```

Perform browser checks for home, archives, tags, search, a representative image-heavy post, a code-heavy post, and a recent Japanese post. Record any check that cannot be run.

## Non-goals

- Migrating from unified to Satteri.
- Redesigning AstroPaper components.
- Adding SSR or the Cloudflare adapter.
- Changing the public URL structure.
