---
id: BLOG-006
title: Remove remote cover-image layout instability
status: done
priority: P2
depends_on:
  - BLOG-001
---

# Remove remote cover-image layout instability

## Resolution

The inventory found two remote covers, both using the same WebAssembly logo on
GitHub, plus four remote Markdown images hosted by Google. The Markdown images
remain article content and are outside this cover-only change. The two covers
remain remote because redistribution rights were not established; their source
now points directly at the raw GitHub asset, and Astro fetches it through one
exact HTTPS host-and-path pattern, emits optimized local build assets, and
writes intrinsic dimensions.
Local covers continue through the same `Image` component. Both cover variants
use `priority`. A blocked network produces Astro's explicit
`FailedToFetchRemoteImageDimensions` error instead of silently substituting an
image.

## Problem

Local cover images use Astro's `Image` component, but string-valued remote covers use a raw `<img>` without intrinsic width or height. This can cause layout shift and leaves long-lived articles dependent on third-party URLs.

## Required change

1. Inventory every remote `ogImage` and remote Markdown image.
2. For cover images, prefer copying an image into the article directory only when its licensing and provenance allow repository storage. Preserve attribution where required.
3. For covers that must remain remote, render them through Astro's `Image` component with an explicit authorized `image.remotePatterns` entry and intrinsic dimensions or `inferSize`.
4. Use the `priority` option for an above-the-fold cover instead of manually combining eager loading attributes, if supported by the installed Astro version at implementation time.
5. Ensure a remote fetch failure has an understandable build error or documented fallback; do not silently replace article-specific images.

## Acceptance criteria

- Every rendered cover image has width and height.
- Authorized remote patterns are host- and protocol-specific rather than globally permissive.
- Local article images remain processed by Astro.
- OGP metadata and visible covers continue to reference the intended image.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run review:content
npm run verify:links
npm run lhci
```

Inspect one local cover and every remaining remote cover in the generated HTML.

## Non-goals

- Recompressing the entire historical image archive.
- Downloading assets without confirming redistribution rights.
- Changing article prose.
