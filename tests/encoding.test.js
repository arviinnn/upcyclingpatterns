const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const { projectRoot } = require("./helpers/static-server");

/*
 * Mojibake is text that was decoded with the wrong character set.
 * It usually appears as three-character sequences for punctuation or
 * two-character sequences for Turkish letters. This test keeps those
 * mistakes from returning in user-facing text, code comments, and docs.
 */

const TEXT_EXTENSIONS = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".md",
  ".toml",
  ".txt",
  ".xml",
  ".xsl",
  ".yml"
]);

const TEXT_FILE_NAMES = new Set(["_headers", "_redirects", "LICENSE"]);
const IGNORED_DIRS = new Set([".git", "dist", "node_modules"]);
const MOJIBAKE_PATTERN = new RegExp(
  "(?:\\u00c3.|\\u00c2.|\\u00e2[\\u0080-\\u00ff].|\\u00c4[^\\s]|\\u00c5[^\\s])"
);

function isTextFile(filePath) {
  return TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase()) ||
    TEXT_FILE_NAMES.has(path.basename(filePath));
}

function collectTextFiles(directory) {
  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        files.push(...collectTextFiles(path.join(directory, entry.name)));
      }
      continue;
    }

    const filePath = path.join(directory, entry.name);
    if (isTextFile(filePath)) files.push(filePath);
  }

  return files;
}

test("source text files do not contain common mojibake sequences", () => {
  const offenders = [];

  for (const filePath of collectTextFiles(projectRoot)) {
    const relativePath = path.relative(projectRoot, filePath).replace(/\\/g, "/");
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      if (MOJIBAKE_PATTERN.test(line)) {
        offenders.push(`${relativePath}:${index + 1}: ${line.trim()}`);
      }
    });
  }

  assert.deepEqual(offenders, []);
});
