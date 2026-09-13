---
id: BLOG-002
title: Enforce the article URL path contract
status: done
priority: P0
depends_on:
  - BLOG-001
---

# Enforce the article URL path contract

## Resolution

The two September drafts now live under `2026/09/13/`. Source validation checks path shape, calendar validity, lexical frontmatter date agreement, and duplicate canonical paths for drafts and published posts. Six focused tests cover the contract.

## Problem

The repository contract requires `src/content/posts/YYYY/MM/DD/<slug>.md` and public URLs in the form `/YYYY/MM/DD/:slug/`. Two current drafts are stored directly under `src/content/posts/2026/09/`, so removing `draft: true` would generate the wrong URL.

The current migration verifier derives a URL from the path but does not reject malformed path depth or a mismatch between the path date and `pubDatetime`.

## Required change

1. Move both 2026-09-13 drafts into `src/content/posts/2026/09/13/` without changing their filenames or bodies.
2. Extend `scripts/verify-migration.mjs`, or add a focused script called from `verify:migration`, to reject:
   - paths not matching `YYYY/MM/DD/<slug>.md` or `.mdx`;
   - invalid calendar dates;
   - a path date that differs from the lexical date written in `pubDatetime`;
   - duplicate generated canonical paths.
3. Keep draft posts excluded from generated-page existence checks while still validating their source path and metadata.
4. Add fixtures or unit-level assertions for valid paths, missing day segments, invalid dates, date mismatches, and duplicate canonical paths.

`timezone` remains display metadata. Do not convert historical timestamps before comparing path dates because that would shift existing Hugo URL contracts across a day boundary.

## Acceptance criteria

- The two September drafts are located under `2026/09/13/`.
- Their existing cross-link to `/2026/09/13/harness-engineering/` remains correct.
- Invalid source layouts fail verification with the offending path in the message.
- Existing case-sensitive and dotted slugs remain unchanged.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run verify:links
```

## Non-goals

- Changing the `/YYYY/MM/DD/:slug/` contract.
- Adding locale prefixes.
- Publishing either draft.
