import assert from "node:assert/strict";
import test from "node:test";

import { isPostEligible } from "../../src/utils/publicationTime.ts";

const publication = "2026-09-13T10:00:00+09:00";

test("production excludes drafts after their publication time", () => {
  assert.equal(
    isPostEligible({
      draft: true,
      pubDatetime: publication,
      now: "2026-09-13T10:01:00+09:00",
      isDevelopment: false,
    }),
    false
  );
});

test("production excludes a post before publication", () => {
  assert.equal(
    isPostEligible({
      pubDatetime: publication,
      now: "2026-09-13T09:59:59+09:00",
      isDevelopment: false,
    }),
    false
  );
});

test("production includes a post at the exact publication instant", () => {
  assert.equal(
    isPostEligible({
      pubDatetime: publication,
      now: publication,
      isDevelopment: false,
    }),
    true
  );
});

test("production includes a post after publication", () => {
  assert.equal(
    isPostEligible({
      pubDatetime: publication,
      now: "2026-09-13T10:00:01+09:00",
      isDevelopment: false,
    }),
    true
  );
});

test("timezone offsets are compared as absolute instants", () => {
  assert.equal(
    isPostEligible({
      pubDatetime: "2026-09-13T10:00:00+09:00",
      now: "2026-09-13T01:00:00Z",
      isDevelopment: false,
    }),
    true
  );
});

test("development exposes valid draft content for author preview", () => {
  assert.equal(
    isPostEligible({
      draft: true,
      pubDatetime: "2099-01-01T00:00:00Z",
      now: "2026-09-13T00:00:00Z",
      isDevelopment: true,
    }),
    true
  );
});
