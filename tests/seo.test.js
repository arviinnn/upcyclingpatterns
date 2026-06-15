const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const sharp = require("sharp");
const { projectRoot } = require("./helpers/static-server");

const publicHtmlFiles = [
  "index.html",
  "404.html",
  "accessibility.html",
  "cookie-policy.html",
  "funding-disclaimer.html",
  "privacy-policy.html",
  "success.html",
  "terms.html"
];

test("public pages expose canonical URLs and Google-compatible favicons", () => {
  for (const fileName of publicHtmlFiles) {
    const html = fs.readFileSync(path.join(projectRoot, fileName), "utf8");
    assert.match(html, /<link rel="canonical" href="https:\/\/upcyclingpatterns\.com\//);
    assert.match(html, /sizes="48x48" href="\/favicon-48x48\.png"/);
  }
});

test("favicon and manifest icons have the declared PNG format and dimensions", async () => {
  const expectedIcons = new Map([
    ["favicon-48x48.png", 48],
    ["favicon-96x96.png", 96],
    ["images/pwa/icon-192.png", 192],
    ["images/pwa/icon-512.png", 512]
  ]);

  for (const [relativePath, expectedSize] of expectedIcons) {
    const metadata = await sharp(path.join(projectRoot, relativePath)).metadata();
    assert.equal(metadata.format, "png", `${relativePath} must contain PNG data.`);
    assert.equal(metadata.width, expectedSize, `${relativePath} has the wrong width.`);
    assert.equal(metadata.height, expectedSize, `${relativePath} has the wrong height.`);
  }
});

test("homepage assets are root-relative so /tr/ cannot break CSS, JS, or images", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const assetAttributes = Array.from(html.matchAll(/(?:href|src)="([^"]+)"/g), (match) => match[1]);
  const brokenRelativeAssets = assetAttributes.filter((value) => {
    if (/^(?:https?:|mailto:|tel:|#|\/|data:|blob:)/.test(value)) return false;
    return /\.(?:css|js|png|jpe?g|webp|gif|svg|ico)(?:\?|$)/i.test(value);
  });

  assert.deepEqual(brokenRelativeAssets, []);
});

test("sitemap and redirects use one secure canonical host", () => {
  const sitemap = fs.readFileSync(path.join(projectRoot, "sitemap.xml"), "utf8");
  const redirects = fs.readFileSync(path.join(projectRoot, "_redirects"), "utf8");
  const netlify = fs.readFileSync(path.join(projectRoot, "netlify.toml"), "utf8");

  assert.doesNotMatch(sitemap, /<loc>http:\/\//);
  assert.doesNotMatch(sitemap, /<loc>https:\/\/www\./);
  assert.match(redirects, /^\/tr\s+\/tr\/\s+301$/m);
  assert.match(redirects, /^\/tr\/\s+\/index\.html\s+200$/m);
  assert.doesNotMatch(redirects, /^\/tr\/\*\s+/m);
  assert.match(redirects, /^https:\/\/www\.upcyclingpatterns\.com\/\*\s+\/:splat\s+200!$/m);
  assert.doesNotMatch(redirects, /^https?:\/\/[^\s]+\s+[^\s]+\s+30[12]/m, "Host aliases must not create cached redirect loops.");
  assert.match(netlify, /from\s*=\s*"https:\/\/www\.upcyclingpatterns\.com\/\*"[\s\S]*?status\s*=\s*200[\s\S]*?force\s*=\s*true/);
});

test("homepage structured data is valid JSON", () => {
  const html = fs.readFileSync(path.join(projectRoot, "index.html"), "utf8");
  const blocks = Array.from(
    html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g),
    (match) => match[1]
  );

  assert.ok(blocks.length > 0, "Homepage must include structured data.");
  for (const block of blocks) assert.doesNotThrow(() => JSON.parse(block));
});
