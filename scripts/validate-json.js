#!/usr/bin/env node

/*
 * Validates every JSON file in data/ and the root manifest.
 *
 * Editors mostly work through Decap CMS, but a broken JSON file can still
 * happen after a manual edit. This script fails fast before deployment.
 */

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const jsonFiles = [
  path.join(projectRoot, "manifest.json"),
  ...fs
    .readdirSync(path.join(projectRoot, "data"))
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join(projectRoot, "data", file))
];

const requiredDataFiles = [
  "content.json",
  "design.json",
  "faq.json",
  "gallery.json",
  "logos.json",
  "mobility.json",
  "news.json",
  "outputs.json",
  "partners.json",
  "sections.json",
  "site.json",
  "team.json",
  "timeline.json"
];

const listDataFiles = new Set([
  "faq.json",
  "gallery.json",
  "mobility.json",
  "news.json",
  "outputs.json",
  "partners.json",
  "team.json",
  "timeline.json"
]);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function readJson(filePath) {
  const label = path.relative(projectRoot, filePath);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${label} is not valid JSON: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertPlainObject(value, label) {
  assert(isPlainObject(value), `${label} must be a JSON object.`);
}

function assertObjectArray(value, label) {
  assert(Array.isArray(value), `${label} must be an array.`);
  value.forEach((item, index) => assertPlainObject(item, `${label}[${index}]`));
}

function validateStrings(value, label) {
  if (typeof value === "string") {
    assert(!/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value), `${label} contains unsupported control characters.`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateStrings(item, `${label}[${index}]`));
    return;
  }
  if (isPlainObject(value)) {
    Object.entries(value).forEach(([key, item]) => validateStrings(item, `${label}.${key}`));
  }
}

function validateOptionalEmail(value, label) {
  if (value === undefined || value === null || value === "") return;
  assert(typeof value === "string" && value.length <= 254 && EMAIL_PATTERN.test(value), `${label} must be a valid email address.`);
}

function validateOptionalHttpsUrl(value, label) {
  if (value === undefined || value === null || value === "") return;
  assert(typeof value === "string", `${label} must be a string URL.`);
  let parsed;
  try {
    parsed = new URL(value);
  } catch (error) {
    throw new Error(`${label} must be a valid URL.`);
  }
  assert(parsed.protocol === "https:", `${label} must use HTTPS.`);
}

function validateOptionalPublicAsset(value, label) {
  if (value === undefined || value === null || value === "") return;
  assert(typeof value === "string", `${label} must be a string path.`);
  if (/^https:\/\//i.test(value)) return;
  assert(value.startsWith("/") && !value.startsWith("//"), `${label} must be root-relative or HTTPS.`);
  assert(!value.includes("\\"), `${label} must not contain backslashes.`);
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch (error) {}
  assert(!decoded.split("/").includes(".."), `${label} must not contain path traversal.`);
}

function validateListFile(fileName, payload) {
  if (!listDataFiles.has(fileName)) return;
  assertObjectArray(payload.items, `data/${fileName}.items`);
}

function validateSite(payload) {
  assertPlainObject(payload, "data/site.json");
  assert(typeof payload.projectName === "string" && payload.projectName.trim(), "data/site.json needs projectName.");
  assert(typeof payload.heroImage === "string" && payload.heroImage.trim(), "data/site.json needs heroImage.");
  assert(isIsoDate(payload.startDate), "data/site.json startDate must be a real YYYY-MM-DD date.");
  assert(isIsoDate(payload.endDate), "data/site.json endDate must be a real YYYY-MM-DD date.");
  assert(payload.startDate <= payload.endDate, "data/site.json startDate must not be after endDate.");
  validateOptionalEmail(payload.projectEmail, "data/site.json projectEmail");
  validateOptionalPublicAsset(payload.heroImage, "data/site.json heroImage");
  if (isPlainObject(payload.social)) {
    Object.entries(payload.social).forEach(([key, value]) => validateOptionalHttpsUrl(value, `data/site.json social.${key}`));
  }
  if (isPlainObject(payload.seo)) validateOptionalPublicAsset(payload.seo.image, "data/site.json seo.image");
}

function isIsoDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isIsoMonth(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}$/.test(value)) return false;
  const month = Number(value.slice(5));
  return month >= 1 && month <= 12;
}

function validateManifest(payload) {
  assertPlainObject(payload, "manifest.json");
  assert(payload.name && payload.short_name, "manifest.json needs name and short_name.");
  assert(Array.isArray(payload.icons) && payload.icons.length >= 2, "manifest.json needs install icons.");
  assert(typeof payload.start_url === "string" && payload.start_url.startsWith("/"), "manifest.json needs a root-relative start_url.");
  assert(typeof payload.scope === "string" && payload.scope.startsWith("/"), "manifest.json needs a root-relative scope.");
  payload.icons.forEach((icon, index) => {
    assertPlainObject(icon, `manifest.json icons[${index}]`);
    validateOptionalPublicAsset(icon.src, `manifest.json icons[${index}].src`);
    assert(/^image\/(?:png|jpeg|webp)$/.test(icon.type || ""), `manifest.json icons[${index}] needs a supported image type.`);
    assert(icon.sizes === "any" || /^\d+x\d+$/.test(icon.sizes || ""), `manifest.json icons[${index}] has invalid sizes.`);
  });
}

function validateSections(payload) {
  assertPlainObject(payload, "data/sections.json");
  for (const key of ["aboutCards", "missionItems", "goals", "timeline", "activities", "results", "details"]) {
    assertObjectArray(payload[key], `data/sections.json ${key}`);
  }
}

function validateLogos(payload) {
  assertPlainObject(payload, "data/logos.json");
  assertObjectArray(payload.official, "data/logos.json official");
  payload.official.forEach((item, index) => validateOptionalPublicAsset(item.image, `data/logos.json official[${index}].image`));
}

function validateContent(payload) {
  assertPlainObject(payload, "data/content.json");
  assertPlainObject(payload.labels, "data/content.json labels");
  Object.entries(payload.labels).forEach(([key, value]) => {
    assert(typeof value === "string" && value.trim(), `data/content.json labels.${key} must be a non-empty string.`);
  });
}

function validateDesign(payload) {
  assertPlainObject(payload, "data/design.json");
  assertPlainObject(payload.layout, "data/design.json layout");
  assertPlainObject(payload.hotspots, "data/design.json hotspots");
}

function validateKnownItemFields(fileName, payload) {
  if (!Array.isArray(payload.items)) return;
  payload.items.forEach((item, index) => {
    const label = `data/${fileName} items[${index}]`;
    for (const key of ["image", "logo", "photo", "file"]) validateOptionalPublicAsset(item[key], `${label}.${key}`);
    for (const key of ["website", "url", "youtubeUrl"]) validateOptionalHttpsUrl(item[key], `${label}.${key}`);
    validateOptionalEmail(item.email, `${label}.email`);
    for (const key of ["date", "startDate", "endDate"]) {
      if (item[key] !== undefined && item[key] !== null && item[key] !== "") {
        const validDate = key === "date" ? isIsoDate(item[key]) || isIsoMonth(item[key]) : isIsoDate(item[key]);
        assert(validDate, `${label}.${key} must be a real YYYY-MM or YYYY-MM-DD date.`);
      }
    }
    if (item.startDate && item.endDate) assert(item.startDate <= item.endDate, `${label} startDate must not be after endDate.`);
  });
}

for (const fileName of requiredDataFiles) {
  const filePath = path.join(projectRoot, "data", fileName);
  assert(fs.existsSync(filePath), `Missing required data file: data/${fileName}`);
}

for (const filePath of jsonFiles) {
  const payload = readJson(filePath);
  const fileName = path.basename(filePath);

  assertPlainObject(payload, fileName === "manifest.json" ? "manifest.json" : `data/${fileName}`);
  validateStrings(payload, fileName === "manifest.json" ? "manifest.json" : `data/${fileName}`);

  if (fileName === "site.json") validateSite(payload);
  if (fileName === "manifest.json") validateManifest(payload);
  if (fileName === "sections.json") validateSections(payload);
  if (fileName === "logos.json") validateLogos(payload);
  if (fileName === "content.json") validateContent(payload);
  if (fileName === "design.json") validateDesign(payload);
  validateListFile(fileName, payload);
  validateKnownItemFields(fileName, payload);
}

console.log(`JSON validation passed for ${jsonFiles.length} files.`);
