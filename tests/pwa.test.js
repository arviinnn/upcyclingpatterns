const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");
const { chromium } = require("playwright");
const { launchBrowser, projectRoot, startStaticServer } = require("./helpers/static-server");

test("service-worker cache keys track the package version", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  const serviceWorker = fs.readFileSync(path.join(projectRoot, "sw.js"), "utf8");

  assert.match(serviceWorker, new RegExp(`CACHE_VERSION = "upcycling-patterns-v${packageJson.version.replace(/\./g, "\\.")}"`));
  assert.match(serviceWorker, new RegExp(`/style\\.css\\?v=${packageJson.version.replace(/\./g, "\\.")}`));
  assert.match(serviceWorker, new RegExp(`/script\\.js\\?v=${packageJson.version.replace(/\./g, "\\.")}`));
});

test("service worker bypasses privileged routes before navigation caching", () => {
  const serviceWorker = fs.readFileSync(path.join(projectRoot, "sw.js"), "utf8");
  const bypassIndex = serviceWorker.indexOf('requestUrl.pathname === "/admin"');
  const navigationIndex = serviceWorker.indexOf("if (isHtmlNavigation(request))");

  assert.ok(bypassIndex >= 0 && bypassIndex < navigationIndex, "Admin bypass must run before navigation caching.");
  assert.match(serviceWorker, /requestUrl\.pathname\.startsWith\("\/\.netlify\/"\)/);
  assert.match(serviceWorker, /requestUrl\.pathname === "\/reset-browser"/);
});

test("service worker uses network-first delivery for application code", () => {
  const serviceWorker = fs.readFileSync(path.join(projectRoot, "sw.js"), "utf8");
  const appCodeIndex = serviceWorker.indexOf("if (isApplicationCode(requestUrl))");
  const genericAssetIndex = serviceWorker.indexOf("if (isStaticAsset(requestUrl))");

  assert.ok(appCodeIndex >= 0 && appCodeIndex < genericAssetIndex, "CSS/JS must be handled before generic static assets.");
  assert.match(serviceWorker.slice(appCodeIndex, genericAssetIndex), /networkFirst\(request\)/);
});

test("offline reload serves the precached homepage and local images", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);
  const context = await browser.newContext();
  const page = await context.newPage();
  const localFailures = [];

  page.on("requestfailed", (request) => {
    if (request.url().startsWith(server.baseUrl)) localFailures.push(request.url());
  });
  page.on("response", (response) => {
    if (response.url().startsWith(server.baseUrl) && response.status() >= 400) {
      localFailures.push(`${response.status()} ${response.url()}`);
    }
  });

  try {
    await page.goto(`${server.baseUrl}/`, { waitUntil: "commit" });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await context.setOffline(true);
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector("h1");

    const state = await page.evaluate(() => ({
      title: document.title,
      brokenImages: Array.from(document.images)
        .filter((image) => image.hasAttribute("src") && image.complete && image.naturalWidth === 0)
        .map((image) => image.getAttribute("src"))
    }));

    assert.match(state.title, /Upcycling Patterns/);
    assert.deepEqual(state.brokenImages, []);
    assert.deepEqual(localFailures, []);
  } finally {
    await context.setOffline(false);
    await browser.close();
    await server.close();
  }
});
