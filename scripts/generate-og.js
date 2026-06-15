#!/usr/bin/env node

/*
 * Generates an Open Graph image for social previews.
 *
 * The output is a normal 1200x630 PNG. The script uses an SVG template
 * because SVG text is easy to edit and Sharp can render it reliably.
 */

const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const projectRoot = path.resolve(__dirname, "..");
const defaultOutput = path.join(projectRoot, "og-image.png");
const outputArgIndex = process.argv.indexOf("--out");
const outputPath = outputArgIndex === -1
  ? defaultOutput
  : path.resolve(projectRoot, process.argv[outputArgIndex + 1] || "og-image.png");

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function readSiteData() {
  const filePath = path.join(projectRoot, "data", "site.json");
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildSvg(site) {
  const title = escapeXml(site.projectName || "Upcycling Patterns");
  const subtitle = escapeXml("Erasmus+ KA210-SCH");
  const description = escapeXml("Renew · Reuse · Reimagine");

  return `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1a14"/>
      <stop offset="0.52" stop-color="#1f6040"/>
      <stop offset="1" stop-color="#174ea6"/>
    </linearGradient>
    <radialGradient id="glow" cx="74%" cy="34%" r="58%">
      <stop offset="0" stop-color="#b8ff7a" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#b8ff7a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <circle cx="930" cy="160" r="220" fill="#ffffff" opacity="0.08"/>
  <circle cx="1010" cy="490" r="180" fill="#f4b740" opacity="0.18"/>
  <path d="M80 495 C250 370 420 560 610 410 C770 285 870 330 1120 210" fill="none" stroke="#ffffff" stroke-opacity="0.18" stroke-width="8"/>
  <text x="82" y="142" fill="#ffe7a8" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="800">${subtitle}</text>
  <text x="78" y="300" fill="#ffffff" font-family="Inter, Arial, sans-serif" font-size="96" font-weight="900">${title}</text>
  <text x="84" y="392" fill="#d8ffe8" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="800">${description}</text>
  <text x="84" y="514" fill="#ffffff" fill-opacity="0.72" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700">Sustainability · Climate Action · Creative Upcycling</text>
</svg>`;
}

async function main() {
  const site = readSiteData();
  const svg = Buffer.from(buildSvg(site));

  await sharp(svg)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);

  console.log(`Generated ${path.relative(projectRoot, outputPath)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
