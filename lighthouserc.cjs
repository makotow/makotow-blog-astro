const fs = require("node:fs");

const macChromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      ...(fs.existsSync(macChromePath) ? { chromePath: macChromePath } : {}),
      url: [
        "http://localhost/",
        "http://localhost/2026/07/06/hugo-to-astro-with-ai-agent/",
        "http://localhost/search/",
      ],
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--no-sandbox --headless=new",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.75 }],
        "categories:accessibility": ["warn", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./reports/lighthouse",
      reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
    },
  },
};
