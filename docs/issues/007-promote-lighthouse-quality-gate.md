---
id: BLOG-007
title: Turn Lighthouse into an effective quality gate
status: done
priority: P2
depends_on:
  - BLOG-001
  - BLOG-003
---

# Turn Lighthouse into an effective quality gate

## Resolution

Lighthouse now runs desktop and mobile profiles with two samples per home,
article, and search URL. All four category assertions are blocking at `0.90`
and use Lighthouse CI's `median-run` aggregation. The workflow no longer allows
the command to fail silently and still uploads reports with `if: always()`.

On local Google Chrome, both runs in both profiles scored performance `1.00`,
best practices `1.00`, and SEO `1.00` for all three URLs. Accessibility scored
`1.00` on home, `0.95` on the article, and `0.96` on search. GitHub Actions was
not run from this uncommitted working tree, so runner-specific timing remains to
be confirmed by the next CI run.

## Problem

Lighthouse runs in CI, but all category assertions are warnings and the workflow uses `continue-on-error`. The job therefore records regressions without blocking them. It also runs only one desktop sample, which is vulnerable to noise and does not cover mobile behavior.

## Required change

1. Preserve the current representative home, article, and search URLs.
2. Add a mobile Lighthouse collection in addition to desktop.
3. Use at least two runs per URL and a deterministic aggregation strategy supported by Lighthouse CI.
4. Change accessibility, best-practices, and SEO thresholds to blocking errors at `0.90` or higher.
5. Establish a performance threshold from the checked-in baseline; start at `0.90` unless measured CI evidence justifies a different value.
6. Remove `continue-on-error` after the thresholds pass in CI.
7. Keep reports uploaded on failure.

## Acceptance criteria

- A score below a configured threshold fails the Lighthouse job.
- Both desktop and mobile are measured.
- Reports upload whether the job succeeds or fails.
- Threshold choices and any allowed variance are documented.

## Verification

```sh
npm run build
npm run lhci
```

Also validate the workflow YAML and record any difference between local Chrome and GitHub Actions results.

## Non-goals

- Chasing a score by removing required accessibility or analytics behavior.
- Making unrelated visual changes.
