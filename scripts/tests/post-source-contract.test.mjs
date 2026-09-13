import assert from "node:assert/strict";
import test from "node:test";
import {
  assertUniqueCanonicalPaths,
  validatePostSource,
} from "../lib/post-source-contract.mjs";

test("accepts a valid dated post path and preserves a dotted slug", () => {
  assert.deepEqual(
    validatePostSource({
      relativePath: "2019/05/05/trident-19.04-19.04.1-update.md",
      pubDatetime: "2019-05-05T12:00:00+09:00",
      timezone: "Asia/Tokyo",
    }),
    {
      canonicalPath: "/2019/05/05/trident-19.04-19.04.1-update/",
      normalizedPath: "2019/05/05/trident-19.04-19.04.1-update.md",
    }
  );
});

test("rejects a post path without a day segment", () => {
  assert.throws(
    () =>
      validatePostSource({
        relativePath: "2026/09/post.md",
        pubDatetime: "2026-09-13T01:34:00+09:00",
      }),
    /Invalid post source path: 2026\/09\/post\.md/
  );
});

test("rejects an invalid calendar date", () => {
  assert.throws(
    () =>
      validatePostSource({
        relativePath: "2026/02/30/post.md",
        pubDatetime: "2026-02-28T00:00:00Z",
      }),
    /Invalid calendar date/
  );
});

test("uses the lexical publication date without shifting the URL timezone", () => {
  assert.doesNotThrow(() =>
    validatePostSource({
      relativePath: "2017/03/11/post.md",
      pubDatetime: "2017-03-11T15:23:21.715Z",
      timezone: "Asia/Tokyo",
    })
  );
});

test("rejects a path and publication date mismatch", () => {
  assert.throws(
    () =>
      validatePostSource({
        relativePath: "2026/09/12/post.md",
        pubDatetime: "2026-09-13T01:34:00+09:00",
      }),
    /Post date mismatch/
  );
});

test("rejects duplicate canonical paths", () => {
  assert.throws(
    () =>
      assertUniqueCanonicalPaths([
        { canonicalPath: "/2026/09/13/post/", source: "post.md" },
        { canonicalPath: "/2026/09/13/post/", source: "post.mdx" },
      ]),
    /Duplicate canonical post path/
  );
});
