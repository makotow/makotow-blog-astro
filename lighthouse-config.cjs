const fs = require("node:fs");

const macChromePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const urls = [
  "http://localhost/",
  "http://localhost/2026/07/06/hugo-to-astro-with-ai-agent/",
  "http://localhost/search/",
];

function createLighthouseConfig({ preset, outputDir }) {
  return {
    ci: {
      collect: {
        staticDistDir: "./dist",
        ...(fs.existsSync(macChromePath) ? { chromePath: macChromePath } : {}),
        url: urls,
        numberOfRuns: 2,
        settings: {
          ...(preset ? { preset } : {}),
          chromeFlags: "--no-sandbox --headless=new",
        },
      },
      assert: {
        aggregationMethod: "median-run",
        assertions: {
          "categories:performance": ["error", { minScore: 0.9 }],
          "categories:accessibility": ["error", { minScore: 0.9 }],
          "categories:best-practices": ["error", { minScore: 0.9 }],
          "categories:seo": ["error", { minScore: 0.9 }],
        },
      },
      upload: {
        target: "filesystem",
        outputDir,
        reportFilenamePattern: "%%PATHNAME%%-%%DATETIME%%.report.%%EXTENSION%%",
      },
    },
  };
}

module.exports = { createLighthouseConfig };
