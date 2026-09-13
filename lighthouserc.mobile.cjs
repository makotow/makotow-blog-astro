const { createLighthouseConfig } = require("./lighthouse-config.cjs");

module.exports = createLighthouseConfig({
  outputDir: "./reports/lighthouse/mobile",
});
