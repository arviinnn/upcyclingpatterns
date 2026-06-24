const assert = require("node:assert/strict");
const test = require("node:test");
const { chromium } = require("playwright");
const { launchBrowser, mockAdminCdn, startStaticServer } = require("./helpers/static-server");

test("admin stores selected photos inline without Decap media upload", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await mockAdminCdn(page);
    await page.goto(`${server.baseUrl}/admin/`, { waitUntil: "commit" });
    await page.waitForFunction(() => typeof window.__upcycCMSOptimizeImageFileToDataUrl === "function");

    const result = await page.evaluate(async () => {
      async function makeBlob(size, noisy) {
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");

        if (noisy) {
          const pixels = context.createImageData(size, size);
          for (let offset = 0; offset < pixels.data.length; offset += 65536) {
            crypto.getRandomValues(pixels.data.subarray(offset, Math.min(offset + 65536, pixels.data.length)));
          }
          for (let alpha = 3; alpha < pixels.data.length; alpha += 4) pixels.data[alpha] = 255;
          context.putImageData(pixels, 0, 0);
        } else {
          context.fillStyle = "#2f7a43";
          context.fillRect(0, 0, size, size);
          context.fillStyle = "#ffffff";
          context.fillRect(12, 12, size - 24, size - 24);
        }

        return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      }

      const largeBlob = await makeBlob(900, true);
      const smallBlob = await makeBlob(80, false);
      const largeDataUrl = await window.__upcycCMSOptimizeImageFileToDataUrl(
        new File([largeBlob], "Telefon Fotoğrafı.png", { type: "image/png" })
      );
      const smallDataUrl = await window.__upcycCMSOptimizeImageFileToDataUrl(
        new File([smallBlob], "küçük fotoğraf.png", { type: "image/png" })
      );

      return {
        largeSourceSize: largeBlob.size,
        smallSourceSize: smallBlob.size,
        largeDataUrl,
        smallDataUrl
      };
    });

    assert.ok(result.largeSourceSize > 900 * 1024, "Test image must be large enough to exercise compression.");
    assert.ok(result.smallSourceSize < 220 * 1024, "Small test image should already be below the upload target.");

    assert.match(result.largeDataUrl, /^data:image\/webp;base64,/);
    assert.match(result.smallDataUrl, /^data:image\/webp;base64,/);
    assert.ok(result.largeDataUrl.length <= 600000, "Large inline image must stay below the public URL safety cap.");
    assert.ok(result.smallDataUrl.length <= 600000, "Small inline image must stay below the public URL safety cap.");
    assert.ok(result.largeDataUrl.length < result.largeSourceSize, "Large inline image must be smaller than the source image.");
  } finally {
    await browser.close();
    await server.close();
  }
});
