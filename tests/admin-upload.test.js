const assert = require("node:assert/strict");
const test = require("node:test");
const { chromium } = require("playwright");
const { launchBrowser, mockAdminCdn, startStaticServer } = require("./helpers/static-server");

test("admin optimizes oversized phone photos before Decap receives them", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await mockAdminCdn(page);
    await page.goto(`${server.baseUrl}/admin/`, { waitUntil: "commit" });
    await page.waitForFunction(() => typeof window.__upcycCMSApplyAutomaticFields === "function");

    const before = await page.evaluate(async () => {
      const size = 900;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      const pixels = context.createImageData(size, size);

      for (let offset = 0; offset < pixels.data.length; offset += 65536) {
        crypto.getRandomValues(pixels.data.subarray(offset, Math.min(offset + 65536, pixels.data.length)));
      }
      for (let alpha = 3; alpha < pixels.data.length; alpha += 4) pixels.data[alpha] = 255;

      context.putImageData(pixels, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      const input = document.createElement("input");
      input.type = "file";
      input.id = "admin-upload-test";
      document.body.appendChild(input);

      const transfer = new DataTransfer();
      transfer.items.add(new File([blob], "Telefon Fotoğrafı.png", { type: "image/png" }));
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));

      return { size: blob.size, type: blob.type };
    });

    assert.ok(before.size > 900 * 1024, "Test image must be large enough to trigger optimization.");
    await page.waitForFunction(() => {
      return document.querySelector("#admin-upload-test")?.files?.[0]?.type === "image/webp";
    });

    const after = await page.evaluate(() => {
      const file = document.querySelector("#admin-upload-test").files[0];
      return { name: file.name, size: file.size, type: file.type };
    });

    assert.equal(after.type, "image/webp");
    assert.match(after.name, /^[\x20-\x7E]+\.webp$/);
    assert.ok(after.size < before.size, "Optimized image must be smaller than the source image.");
    assert.ok(after.size <= 900 * 1024, "Optimized image must stay within the safe upload target.");
  } finally {
    await browser.close();
    await server.close();
  }
});
