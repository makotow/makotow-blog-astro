# Local Issues

This directory is the repository-local backlog for work that should be executable by a coding agent without relying on GitHub Issues.

## Status values

- `open`: ready to be picked up when its dependencies are complete.
- `in_progress`: an agent is actively working on it.
- `blocked`: the stated acceptance criteria cannot be met without a user decision or external change.
- `done`: implementation and all applicable verification are complete.

When starting an issue, update only that issue's `status`. Do not work on multiple issues in one change unless the issue explicitly requires it. Preserve unrelated working-tree changes, do not commit unless asked, and report exact verification output and any checks that could not be run.

## Backlog

| ID | Priority | Status | Issue | Depends on |
| --- | --- | --- | --- | --- |
| BLOG-001 | P0 | done | [Restore content collection buildability](./001-restore-content-collection-buildability.md) | - |
| BLOG-002 | P0 | done | [Enforce the article URL path contract](./002-enforce-article-url-path-contract.md) | BLOG-001 |
| BLOG-003 | P1 | done | [Return navigation to a static MPA](./003-return-navigation-to-static-mpa.md) | BLOG-001 |
| BLOG-004 | P1 | done | [Make publication-time behavior deterministic](./004-make-publication-time-deterministic.md) | BLOG-001 |
| BLOG-005 | P2 | done | [Harden content metadata and language handling](./005-harden-content-metadata.md) | BLOG-001, BLOG-002 |
| BLOG-006 | P2 | done | [Remove remote cover-image layout instability](./006-fix-remote-cover-images.md) | BLOG-001 |
| BLOG-007 | P2 | done | [Turn Lighthouse into an effective quality gate](./007-promote-lighthouse-quality-gate.md) | BLOG-001, BLOG-003 |
| BLOG-008 | P2 | done | [Make Pagefind generation one-way](./008-make-pagefind-generation-one-way.md) | BLOG-001 |
| BLOG-009 | P2 | done | [Remove disabled dynamic OGP code](./009-remove-disabled-dynamic-og-code.md) | BLOG-001 |
| BLOG-010 | P2 | done | [Upgrade to Astro 7](./010-upgrade-to-astro-7.md) | BLOG-002 through BLOG-009 |

## Recommended execution order

1. BLOG-001 and BLOG-002 restore the local build and protect public URLs.
2. BLOG-003 and BLOG-004 simplify runtime behavior and publishing semantics.
3. BLOG-005, BLOG-006, BLOG-008, and BLOG-009 reduce validation, asset, and maintenance risk.
4. BLOG-007 makes regressions blocking once the runtime behavior is stable.
5. BLOG-010 performs the framework major upgrade in isolation.
