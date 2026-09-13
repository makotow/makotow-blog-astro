import type { CollectionEntry } from "astro:content";
import { isPostEligible } from "./publicationTime";

/**
 * Determines whether a post is eligible to be listed/rendered.
 *
 * - Production excludes drafts and posts whose publication instant has not arrived.
 * - Development includes valid drafts and future posts for author preview.
 */
export function postFilter({ data }: CollectionEntry<"posts">) {
  return isPostEligible({
    draft: data.draft,
    pubDatetime: data.pubDatetime,
    now: Date.now(),
    isDevelopment: import.meta.env.DEV,
  });
}
