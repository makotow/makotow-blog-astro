---
id: BLOG-003
title: Return navigation to a static MPA
status: done
priority: P1
depends_on:
  - BLOG-001
---

# Return navigation to a static MPA

## Resolution

Removed Astro's client router and all router-only transition hooks. Theme,
navigation, search, back-button, analytics, and scroll-progress setup now run once
per full document load. The back-to-top indicator is the sole article progress
implementation, and a production build contains no ClientRouter references.

## Problem

The site globally enables Astro's `ClientRouter`, even though it is a content-first static blog. Article scripts marked `data-astro-rerun` add document-level scroll listeners after every client-side navigation and never remove them. This can accumulate duplicated work during a long browsing session.

The router also forces page-specific code to use Astro transition lifecycle events and complicates analytics, theme handling, search initialization, and future CSP work.

## Required change

1. Remove `ClientRouter` from `src/layouts/Layout.astro` and return to standard document navigation.
2. Remove `data-astro-rerun`, `transition:persist`, and `astro:*` lifecycle handlers that exist only for client-side routing.
3. Convert header, theme, back-button, search, and article-progress initialization to normal one-time page-load behavior.
4. Keep exactly one article scroll-progress implementation. Prefer the existing back-to-top indicator and remove the duplicate top progress bar.
5. Update the GA4 documentation: full document navigation no longer relies on History API page-view detection.
6. If visual transitions are still desired, use native cross-document CSS transitions without adding a JavaScript router.

## Acceptance criteria

- No `ClientRouter` import or component remains.
- No `data-astro-rerun` or `astro:after-swap`, `astro:before-swap`, or `astro:page-load` handler remains unless its necessity is documented in the issue.
- Theme toggle, mobile menu, back button, search, and back-to-top work after direct loads and ordinary link navigation.
- Generated pages do not load the Astro ClientRouter JavaScript bundle.
- Reduced-motion behavior and keyboard navigation remain usable.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run verify:links
npm run lhci
```

Also inspect home, article, search, and mobile navigation in a browser. Record any browser check that cannot be run.

## Non-goals

- Redesigning the site.
- Introducing React, Vue, Svelte, or another client framework.
- Changing public URLs.
