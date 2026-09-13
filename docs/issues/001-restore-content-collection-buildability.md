---
id: BLOG-001
title: Restore content collection buildability
status: done
priority: P0
depends_on: []
---

# Restore content collection buildability

## Resolution

The invalid draft was removed from the working tree before this local issue catalogue was finalized. A fresh `npm exec astro check` on 2026-09-13 completed with 0 errors, 0 warnings, and 0 hints. Reopen this issue if an undated or frontmatter-free draft is placed under `src/content/posts/` again.

## Problem

`npm exec astro check` failed because `src/content/posts/2026/07/xx/blog-draft-ai-agent-initiatives.md` was matched by the posts collection but had no frontmatter. The collection requires `pubDatetime`, `title`, and `description`.

The `xx` path also cannot satisfy the public `/YYYY/MM/DD/:slug/` URL contract.

## Required change

1. Preserve the draft body exactly.
2. Move the file outside `src/content/posts/` into a repository-level `drafts/` directory because its publication date is not yet known.
3. Add a short `drafts/README.md` explaining that files there are not loaded, built, indexed, added to RSS, or published.
4. Do not invent a publication date or publish the draft.

## Acceptance criteria

- No file with a placeholder date such as `xx` is matched by the posts collection.
- The draft content remains available under `drafts/`.
- `npm exec astro check` passes, unless a different pre-existing error is reported and documented.
- No existing public article URL changes.

## Verification

```sh
npm exec astro check
npm run format:check
npm run lint
git status --short
```

## Non-goals

- Editing or fact-checking the draft.
- Choosing its publication date.
- Publishing the draft.
