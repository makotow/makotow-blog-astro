export const SUPPORTED_CONTENT_LANGUAGES = ["ja", "en"] as const;

export function isAbsoluteHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function isAbsolutePath(value: string): boolean {
  return value.startsWith("/") && !value.startsWith("//");
}

export function hasUniqueValues(values: string[]): boolean {
  return new Set(values).size === values.length;
}

export function isIanaTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
