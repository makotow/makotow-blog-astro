import assert from "node:assert/strict";
import test from "node:test";

import {
  hasUniqueValues,
  isAbsoluteHttpsUrl,
  isAbsolutePath,
  isIanaTimezone,
  SUPPORTED_CONTENT_LANGUAGES,
} from "../../src/utils/contentMetadata.ts";

test("accepts an absolute HTTPS URL", () => {
  assert.equal(isAbsoluteHttpsUrl("https://example.com/post"), true);
});

test("rejects HTTP, relative, and malformed URLs", () => {
  assert.equal(isAbsoluteHttpsUrl("http://example.com/post"), false);
  assert.equal(isAbsoluteHttpsUrl("/post"), false);
  assert.equal(isAbsoluteHttpsUrl("not a URL"), false);
});

test("accepts rooted aliases and rejects protocol-relative aliases", () => {
  assert.equal(isAbsolutePath("/legacy-post"), true);
  assert.equal(isAbsolutePath("legacy-post"), false);
  assert.equal(isAbsolutePath("//example.com/post"), false);
});

test("rejects duplicate aliases", () => {
  assert.equal(hasUniqueValues(["/one", "/two"]), true);
  assert.equal(hasUniqueValues(["/one", "/one"]), false);
});

test("accepts supported IANA timezones and rejects unknown values", () => {
  assert.equal(isIanaTimezone("Asia/Tokyo"), true);
  assert.equal(isIanaTimezone("Mars/Olympus_Mons"), false);
});

test("content languages are explicitly limited to Japanese and English", () => {
  assert.deepEqual(SUPPORTED_CONTENT_LANGUAGES, ["ja", "en"]);
  assert.equal(SUPPORTED_CONTENT_LANGUAGES.includes("fr"), false);
});
