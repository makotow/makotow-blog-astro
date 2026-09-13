import path from "node:path";

const POST_PATH_PATTERN =
  /^(?<year>\d{4})\/(?<month>\d{2})\/(?<day>\d{2})\/(?<slug>[^/]+)\.(?<extension>md|mdx)$/;

function calendarDateIsValid(year, month, day) {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() === Number(year) &&
    date.getUTCMonth() === Number(month) - 1 &&
    date.getUTCDate() === Number(day)
  );
}

export function validatePostSource({ relativePath, pubDatetime }) {
  const normalizedPath = relativePath.split(path.sep).join("/");
  const match = normalizedPath.match(POST_PATH_PATTERN);
  if (!match?.groups) {
    throw new Error(
      `Invalid post source path: ${normalizedPath}; expected YYYY/MM/DD/<slug>.md or .mdx`
    );
  }

  const { year, month, day, slug } = match.groups;
  if (!calendarDateIsValid(year, month, day)) {
    throw new Error(
      `Invalid calendar date in post source path: ${normalizedPath}`
    );
  }

  const pathDate = `${year}-${month}-${day}`;
  const rawPublicationDate = String(pubDatetime ?? "").trim();
  if (!rawPublicationDate) {
    throw new Error(`Missing pubDatetime for post source: ${normalizedPath}`);
  }

  // The lexical date is the URL contract inherited from Hugo. `timezone` is
  // display metadata and must not shift a long-lived canonical URL.
  const publicationDate = rawPublicationDate.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (!publicationDate) {
    throw new Error(
      `Invalid pubDatetime for post source: ${normalizedPath}; received ${rawPublicationDate}`
    );
  }
  if (publicationDate !== pathDate) {
    throw new Error(
      `Post date mismatch: ${normalizedPath} uses ${pathDate}, but pubDatetime resolves to ${publicationDate}`
    );
  }

  return {
    canonicalPath: `/${year}/${month}/${day}/${slug}/`,
    normalizedPath,
  };
}

export function assertUniqueCanonicalPaths(posts) {
  const sourcesByCanonicalPath = new Map();
  for (const post of posts) {
    const previousSource = sourcesByCanonicalPath.get(post.canonicalPath);
    if (previousSource) {
      throw new Error(
        `Duplicate canonical post path ${post.canonicalPath}: ${previousSource}, ${post.source}`
      );
    }
    sourcesByCanonicalPath.set(post.canonicalPath, post.source);
  }
}
