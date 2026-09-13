---
id: BLOG-004
title: Make publication-time behavior deterministic
status: done
priority: P1
depends_on:
  - BLOG-001
---

# Make publication-time behavior deterministic

## Resolution

Removed the publication margin from configuration and moved eligibility into a
clock-independent function. Production now publishes at or after the exact
instant, while development deliberately exposes valid drafts and future posts
for author preview. The README documents the required post-time rebuild and
deployment.

## Problem

`postFilter()` subtracts `scheduledPostMargin` from `pubDatetime`, allowing a post to appear up to 15 minutes early. A static Astro build also cannot publish a previously excluded post when its time arrives unless another deployment occurs.

The current option name suggests scheduling support that the deployment does not actually provide.

## Required change

1. Remove `scheduledPostMargin` from public and resolved configuration types.
2. Publish only when `buildTime >= pubDatetime`; never publish early.
3. Extract the comparison into a pure function that accepts the current time explicitly so boundary behavior can be tested without changing the system clock.
4. Add tests for draft, before publication, exact publication time, after publication, and timezone-offset inputs.
5. Document that a static rebuild/deployment is required after the publication time.
6. Do not add a scheduled deployment or external secret in this issue. If automatic timed publication is wanted later, create a separate issue requiring explicit deployment authorization.

## Acceptance criteria

- A production build never contains a future post.
- A post is eligible at its exact publication instant.
- Development mode can still preview valid draft content according to the documented policy.
- The configuration and README no longer imply automatic scheduled publishing.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run verify:links
```

Run the new publication-boundary tests and report their exact result.

## Non-goals

- Configuring Cloudflare or GitHub credentials.
- Creating an automatic production deployment.
- Changing historical publication timestamps.
