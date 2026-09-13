---
id: BLOG-008
title: Make Pagefind generation one-way
status: done
priority: P2
depends_on:
  - BLOG-001
---

# Make Pagefind generation one-way

## Resolution

The production build now writes Pagefind output only to `dist/pagefind`; it no
longer copies generated assets into `public/`. Development displays an explicit
message and does not load a possibly stale index, while the README directs local
search checks to a fresh build served by `astro preview`. `git status --short`
was unchanged across the build and `dist/pagefind/pagefind.js` was generated.

## Problem

The build creates `dist/pagefind` and then copies it back into `public/pagefind`. This makes a generated output part of the next build's input, mutates the source tree during a build, and can expose stale search data during development.

## Required change

1. Make the production build one-way: source files to `dist`, followed by Pagefind indexing inside `dist` only.
2. Remove the `cp -r dist/pagefind public/` step from the production build.
3. Keep `public/pagefind` ignored and remove any documentation that describes it as a normal production-build output.
4. For local search verification, use the built site through `astro preview`, Lighthouse's static server, or a clearly named development-only preparation command.
5. Ensure a clean checkout can build and produce a working `dist/pagefind` directory.

## Acceptance criteria

- `npm run build` does not modify `public/`.
- `dist/pagefind` is generated from the HTML produced by the same build.
- Search works when serving `dist`.
- Development mode clearly states when no fresh search index is available.

## Verification

```sh
git status --short
npm run build
git status --short
npm run verify:links
npm run lhci
```

Compare status before and after the build and confirm that no tracked or source input changed.

## Non-goals

- Replacing Pagefind.
- Adding a hosted search provider.
