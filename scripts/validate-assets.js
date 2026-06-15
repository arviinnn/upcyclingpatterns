#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");
const imageExtensions = new Set([".jpeg", ".jpg", ".png", ".webp"]);
const expectedExtensions = {
  jpeg: new Set([".jpeg", ".jpg"]),
  png: new Set([".png"]),
  webp: new Set([".webp"])
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
}

async function metadataFor(relativePath) {
  const filePath = path.join(projectRoot, relativePath.replace(/^\/+/, ""));
  assert(fs.existsSync(filePath), `Missing image asset: ${relativePath}`);
  return sharp(filePath).metadata();
}

async function validateImageExtensions() {
  const imageFiles = walk(path.join(projectRoot, "images"))
    .filter((filePath) => imageExtensions.has(path.extname(filePath).toLowerCase()));

  for (const filePath of imageFiles) {
    const metadata = await sharp(filePath).metadata();
    const extension = path.extname(filePath).toLowerCase();
    const allowed = expectedExtensions[metadata.format];
    const label = path.relative(projectRoot, filePath);
    assert(allowed && allowed.has(extension), `${label} has ${extension} extension but contains ${metadata.format} data.`);
  }
}

async function validateManifestIcons() {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));
  assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, "manifest.json needs at least one icon.");

  for (const icon of manifest.icons) {
    assert(icon && typeof icon.src === "string", "Every manifest icon needs a src value.");
    const metadata = await metadataFor(icon.src);
    const actualType = `image/${metadata.format}`;
    assert(icon.type === actualType, `${icon.src} declares ${icon.type} but contains ${actualType}.`);

    if (/^\d+x\d+$/.test(icon.sizes || "")) {
      const [width, height] = icon.sizes.split("x").map(Number);
      assert(metadata.width === width && metadata.height === height, `${icon.src} does not match declared size ${icon.sizes}.`);
    }
  }
}

async function validateSocialImage() {
  const metadata = await metadataFor("/og-image.png");
  assert(metadata.format === "png", "og-image.png must contain PNG data.");
  assert(metadata.width === 1200 && metadata.height === 630, "og-image.png must be 1200x630.");
}

async function main() {
  await validateImageExtensions();
  await validateManifestIcons();
  await validateSocialImage();
  console.log("Image asset validation passed.");
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
