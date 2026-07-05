import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const repoRoot = path.resolve(import.meta.dirname, "..");
const postsRoot = path.join(repoRoot, "src/content/posts");
const reportsRoot = path.join(repoRoot, "reports");
const checklistPath = path.join(reportsRoot, "content-review-checklist.md");
const csvPath = path.join(reportsRoot, "content-review-summary.csv");

const representativeSlugs = [
  {
    path: "2021/09/12/proxmox-introduction.md",
    reason: "latest post, local ogImage",
  },
  {
    path: "2021/03/11/er-x-dnsmasq.md",
    reason: "recent technical note, shell code blocks, local ogImage",
  },
  {
    path: "2020/02/02/kubernetes-meetup-no27.md",
    reason: "raw HTML embeds: YouTube, SlideShare, Speaker Deck, Twitter",
  },
  {
    path: "2020/04/22/terraform-libvirt-practice.md",
    reason: "code-heavy infrastructure article",
  },
  {
    path: "2020/04/13/wasm-rust-getting-started.md",
    reason: "remote ogImage, Rust/WebAssembly code",
  },
  {
    path: "2019/12/16/rook-edgefs-deploy-to-kubernates.md",
    reason: "images, shell snippets, legacy misspelled slug to preserve",
  },
  {
    path: "2019/12/25/rook-edgefs-isgw.md",
    reason: "many screenshots and long command blocks",
  },
  {
    path: "2019/08/13/netapptrident-19.07-new-features.md",
    reason: "dot in slug and canonical URL, local image",
  },
  {
    path: "2019/05/05/trident-19.04-19.04.1-update.md",
    reason: "multiple dots in slug and canonical URL",
  },
  {
    path: "2019/03/11/Introduction-to-servicemesh-part1.md",
    reason: "case-sensitive slug preservation",
  },
];

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
    body: normalized.slice(match[0].length),
  };
}

function isRemote(target) {
  return /^(https?:)?\/\//i.test(target) || /^[a-z][a-z0-9+.-]*:/i.test(target);
}

function stripHash(target) {
  return target.split("#")[0];
}

function cleanTarget(target) {
  return stripHash(target.trim().replace(/^<|>$/g, ""));
}

function findMarkdownImages(body) {
  return [...body.matchAll(/!\[[^\]]*]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    match => cleanTarget(match[1])
  );
}

function findMarkdownLinks(body) {
  return [...body.matchAll(/(?<!!)\[[^\]]+]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map(
    match => cleanTarget(match[1])
  );
}

function countMatches(body, pattern) {
  return [...body.matchAll(pattern)].length;
}

function canonicalUrlFor(relativePath) {
  const parsed = path.parse(relativePath);
  return `/${parsed.dir}/${parsed.name}/`;
}

function verifyLocalAssets(filePath, targets) {
  return targets
    .filter(target => target && !isRemote(target) && !target.startsWith("/"))
    .map(target => {
      const fullPath = path.resolve(path.dirname(filePath), target);
      return { target, exists: fs.existsSync(fullPath) };
    });
}

function postStats(filePath) {
  const source = fs.readFileSync(filePath, "utf8");
  const { frontmatter, body } = splitFrontmatter(source, filePath);
  const relativePath = path.relative(postsRoot, filePath);
  const images = findMarkdownImages(body);
  const links = findMarkdownLinks(body);
  const localAssets = verifyLocalAssets(
    filePath,
    [...images, String(frontmatter.ogImage ?? "")].filter(Boolean)
  );

  return {
    relativePath,
    canonicalUrl: canonicalUrlFor(relativePath),
    title: String(frontmatter.title ?? path.parse(filePath).name).trim(),
    pubDatetime: String(frontmatter.pubDatetime ?? ""),
    imageCount: images.length,
    codeFenceCount: countMatches(body, /^```/gm),
    iframeCount: countMatches(body, /<iframe\b/gi),
    scriptCount: countMatches(body, /<script\b/gi),
    blockquoteCount: countMatches(body, /<blockquote\b/gi),
    linkCount: links.length,
    hasOgImage: Boolean(frontmatter.ogImage),
    remoteOgImage: isRemote(String(frontmatter.ogImage ?? "")),
    localAssetMissing: localAssets.filter(asset => !asset.exists),
  };
}

function csvEscape(value) {
  const raw = String(value ?? "");
  return /[",\n]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function writeCsv(stats) {
  const header = [
    "path",
    "canonicalUrl",
    "title",
    "pubDatetime",
    "images",
    "codeFences",
    "iframes",
    "scripts",
    "blockquotes",
    "links",
    "hasOgImage",
    "remoteOgImage",
    "missingLocalAssets",
  ];
  const lines = [
    header.map(csvEscape).join(","),
    ...stats.map(post =>
      [
        post.relativePath,
        post.canonicalUrl,
        post.title,
        post.pubDatetime,
        post.imageCount,
        post.codeFenceCount,
        post.iframeCount,
        post.scriptCount,
        post.blockquoteCount,
        post.linkCount,
        post.hasOgImage,
        post.remoteOgImage,
        post.localAssetMissing.map(asset => asset.target).join(" "),
      ]
        .map(csvEscape)
        .join(",")
    ),
  ];
  fs.writeFileSync(csvPath, `${lines.join("\n")}\n`);
}

function writeChecklist(stats) {
  const byPath = new Map(stats.map(post => [post.relativePath, post]));
  const missingAssets = stats.flatMap(post =>
    post.localAssetMissing.map(asset => `${post.relativePath}: ${asset.target}`)
  );
  const postsWithOgImage = stats.filter(post => post.hasOgImage).length;
  const embeddedPosts = stats
    .filter(
      post => post.iframeCount + post.scriptCount + post.blockquoteCount > 0
    )
    .sort(
      (a, b) => b.iframeCount + b.scriptCount - (a.iframeCount + a.scriptCount)
    );

  const lines = [
    "# Content Review Checklist",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## Machine Summary",
    "",
    `- Posts scanned: ${stats.length}`,
    `- Posts with per-post ogImage: ${postsWithOgImage}`,
    `- Local asset reference failures: ${missingAssets.length}`,
    `- Posts with raw HTML embeds: ${embeddedPosts.length}`,
    `- CSV detail: reports/content-review-summary.csv`,
    "",
    "## Representative Posts For Human Review",
    "",
  ];

  for (const item of representativeSlugs) {
    const post = byPath.get(item.path);
    if (!post) {
      lines.push(`- [ ] MISSING: ${item.path}`);
      continue;
    }
    lines.push(`- [ ] ${post.title}`);
    lines.push(`  - URL: ${post.canonicalUrl}`);
    lines.push(`  - Source: src/content/posts/${post.relativePath}`);
    lines.push(`  - Why: ${item.reason}`);
    lines.push(
      `  - Check: images ${post.imageCount}, code fences ${post.codeFenceCount}, iframes ${post.iframeCount}, scripts ${post.scriptCount}, blockquotes ${post.blockquoteCount}`
    );
  }

  lines.push("", "## What To Look For", "");
  lines.push("- Code blocks render as code and do not swallow nearby prose.");
  lines.push(
    "- Posts with ogImage show a cover image below the article title."
  );
  lines.push(
    "- Images appear in the expected places and do not overflow on mobile."
  );
  lines.push(
    "- Raw embeds are visible or fail gracefully with a useful fallback link."
  );
  lines.push("- Case-sensitive and dotted slugs keep the exact expected URL.");
  lines.push(
    "- The article title, date, tags, RSS entry, and share metadata look reasonable."
  );

  lines.push("", "## Machine Findings", "");
  if (missingAssets.length === 0) {
    lines.push("- No missing local image or ogImage references were found.");
  } else {
    for (const item of missingAssets)
      lines.push(`- Missing local asset: ${item}`);
  }

  if (embeddedPosts.length > 0) {
    lines.push("", "## Raw HTML Embed Posts", "");
    for (const post of embeddedPosts) {
      lines.push(
        `- ${post.canonicalUrl}: iframes ${post.iframeCount}, scripts ${post.scriptCount}, blockquotes ${post.blockquoteCount}`
      );
    }
  }

  fs.writeFileSync(checklistPath, `${lines.join("\n")}\n`);
}

function main() {
  const stats = walk(postsRoot, filePath => filePath.endsWith(".md"))
    .sort()
    .map(postStats);

  fs.mkdirSync(reportsRoot, { recursive: true });
  writeCsv(stats);
  writeChecklist(stats);

  const missingAssets = stats.reduce(
    (total, post) => total + post.localAssetMissing.length,
    0
  );
  console.log(`Content review prepared for ${stats.length} posts.`);
  console.log(`Representative posts: ${representativeSlugs.length}.`);
  console.log(`Missing local asset references: ${missingAssets}.`);
  console.log(`Checklist: ${checklistPath}`);
  console.log(`CSV: ${csvPath}`);
  if (missingAssets > 0) process.exitCode = 1;
}

main();
