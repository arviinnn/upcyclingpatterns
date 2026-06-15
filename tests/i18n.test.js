const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const { projectRoot } = require("./helpers/static-server");

function collectI18nKeysFromHtml() {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const keys = new Set();
  const patterns = [
    /data-i18n="([^"]+)"/g,
    /data-i18n-placeholder="([^"]+)"/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html))) keys.add(match[1]);
  }

  return Array.from(keys).sort();
}

function findObjectBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Could not find ${marker}`);

  const start = source.indexOf("{", markerIndex);
  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = start; index < source.length; index++) {
    const char = source[index];

    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }

    if (char === "\"" || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "{") depth++;
    if (char === "}") depth--;
    if (depth === 0) return source.slice(start, index + 1);
  }

  throw new Error(`Could not close object block for ${marker}`);
}

function collectTranslationKeys(language) {
  const script = fs.readFileSync(path.join(projectRoot, "script.js"), "utf8");
  const block = findObjectBlock(script, `${language}:`);
  const keys = new Set();
  const pattern = /^\s*([A-Za-z0-9_]+)\s*:/gm;
  let match;

  while ((match = pattern.exec(block))) keys.add(match[1]);

  return keys;
}

test("all HTML i18n keys exist in English and Turkish dictionaries", () => {
  const htmlKeys = collectI18nKeysFromHtml();
  const enKeys = collectTranslationKeys("en");
  const trKeys = collectTranslationKeys("tr");

  const missingEnglish = htmlKeys.filter((key) => !enKeys.has(key));
  const missingTurkish = htmlKeys.filter((key) => !trKeys.has(key));

  assert.deepEqual(missingEnglish, [], "Missing English translation keys");
  assert.deepEqual(missingTurkish, [], "Missing Turkish translation keys");
});
