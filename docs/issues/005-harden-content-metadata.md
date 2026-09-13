---
id: BLOG-005
title: Harden content metadata and language handling
status: done
priority: P2
depends_on:
  - BLOG-001
  - BLOG-002
---

# Harden content metadata and language handling

## Resolution

Content validation now coerces dates, restricts canonical and remote image URLs
to HTTPS, validates aliases and IANA timezones, and limits explicit content
languages to `ja` and `en` with a Japanese default. Page and post language is
forwarded to the document root without locale-prefixed routes. The Japanese UI
catalogue now matches the site's configured default language.

## Problem

The collection schema accepts arbitrary strings for canonical URLs, remote OGP images, aliases, and timezones. Every generated document also defaults to `lang="ja"`, even though the archive may contain English-language posts and the current Japanese UI catalogue is largely English.

## Required change

1. Strengthen the posts and pages schemas:
   - coerce publication and modification timestamps to dates;
   - allow `canonicalURL` only as an absolute HTTPS URL;
   - allow `ogImage` only as a validated local image or absolute HTTPS URL;
   - require aliases to start with `/` and reject duplicates;
   - validate timezone values as supported IANA timezones;
   - add `lang` with the supported values `ja` and `en`, defaulting to `ja` for compatibility.
2. Pass the resolved page or post language into the top-level layout and render the correct `<html lang>` value without changing routes.
3. Keep English posts in the existing archive; do not introduce `/en/` URLs.
4. Decide whether the default UI is Japanese or English, then make `src/i18n/lang/ja.ts` consistent with that decision. If a product-language decision is required, stop before changing visible copy and ask the user.
5. Add representative validation fixtures for accepted and rejected metadata.

## Acceptance criteria

- Invalid canonical URLs, remote image URLs, aliases, timezones, and language values fail during content validation.
- Existing valid posts still build without URL changes.
- A post can explicitly render `lang="en"` while keeping its existing URL.
- No locale-prefixed route is introduced.

## Verification

```sh
npm run format:check
npm run lint
npm run build
npm run verify:migration
npm run review:content
npm run verify:links
```

## Non-goals

- Translating article bodies.
- Adding language-specific archives.
- Automatically guessing a post's language.
