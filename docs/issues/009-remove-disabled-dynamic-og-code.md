---
id: BLOG-009
title: Remove disabled dynamic OGP code
status: done
priority: P2
depends_on:
  - BLOG-001
---

# Remove disabled dynamic OGP code

## Resolution

The disabled dynamic OGP route, font helper, feature flag, fallback branch, and
Satori dependency were removed. Sharp remains because Astro uses it for local
and remote image processing. Generated metadata confirms that a custom cover
keeps its HTTPS URL and a post without `ogImage` uses
`https://blog.makotow.net/default-og.jpg`.

## Problem

Dynamic OGP generation is disabled in configuration, but the project still contains its route, font helper, Satori dependency, and an experimental Astro assets API. This increases upgrade and supply-chain surface without producing any current site output.

## Required change

1. Confirm that `dynamicOgImage` remains intentionally disabled and that all posts without a custom image use `public/default-og.jpg`.
2. Remove the dynamic OGP route and code paths.
3. Remove `satori` and any helper used only by dynamic OGP generation.
4. Keep `sharp` if it is still required by Astro's local image processing; verify before changing it.
5. Remove the `dynamicOgImage` feature flag if no other code uses it.
6. Update documentation and configuration types.

## Acceptance criteria

- No import of `experimental_getFontFileURL` remains.
- No disabled dynamic OGP route remains.
- Posts with custom `ogImage` still use it for metadata and cover display.
- Posts without `ogImage` use `default-og.jpg`.
- The production dependency list no longer contains packages used only by the removed feature.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run verify:links
npm ls --depth=0
```

Inspect generated metadata for one post with and one post without `ogImage`.

## Non-goals

- Designing a replacement OGP generator.
- Changing the default OGP artwork.
