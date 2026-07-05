import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(import.meta.dirname, "..");
const distRoot = path.join(repoRoot, "dist");
const redirectsPath = path.join(distRoot, "_redirects");
const reportsRoot = path.join(repoRoot, "reports");
const markdownReportPath = path.join(reportsRoot, "internal-link-check.md");
const csvReportPath = path.join(reportsRoot, "internal-link-check.csv");
const siteOrigin = "https://blog.makotow.net";

const ignoredSchemes = /^(mailto|tel|sms|javascript|data|blob):/i;
const htmlAttrPattern = /\b(?:href|src)=["']([^"']+)["']/gi;
const srcsetPattern = /\bsrcset=["']([^"']+)["']/gi;

function walk(dir, predicate = () => true) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(fullPath, predicate);
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function decodeHtml(value) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractLinks(html) {
  const links = [];
  for (const match of html.matchAll(htmlAttrPattern)) {
    links.push(decodeHtml(match[1]));
  }
  for (const match of html.matchAll(srcsetPattern)) {
    const candidates = decodeHtml(match[1]).split(",");
    for (const candidate of candidates) {
      const [url] = candidate.trim().split(/\s+/);
      if (url) links.push(url);
    }
  }
  return links;
}

function normalizeInternalPath(rawUrl) {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith("#") || ignoredSchemes.test(trimmed)) {
    return undefined;
  }
  if (trimmed.startsWith("//")) return undefined;

  try {
    if (/^https?:\/\//i.test(trimmed)) {
      const url = new URL(trimmed);
      if (url.origin !== siteOrigin) return undefined;
      return url.pathname;
    }
    const url = new URL(trimmed, siteOrigin);
    return url.pathname;
  } catch {
    return undefined;
  }
}

function pathExists(urlPath) {
  const decodedPath = decodeURIComponent(urlPath);
  const withoutLeadingSlash = decodedPath.replace(/^\/+/, "");

  if (decodedPath === "/") {
    return fs.existsSync(path.join(distRoot, "index.html"));
  }

  if (decodedPath.endsWith("/")) {
    const withoutTrailingSlash = withoutLeadingSlash.replace(/\/+$/, "");
    return (
      fs.existsSync(path.join(distRoot, withoutLeadingSlash, "index.html")) ||
      fs.existsSync(path.join(distRoot, `${withoutTrailingSlash}.html`))
    );
  }

  const directPath = path.join(distRoot, withoutLeadingSlash);
  if (fs.existsSync(directPath)) return true;

  return fs.existsSync(path.join(distRoot, withoutLeadingSlash, "index.html"));
}

function parseRedirects(filePath) {
  const redirects = new Map();
  if (!fs.existsSync(filePath)) return redirects;

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [from, to, status = ""] = trimmed.split(/\s+/);
    if (from && to && status === "301") redirects.set(from, to);
  }
  return redirects;
}

function linkResolves(urlPath, redirects) {
  if (pathExists(urlPath)) return true;

  const redirectTarget = redirects.get(urlPath);
  if (!redirectTarget) return false;

  return pathExists(redirectTarget);
}

function csvEscape(value) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function writeReports(results) {
  fs.mkdirSync(reportsRoot, { recursive: true });

  const csvLines = [
    ["source", "link", "normalizedPath", "result"].map(csvEscape).join(","),
    ...results.map(row =>
      [row.source, row.link, row.normalizedPath, row.result]
        .map(csvEscape)
        .join(",")
    ),
  ];
  fs.writeFileSync(csvReportPath, `${csvLines.join("\n")}\n`);

  const failures = results.filter(row => row.result !== "PASS");
  const markdown = [
    "# Internal Link Check",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    `- Result: ${failures.length === 0 ? "PASS" : "FAIL"}`,
    `- Internal links checked: ${results.length}`,
    `- Failures: ${failures.length}`,
    "",
  ];

  if (failures.length > 0) {
    markdown.push("## Failures", "");
    for (const failure of failures) {
      markdown.push(
        `- ${failure.source}: ${failure.link} -> ${failure.normalizedPath}`
      );
    }
    markdown.push("");
  }

  fs.writeFileSync(markdownReportPath, `${markdown.join("\n")}\n`);
}

function main() {
  if (!fs.existsSync(distRoot)) {
    throw new Error("Missing dist/. Run npm run build first.");
  }

  const htmlFiles = walk(distRoot, filePath => filePath.endsWith(".html"));
  const redirects = parseRedirects(redirectsPath);
  const seen = new Set();
  const results = [];

  for (const htmlFile of htmlFiles) {
    const source = path.relative(distRoot, htmlFile);
    const html = fs.readFileSync(htmlFile, "utf8");

    for (const link of extractLinks(html)) {
      const normalizedPath = normalizeInternalPath(link);
      if (!normalizedPath) continue;

      const key = `${source}\0${link}\0${normalizedPath}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        source,
        link,
        normalizedPath,
        result: linkResolves(normalizedPath, redirects) ? "PASS" : "FAIL",
      });
    }
  }

  writeReports(results);

  const failures = results.filter(row => row.result !== "PASS");
  console.log(
    `Internal link check: ${failures.length === 0 ? "PASS" : "FAIL"}`
  );
  console.log(`Internal links checked: ${results.length}`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Report: ${markdownReportPath}`);
  console.log(`CSV: ${csvReportPath}`);

  if (failures.length > 0) process.exitCode = 1;
}

main();
