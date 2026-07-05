import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const repoRoot = path.resolve(import.meta.dirname, "..");
const hugoRoot = path.resolve(repoRoot, "../makotow-blog-hugo");
const hugoPostsRoot = path.join(hugoRoot, "content/post");
const astroPostsRoot = path.join(repoRoot, "src/content/posts");
const redirectsPath = path.join(repoRoot, "public/_redirects");

function walk(dir, predicate = () => true) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath, predicate);
    }
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, "\n");
}

function splitFrontmatter(content, filePath) {
  const normalized = normalizeLineEndings(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error(`Missing YAML frontmatter: ${filePath}`);
  }
  return {
    frontmatter: YAML.parse(match[1]) ?? {},
    frontmatterSource: match[1],
    body: normalized.slice(match[0].length),
  };
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === null || value === "") return [];
  return [value];
}

function cleanStringArray(value) {
  return toArray(value)
    .map(item => String(item ?? "").trim())
    .filter(Boolean);
}

function toIsoString(value) {
  if (value instanceof Date) return value.toISOString();
  const raw = String(value ?? "").trim();
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toISOString();
}

function quoteYamlString(value) {
  return JSON.stringify(String(value ?? ""));
}

function stringifyFrontmatter(data) {
  const lines = ["---"];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${quoteYamlString(item)}`);
      }
      continue;
    }
    if (typeof value === "boolean") {
      lines.push(`${key}: ${value}`);
      continue;
    }
    if (key === "pubDatetime" || key === "modDatetime") {
      lines.push(`${key}: ${value}`);
      continue;
    }
    lines.push(`${key}: ${quoteYamlString(value)}`);
  }

  lines.push("---", "");
  return lines.join("\n");
}

function getRawField(frontmatterSource, fieldName) {
  const pattern = new RegExp(`^${fieldName}:\\s*(.+?)\\s*$`, "m");
  const match = frontmatterSource.match(pattern);
  return match?.[1]?.trim().replace(/^["']|["']$/g, "");
}

function getDateParts(dateValue, rawDateValue, filePath) {
  const raw = String(rawDateValue ?? dateValue ?? "").trim();
  const datePart = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const iso = raw || toIsoString(dateValue);
  if (!iso || !datePart) {
    throw new Error(`Missing date: ${filePath}`);
  }
  return {
    iso,
    year: datePart[1],
    month: datePart[2],
    day: datePart[3],
  };
}

function getEffectiveSlug(frontmatter, sourceDir) {
  const slug = String(frontmatter.slug ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
  return slug || path.basename(sourceDir);
}

function isRemoteUrl(value) {
  return /^https?:\/\//i.test(value);
}

function copyBundleAssets(sourceDir, outDir) {
  const files = walk(
    sourceDir,
    filePath => path.basename(filePath) !== "index.md"
  );

  for (const filePath of files) {
    const relative = path.relative(sourceDir, filePath);
    const target = path.join(outDir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(filePath, target);
  }
}

function ensureLeadingSlash(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function normalizeMarkdownBody(body) {
  return body.replace(/^```([^\s`].*)$/gm, (_match, fenceText) => {
    if (/^[A-Za-z0-9_+-]+$/.test(fenceText.trim())) {
      return `\`\`\`${fenceText.trim()}`;
    }
    return `\`\`\`text\n${fenceText}`;
  });
}

function migratePost(filePath) {
  const sourceDir = path.dirname(filePath);
  const source = fs.readFileSync(filePath, "utf8");
  const { frontmatter, frontmatterSource, body } = splitFrontmatter(
    source,
    filePath
  );
  const date = getDateParts(
    frontmatter.date,
    getRawField(frontmatterSource, "date"),
    filePath
  );
  const effectiveSlug = getEffectiveSlug(frontmatter, sourceDir);
  const outDir = path.join(astroPostsRoot, date.year, date.month, date.day);
  const outPath = path.join(outDir, `${effectiveSlug}.md`);
  const title = String(frontmatter.title ?? effectiveSlug).trim();
  const description = String(frontmatter.description ?? "").trim() || title;
  const tags = cleanStringArray(frontmatter.tags);
  const categories = cleanStringArray(frontmatter.categories);
  const aliases = cleanStringArray(frontmatter.aliases).map(ensureLeadingSlash);
  const image = String(frontmatter.image ?? "").trim();

  const outFrontmatter = {
    author: String(frontmatter.author ?? "Makoto Watanabe").trim(),
    pubDatetime: date.iso,
    modDatetime: toIsoString(frontmatter.lastmod),
    title,
    draft: Boolean(frontmatter.draft),
    tags: tags.length > 0 ? tags : ["others"],
    categories: categories.length > 0 ? categories : undefined,
    aliases: aliases.length > 0 ? aliases : undefined,
    ogImage: image || undefined,
    description,
    timezone: "Asia/Tokyo",
  };

  fs.mkdirSync(outDir, { recursive: true });
  copyBundleAssets(sourceDir, outDir);
  fs.writeFileSync(
    outPath,
    `${stringifyFrontmatter(outFrontmatter)}${normalizeMarkdownBody(body)}`
  );

  return {
    source: filePath,
    output: outPath,
    canonicalPath: `/${date.year}/${date.month}/${date.day}/${effectiveSlug}/`,
    legacyPostPath: `/post/${date.year}/${date.month}/${date.day}/${effectiveSlug}/`,
    aliases,
    hasRemoteImage: Boolean(image && isRemoteUrl(image)),
  };
}

function main() {
  if (!fs.existsSync(hugoPostsRoot)) {
    throw new Error(`Hugo posts directory not found: ${hugoPostsRoot}`);
  }

  fs.rmSync(astroPostsRoot, { recursive: true, force: true });
  fs.mkdirSync(astroPostsRoot, { recursive: true });

  const posts = walk(
    hugoPostsRoot,
    filePath => path.basename(filePath) === "index.md"
  )
    .sort()
    .map(migratePost);

  const redirects = [
    "# Generated by npm run migrate:hugo",
    "/index.xml /rss.xml 301",
  ];

  for (const post of posts) {
    if (post.legacyPostPath !== post.canonicalPath) {
      redirects.push(`${post.legacyPostPath} ${post.canonicalPath} 301`);
    }
    for (const alias of post.aliases) {
      redirects.push(`${alias} ${post.canonicalPath} 301`);
    }
  }

  fs.writeFileSync(redirectsPath, `${redirects.join("\n")}\n`);

  const remoteImages = posts.filter(post => post.hasRemoteImage).length;
  console.log(`Migrated ${posts.length} posts.`);
  console.log(
    `Generated ${redirects.length - 1} redirects at ${redirectsPath}.`
  );
  console.log(`Posts with remote ogImage: ${remoteImages}.`);
}

main();
