export interface PublicationEligibility {
  draft?: boolean;
  pubDatetime: Date | string | number;
  now: Date | string | number;
  isDevelopment: boolean;
}

function toTimestamp(value: Date | string | number): number {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

/**
 * Decide whether a post may be rendered without reading the system clock.
 *
 * Development intentionally exposes valid collection entries, including drafts
 * and future posts. Production requires a non-draft post whose publication
 * instant has arrived.
 */
export function isPostEligible({
  draft = false,
  pubDatetime,
  now,
  isDevelopment,
}: PublicationEligibility): boolean {
  if (isDevelopment) return true;
  if (draft) return false;

  return toTimestamp(now) >= toTimestamp(pubDatetime);
}
