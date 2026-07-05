import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const repoRoot = path.resolve(import.meta.dirname, "..");
const hugoRoot = process.env.HUGO_ROOT
  ? path.resolve(process.env.HUGO_ROOT)
  : path.resolve(repoRoot, "../makotow-blog-hugo");
const hugoPostsRoot = path.join(hugoRoot, "content/post");
const astroPostsRoot = path.join(repoRoot, "src/content/posts");
const distRoot = path.join(repoRoot, "dist");
const publicRedirectsPath = path.join(repoRoot, "public/_redirects");
const distRedirectsPath = path.join(distRoot, "_redirects");
const reportsRoot = path.join(repoRoot, "reports");
const csvReportPath = path.join(reportsRoot, "migration-url-check.csv");
const markdownReportPath = path.join(reportsRoot, "migration-url-check.md");
const baseUrl = process.env.VERIFY_BASE_URL ?? "http://127.0.0.1:4321";

function walk(dir, predicate = () => true) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath, predicate);
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function normalizeLineEndings(content) {
  return content.replace(/\r\n/g, "\n");
}

function splitFrontmatter(content, filePath) {
  const normalized = normalizeLineEndings(content);
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) throw new Error(`Missing YAML frontmatter: ${filePath}`);
  return {
    frontmatter: YAML.parse(match[1]) ?? {},
    frontmatterSource: match[1],
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

function getRawField(frontmatterSource, fieldName) {
  const pattern = new RegExp(`^${fieldName}:\\s*(.+?)\\s*$`, "m");
  return frontmatterSource
    .match(pattern)?.[1]
    ?.trim()
    .replace(/^["']|["']$/g, "");
}

function getDateParts(dateValue, rawDateValue, filePath) {
  const raw = String(rawDateValue ?? dateValue ?? "").trim();
  const datePart = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!datePart) throw new Error(`Missing date: ${filePath}`);
  return {
    year: datePart[1],
    month: datePart[2],
    day: datePart[3],
  };
}

function ensureLeadingSlash(value) {
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function getEffectiveSlug(frontmatter, sourceDir) {
  const slug = String(frontmatter.slug ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");
  return slug || path.basename(sourceDir);
}

function expectedPostsFromHugo() {
  return walk(hugoPostsRoot, filePath => path.basename(filePath) === "index.md")
    .sort()
    .map(filePath => {
      const source = fs.readFileSync(filePath, "utf8");
      const { frontmatter, frontmatterSource } = splitFrontmatter(
        source,
        filePath
      );
      const date = getDateParts(
        frontmatter.date,
        getRawField(frontmatterSource, "date"),
        filePath
      );
      const slug = getEffectiveSlug(frontmatter, path.dirname(filePath));
      return {
        title: String(frontmatter.title ?? slug).trim(),
        source: path.relative(hugoRoot, filePath),
        canonicalPath: `/${date.year}/${date.month}/${date.day}/${slug}/`,
        legacyPostPath: `/post/${date.year}/${date.month}/${date.day}/${slug}/`,
        aliases: cleanStringArray(frontmatter.aliases).map(ensureLeadingSlash),
      };
    });
}

function canonicalPathForAstroPost(filePath) {
  const relativePath = path.relative(astroPostsRoot, filePath);
  const parsed = path.parse(relativePath);
  return `/${parsed.dir}/${parsed.name}/`;
}

function legacyPostPathFor(canonicalPath) {
  return `/post${canonicalPath}`;
}

function expectedPostsFromAstro() {
  return walk(astroPostsRoot, filePath => /\.(md|mdx)$/.test(filePath))
    .sort()
    .map(filePath => {
      const source = fs.readFileSync(filePath, "utf8");
      const { frontmatter } = splitFrontmatter(source, filePath);
      const canonicalPath = canonicalPathForAstroPost(filePath);
      const slug = path.parse(filePath).name;
      return {
        title: String(frontmatter.title ?? slug).trim(),
        source: path.relative(repoRoot, filePath),
        canonicalPath,
        legacyPostPath: legacyPostPathFor(canonicalPath),
        aliases: cleanStringArray(frontmatter.aliases).map(ensureLeadingSlash),
      };
    });
}

function expectedPosts() {
  if (fs.existsSync(hugoPostsRoot)) {
    return { sourceInventory: "hugo", posts: expectedPostsFromHugo() };
  }
  if (fs.existsSync(astroPostsRoot)) {
    return { sourceInventory: "astro", posts: expectedPostsFromAstro() };
  }
  throw new Error(
    `Missing post sources: ${hugoPostsRoot} and ${astroPostsRoot}`
  );
}

function parseRedirects(filePath) {
  const redirects = new Map();
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [from, to, status = ""] = trimmed.split(/\s+/);
    redirects.set(from, { to, status });
  }
  return redirects;
}

function distFileForPath(urlPath) {
  if (urlPath.endsWith("/")) {
    return path.join(distRoot, urlPath.slice(1), "index.html");
  }
  return path.join(distRoot, urlPath.slice(1));
}

async function canReachDevServer() {
  try {
    const response = await fetch(new URL("/", baseUrl), {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    return response.status >= 200 && response.status < 500;
  } catch {
    return false;
  }
}

async function getStatus(urlPath) {
  try {
    const response = await fetch(new URL(urlPath, baseUrl), {
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });
    return String(response.status);
  } catch (error) {
    return `ERROR: ${error.message}`;
  }
}

function addResult(results, row) {
  results.push({
    type: row.type,
    source: row.source,
    target: row.target ?? "",
    expected: row.expected,
    actual: row.actual,
    result: row.result,
    detail: row.detail ?? "",
  });
}

function csvEscape(value) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function writeReports(summary, results) {
  fs.mkdirSync(reportsRoot, { recursive: true });

  const csvLines = [
    ["type", "source", "target", "expected", "actual", "result", "detail"]
      .map(csvEscape)
      .join(","),
    ...results.map(row =>
      [
        row.type,
        row.source,
        row.target,
        row.expected,
        row.actual,
        row.result,
        row.detail,
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  fs.writeFileSync(csvReportPath, `${csvLines.join("\n")}\n`);

  const markdown = [
    "# Migration URL Check",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Base URL: ${baseUrl}`,
    "",
    "## Summary",
    "",
    `- Result: ${summary.failed === 0 ? "PASS" : "FAIL"}`,
    `- Source inventory: ${summary.sourceInventory}`,
    `- Posts: ${summary.posts}`,
    `- Canonical files OK: ${summary.canonicalFilesOk}/${summary.posts}`,
    `- Canonical HTTP OK: ${summary.httpSkipped ? "skipped" : `${summary.canonicalHttpOk}/${summary.posts}`}`,
    `- Redirect rules OK: ${summary.redirectRulesOk}/${summary.redirectRulesExpected}`,
    `- Redirect targets OK: ${summary.redirectTargetsOk}/${summary.redirectRulesExpected}`,
    `- RSS files OK: ${summary.rssFilesOk ? "yes" : "no"}`,
    `- Sitemap files OK: ${summary.sitemapFilesOk ? "yes" : "no"}`,
    `- Failures: ${summary.failed}`,
    "",
    "## Notes",
    "",
    "- Astro dev server does not apply Cloudflare Pages `_redirects`, so alias redirects are verified by `_redirects` contents and generated target files.",
    "- Canonical post URLs are checked against `dist` and, when reachable, the local dev server.",
    "",
  ];
  fs.writeFileSync(markdownReportPath, `${markdown.join("\n")}\n`);
}

async function main() {
  if (!fs.existsSync(distRoot))
    throw new Error("Missing dist/. Run npm run build first.");
  if (!fs.existsSync(publicRedirectsPath)) {
    throw new Error(`Missing redirects file: ${publicRedirectsPath}`);
  }

  const { sourceInventory, posts } = expectedPosts();
  const publicRedirects = parseRedirects(publicRedirectsPath);
  const distRedirects = fs.existsSync(distRedirectsPath)
    ? parseRedirects(distRedirectsPath)
    : new Map();
  const results = [];
  const httpEnabled = await canReachDevServer();

  for (const post of posts) {
    const filePath = distFileForPath(post.canonicalPath);
    const fileOk = fs.existsSync(filePath);
    addResult(results, {
      type: "canonical-file",
      source: post.source,
      target: post.canonicalPath,
      expected: "exists",
      actual: fileOk ? "exists" : "missing",
      result: fileOk ? "PASS" : "FAIL",
      detail: post.title,
    });

    if (httpEnabled) {
      const status = await getStatus(post.canonicalPath);
      addResult(results, {
        type: "canonical-http",
        source: post.source,
        target: post.canonicalPath,
        expected: "200",
        actual: status,
        result: status === "200" ? "PASS" : "FAIL",
        detail: post.title,
      });
    }
  }

  const expectedRedirects = new Map([
    ["/index.xml", { to: "/rss.xml", status: "301" }],
  ]);
  for (const post of posts) {
    if (post.legacyPostPath !== post.canonicalPath) {
      expectedRedirects.set(post.legacyPostPath, {
        to: post.canonicalPath,
        status: "301",
      });
    }
    for (const alias of post.aliases) {
      expectedRedirects.set(alias, { to: post.canonicalPath, status: "301" });
    }
  }

  for (const [from, expected] of expectedRedirects) {
    const publicRule = publicRedirects.get(from);
    const distRule = distRedirects.get(from);
    const publicOk =
      publicRule?.to === expected.to && publicRule?.status === expected.status;
    const distOk =
      distRule?.to === expected.to && distRule?.status === expected.status;
    addResult(results, {
      type: "redirect-rule",
      source: from,
      target: expected.to,
      expected: `${expected.to} ${expected.status}`,
      actual: publicRule ? `${publicRule.to} ${publicRule.status}` : "missing",
      result: publicOk && distOk ? "PASS" : "FAIL",
      detail: distOk
        ? "public and dist match"
        : "dist/_redirects is missing or stale",
    });

    const targetOk = fs.existsSync(distFileForPath(expected.to));
    addResult(results, {
      type: "redirect-target",
      source: from,
      target: expected.to,
      expected: "exists",
      actual: targetOk ? "exists" : "missing",
      result: targetOk ? "PASS" : "FAIL",
    });
  }

  const rssFilesOk = fs.existsSync(path.join(distRoot, "rss.xml"));
  addResult(results, {
    type: "feed-file",
    source: "/rss.xml",
    expected: "exists",
    actual: rssFilesOk ? "exists" : "missing",
    result: rssFilesOk ? "PASS" : "FAIL",
  });

  const sitemapFilesOk =
    fs.existsSync(path.join(distRoot, "sitemap-index.xml")) &&
    walk(distRoot, filePath => /sitemap-\d+\.xml$/.test(filePath)).length > 0;
  addResult(results, {
    type: "sitemap-file",
    source: "/sitemap-index.xml",
    expected: "exists",
    actual: sitemapFilesOk ? "exists" : "missing",
    result: sitemapFilesOk ? "PASS" : "FAIL",
  });

  const summary = {
    sourceInventory,
    posts: posts.length,
    canonicalFilesOk: results.filter(
      row => row.type === "canonical-file" && row.result === "PASS"
    ).length,
    canonicalHttpOk: results.filter(
      row => row.type === "canonical-http" && row.result === "PASS"
    ).length,
    httpSkipped: !httpEnabled,
    redirectRulesExpected: expectedRedirects.size,
    redirectRulesOk: results.filter(
      row => row.type === "redirect-rule" && row.result === "PASS"
    ).length,
    redirectTargetsOk: results.filter(
      row => row.type === "redirect-target" && row.result === "PASS"
    ).length,
    rssFilesOk,
    sitemapFilesOk,
    failed: results.filter(row => row.result !== "PASS").length,
  };

  writeReports(summary, results);

  console.log(`Migration URL check: ${summary.failed === 0 ? "PASS" : "FAIL"}`);
  console.log(`Source inventory: ${summary.sourceInventory}`);
  console.log(`Posts: ${summary.posts}`);
  console.log(
    `Canonical files OK: ${summary.canonicalFilesOk}/${summary.posts}`
  );
  console.log(
    `Canonical HTTP OK: ${summary.httpSkipped ? "skipped" : `${summary.canonicalHttpOk}/${summary.posts}`}`
  );
  console.log(
    `Redirect rules OK: ${summary.redirectRulesOk}/${summary.redirectRulesExpected}`
  );
  console.log(
    `Redirect targets OK: ${summary.redirectTargetsOk}/${summary.redirectRulesExpected}`
  );
  console.log(`Report: ${markdownReportPath}`);
  console.log(`CSV: ${csvReportPath}`);

  if (summary.failed > 0) process.exitCode = 1;
}

main();
