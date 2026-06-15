#!/usr/bin/env node

/*
 * Runs production checks without creating ignored build artifacts.
 * The website is deployed directly from the repository root.
 */

const path = require("path");
const { spawnSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const nodeBin = process.execPath;

function run(label, args) {
  console.log(`\n> ${label}`);
  const result = spawnSync(nodeBin, args, {
    cwd: projectRoot,
    stdio: "inherit",
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("Validate JSON data", ["scripts/validate-json.js"]);
run("Validate image assets", ["scripts/validate-assets.js"]);
run("Check application JavaScript", ["--check", "script.js"]);
run("Check service worker", ["--check", "sw.js"]);
run("Check translation function", ["--check", "netlify/functions/translate.js"]);

console.log("\nBuild checks finished successfully.");
