const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const { projectRoot } = require("./helpers/static-server");

/*
 * The admin panel depends on Decap CMS reading admin/config.yml and writing
 * uploaded media into images/uploads. These checks catch deployment-breaking
 * mistakes before the site is zipped or published.
 */

test("admin config and upload folder are deploy-ready", () => {
  const configPath = path.join(projectRoot, "admin", "config.yml");
  const uploadFolder = path.join(projectRoot, "images", "uploads");
  const keepFile = path.join(uploadFolder, ".gitkeep");
  const config = fs.readFileSync(configPath, "utf8");

  assert.match(config, /^backend:\s*$/m, "admin/config.yml must define the CMS backend.");
  assert.doesNotMatch(config, /^publish_mode:/m, "CMS must use Decap's reliable direct publishing default.");
  assert.match(config, /^media_folder:\s*"images\/uploads"\s*$/m, "CMS uploads must target images/uploads.");
  assert.doesNotMatch(
    config,
    /^media_library:\s*$/m,
    "Top-level media_library requires a custom provider name and otherwise breaks Decap CMS."
  );
  assert.ok(fs.existsSync(uploadFolder), "images/uploads folder must exist for CMS media uploads.");
  assert.ok(fs.existsSync(keepFile), "images/uploads/.gitkeep must keep the upload folder in the repository.");
});

test("admin YAML aliases are declared before they are used", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const declaredAnchors = new Set();

  config.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*#/.test(line)) return;

    for (const match of line.matchAll(/&([A-Za-z0-9_-]+)/g)) {
      declaredAnchors.add(match[1]);
    }

    for (const match of line.matchAll(/\*([A-Za-z0-9_-]+)/g)) {
      assert.ok(
        declaredAnchors.has(match[1]),
        `YAML alias *${match[1]} is used before &${match[1]} is declared on line ${index + 1}.`
      );
    }
  });
});

test("repeatable admin lists add one collapsed item without reopening old entries", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const repeatableLabels = ["Galeri İçerikleri", "Haberler", "Çıktılar", "Sorular"];

  for (const label of repeatableLabels) {
    const start = config.indexOf(`- label: "${label}"`);
    assert.notEqual(start, -1, `${label} list must exist.`);
    const block = config.slice(start, start + 1400);
    assert.match(block, /add_to_top:\s*true/, `${label} must add new entries at the top.`);
    assert.match(block, /minimize_collapsed:\s*true/, `${label} must keep old entries fully collapsed.`);
  }
});

test("admin menu is simplified to the requested public editing sections", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const visibleLabels = Array.from(
    config.matchAll(/^  - name:\s*"[^"]+"\r?\n\s+label:\s*"([^"]+)"/gm),
    (match) => match[1]
  );

  assert.deepEqual(visibleLabels, [
    "Uluslararası İş Birliğiyle Sürdürülebilirliği Öğrenmek",
    "Her Şey Tek Bir Yerde",
    "Galeri",
    "Haberler",
    "Çıktılar",
    "Sık Sorulan Sorular"
  ]);

  for (const removedLabel of [
    "Logolar",
    "Gelişmiş - Site Yazıları",
    "Gelişmiş - Tasarım Ayarları",
    "Hareketlilik Ziyaretleri",
    "Proje Ekibi",
    "Ortak Okullar"
  ]) {
    assert.doesNotMatch(config, new RegExp(`label:\\s*"${removedLabel}"`), `${removedLabel} must not appear in admin.`);
  }
});

test("remaining admin sections support direct photo upload and YouTube URLs", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");

  assert.match(config, /_section_card_fields:[\s\S]*?<<:\s*\*section_image[\s\S]*?name:\s*"youtubeUrl"/);

  const collectionOrder = ["explore_sections", "gallery", "news", "outputs", "faq"];
  for (let i = 0; i < collectionOrder.length; i++) {
    const name = collectionOrder[i];
    const start = config.indexOf(`- name: "${name}"`);
    const end = i + 1 < collectionOrder.length ? config.indexOf(`- name: "${collectionOrder[i + 1]}"`, start + 1) : config.length;
    assert.notEqual(start, -1, `${name} collection must exist.`);
    const block = config.slice(start, end);
    assert.match(block, /(?:<<:\s*\*(?:cover_image|section_image)|fields:\s*\*section_card_fields|name:\s*"image")/, `${name} must support photo upload.`);
    assert.match(block, /(?:fields:\s*\*section_card_fields|name:\s*"youtubeUrl")/, `${name} must support YouTube URLs.`);
  }

  assert.doesNotMatch(config, /max_file_size:\s*(1048576|2097152|4194304)/, "image uploads should be capped before Git Gateway.");
});

test("gallery accepts an image-only entry and keeps captions optional", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const galleryStart = config.indexOf('- name: "gallery"');
  const outputsStart = config.indexOf('- name: "outputs"', galleryStart);
  const gallery = config.slice(galleryStart, outputsStart);

  assert.match(gallery, /name:\s*"image"[\s\S]*?required:\s*false/);
  assert.match(gallery, /name:\s*"caption_en"[\s\S]*?required:\s*false/);
  assert.match(gallery, /name:\s*"alt_tr"[\s\S]*?required:\s*false/);
  assert.match(gallery, /name:\s*"alt_en"[\s\S]*?required:\s*false/);
});

test("daily admin forms are Turkish-first and gallery exposes only three user fields", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const galleryStart = config.indexOf('- name: "gallery"');
  const outputsStart = config.indexOf('- name: "outputs"', galleryStart);
  const gallery = config.slice(galleryStart, outputsStart);

  assert.match(config, /^locale:\s*"tr"$/m);
  assert.match(gallery, /name:\s*"caption_tr"[\s\S]*?widget:\s*"string"/);
  assert.match(gallery, /name:\s*"image"[\s\S]*?widget:\s*"image"/);
  assert.match(gallery, /name:\s*"youtubeUrl"/);
  assert.match(gallery, /name:\s*"caption_en"[\s\S]*?widget:\s*"hidden"/);
  assert.match(gallery, /name:\s*"type"[\s\S]*?widget:\s*"hidden"/);
  assert.match(gallery, /name:\s*"category"[\s\S]*?widget:\s*"hidden"/);
});

test("every admin widget is optional and repeatable lists can be empty", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const lines = config.split(/\r?\n/);

  assert.doesNotMatch(config, /required:\s*true/, "No unrelated admin field may block saving.");

  lines.forEach((line, index) => {
    if (!/widget:\s*/.test(line)) return;

    if (line.includes("{")) {
      assert.match(line, /required:\s*false/, `Inline widget on line ${index + 1} must be optional.`);
      return;
    }

    const block = lines.slice(index + 1, index + 7);
    assert.match(block.join("\n"), /required:\s*false/, `Widget on line ${index + 1} must be optional.`);
  });

  for (const match of config.matchAll(/widget:\s*"list"([\s\S]*?)(?=\n\s*widget:|\n\s*- label:|\n\s*- name:|$)/g)) {
    assert.doesNotMatch(match[1], /min:\s*[1-9]/, "Repeatable lists must not require unrelated entries.");
  }
});

test("admin removes accidental blank list rows before saving", () => {
  const html = fs.readFileSync(path.join(projectRoot, "admin", "index.html"), "utf8");

  assert.match(html, /name:\s*'preSave'/);
  assert.match(html, /prepareEditorData\(data\)/);
  assert.match(html, /__upcycCMSRemoveEmptyRows/);
  assert.match(html, /__upcycCMSApplyAutomaticFields/);
  assert.match(html, /__upcycCMSPrepareEditorData/);
  assert.match(html, /\.netlify\/functions\/translate/);
  assert.match(html, /IMAGE_TARGET_BYTES\s*=\s*220\s*\*\s*1024/);
  assert.match(html, /Fotoğraf güvenli WebP dosyasına çevriliyor/);
  assert.doesNotMatch(html, /pair\.object\[pair\.englishKey\]\s*=\s*pair\.text/);
});

test("every Turkish CMS field has an automatic English partner", () => {
  const config = fs.readFileSync(path.join(projectRoot, "admin", "config.yml"), "utf8");
  const names = new Set(Array.from(config.matchAll(/name:\s*"([^"]+)"/g), (match) => match[1]));

  for (const name of names) {
    if (!name.endsWith("_tr")) continue;
    assert.ok(names.has(name.replace(/_tr$/, "_en")), `${name} must have a hidden English field.`);
  }
});

test("all CMS data keeps Turkish and English fields paired", () => {
  const dataDirectory = path.join(projectRoot, "data");

  function checkValue(value, fileName) {
    if (Array.isArray(value)) {
      value.forEach((item) => checkValue(item, fileName));
      return;
    }
    if (!value || typeof value !== "object") return;

    for (const key of Object.keys(value)) {
      if (key.endsWith("_tr")) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(value, key.replace(/_tr$/, "_en")),
          `${fileName}: ${key} must have an English partner.`
        );
      }
      checkValue(value[key], fileName);
    }
  }

  for (const fileName of fs.readdirSync(dataDirectory).filter((name) => name.endsWith(".json"))) {
    checkValue(JSON.parse(fs.readFileSync(path.join(dataDirectory, fileName), "utf8")), fileName);
  }
});
