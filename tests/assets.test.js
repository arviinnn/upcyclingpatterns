const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const sharp = require("sharp");
const { projectRoot } = require("./helpers/static-server");

function localFileFromReference(reference, sourceFile) {
  const cleanReference = reference.split("#")[0].split("?")[0].trim();
  if (!cleanReference || /^(?:[a-z]+:|\/\/|#)/i.test(cleanReference)) return null;

  const relativePath = cleanReference.startsWith("/")
    ? cleanReference.slice(1)
    : path.join(path.dirname(sourceFile), cleanReference);

  return path.normalize(relativePath);
}

test("local HTML and CSS asset references resolve to real files", () => {
  const sourceFiles = fs
    .readdirSync(projectRoot)
    .filter((fileName) => /\.(?:html|css)$/i.test(fileName));
  const missing = [];

  for (const sourceFile of sourceFiles) {
    const source = fs.readFileSync(path.join(projectRoot, sourceFile), "utf8");
    const references = sourceFile.endsWith(".css")
      ? Array.from(source.matchAll(/url\(["']?([^"')]+)["']?\)/g), (match) => match[1])
      : Array.from(source.matchAll(/(?:href|src|poster)="([^"]+)"/g), (match) => match[1]);

    for (const reference of references) {
      const relativePath = localFileFromReference(reference, sourceFile);
      if (!relativePath || !path.extname(relativePath)) continue;
      if (!fs.existsSync(path.join(projectRoot, relativePath))) {
        missing.push(`${sourceFile}: ${reference}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test("manifest and service-worker static assets resolve to real files", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "manifest.json"), "utf8"));
  const serviceWorker = fs.readFileSync(path.join(projectRoot, "sw.js"), "utf8");
  const references = [
    ...manifest.icons.map((icon) => icon.src),
    ...Array.from(serviceWorker.matchAll(/^\s*"(\/[^"\n]+)",?$/gm), (match) => match[1])
  ];
  const missing = [];

  for (const reference of references) {
    if (reference === "/") continue;
    const relativePath = reference.split("#")[0].split("?")[0].replace(/^\//, "");
    if (!fs.existsSync(path.join(projectRoot, relativePath))) missing.push(reference);
  }

  assert.deepEqual(missing, []);
});

test("CMS data local media references resolve to real files", () => {
  const dataDir = path.join(projectRoot, "data");
  const missing = [];

  function visit(value, sourceFile) {
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, sourceFile));
      return;
    }
    if (value && typeof value === "object") {
      Object.values(value).forEach((item) => visit(item, sourceFile));
      return;
    }
    if (typeof value !== "string" || !value.startsWith("/")) return;
    const relativePath = value.split("#")[0].split("?")[0].replace(/^\/+/, "");
    if (!path.extname(relativePath)) return;
    if (!fs.existsSync(path.join(projectRoot, relativePath))) {
      missing.push(`${sourceFile}: ${value}`);
    }
  }

  for (const fileName of fs.readdirSync(dataDir).filter((name) => name.endsWith(".json"))) {
    const payload = JSON.parse(fs.readFileSync(path.join(dataDir, fileName), "utf8"));
    visit(payload, `data/${fileName}`);
  }

  assert.deepEqual(missing, []);
});

test("frontend accepts compressed inline CMS image values", () => {
  const script = fs.readFileSync(path.join(projectRoot, "script.js"), "utf8");

  assert.match(script, /data:image\\\/\(\?:webp\|png\|jpeg\);base64/);
  assert.match(script, /url\.length\s*<=\s*600000/);
});

test("HTML ids are unique within each document", () => {
  const htmlFiles = fs.readdirSync(projectRoot).filter((fileName) => fileName.endsWith(".html"));

  for (const fileName of htmlFiles) {
    const html = fs.readFileSync(path.join(projectRoot, fileName), "utf8");
    const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), (match) => match[1]);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    assert.deepEqual(duplicates, [], `${fileName} contains duplicate ids.`);
  }
});

test("image file extensions match their encoded format", async () => {
  const expectedExtensions = {
    jpeg: new Set([".jpeg", ".jpg"]),
    png: new Set([".png"]),
    webp: new Set([".webp"])
  };

  function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : [entryPath];
    });
  }

  const imageFiles = walk(path.join(projectRoot, "images"))
    .filter((filePath) => /\.(?:jpe?g|png|webp)$/i.test(filePath));

  for (const filePath of imageFiles) {
    const metadata = await sharp(filePath).metadata();
    const extension = path.extname(filePath).toLowerCase();
    assert.ok(
      expectedExtensions[metadata.format] && expectedExtensions[metadata.format].has(extension),
      `${path.relative(projectRoot, filePath)} contains ${metadata.format} data with a ${extension} extension.`
    );
  }
});

test("legacy duplicate image copies and generated dist files stay removed", () => {
  const removedPaths = [
    "dist",
    "images/apple-touch-icon.png",
    "images/branding/logo-sozlu.jpeg",
    "images/icon-192.png",
    "images/icon-512.png",
    "images/icon-maskable-512.png",
    "images/pwa/favicon.png"
  ];

  for (const relativePath of removedPaths) {
    assert.equal(fs.existsSync(path.join(projectRoot, relativePath)), false, `${relativePath} should not be restored.`);
  }
});
