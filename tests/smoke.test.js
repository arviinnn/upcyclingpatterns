const assert = require("node:assert/strict");
const test = require("node:test");
const { chromium } = require("playwright");
const { launchBrowser, mockAdminCdn, startStaticServer } = require("./helpers/static-server");

test("critical pages and assets respond successfully", async () => {
  const server = await startStaticServer();
  const criticalPaths = [
    "/",
    "/index.html",
    "/style.css",
    "/script.js",
    "/sw.js",
    "/manifest.json",
    "/reset-browser.html",
    "/admin/recover.html",
    "/favicon-48x48.png",
    "/favicon-96x96.png",
    "/admin/config.yml",
    "/data/site.json",
    "/data/design.json",
    "/data/timeline.json",
    "/data/mobility.json",
    "/data/team.json",
    "/images/hero/hero.webp"
  ];

  try {
    for (const itemPath of criticalPaths) {
      const response = await fetch(`${server.baseUrl}${itemPath}`);
      assert.equal(response.status, 200, `${itemPath} returned ${response.status}`);
    }
  } finally {
    await server.close();
  }
});

test("admin editor reaches login without a CMS configuration error", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));
    await mockAdminCdn(page);
    // Do not wait for CDN background traffic to become idle. The visible login
    // prompt below is the authoritative admin-ready signal.
    await page.goto(`${server.baseUrl}/admin/#/collections/gallery/entries/gallery_items`, { waitUntil: "commit" });
    await page.waitForFunction(() => {
      const text = document.body.innerText;
      return /Login with Netlify Identity|Netlify Identity ile Giriş|Error loading the CMS configuration|Config Errors/.test(text);
    }, undefined, { timeout: 20000 });

    const bodyText = await page.locator("body").innerText();
    assert.doesNotMatch(bodyText, /Error loading the CMS configuration|Config Errors/);
    assert.doesNotMatch(bodyText, /Not Found/i);
    assert.match(bodyText, /Login with Netlify Identity|Netlify Identity ile Giriş/);
    assert.equal(await page.evaluate(() => location.hash), "");
    assert.equal(await page.locator("#adminQuickNav").count(), 0);

    await page.goto(`${server.baseUrl}/admin/#/`, { waitUntil: "commit" });
    await page.waitForFunction(() => /Login with Netlify Identity|Netlify Identity ile Giriş/.test(document.body.innerText));
    assert.doesNotMatch(await page.locator("body").innerText(), /Not Found/i);
    assert.equal(await page.evaluate(() => location.hash), "");
    assert.equal(await page.locator("#adminQuickNav").count(), 0);

    const cleanedItems = await page.evaluate(() => {
      return window.__upcycCMSRemoveEmptyRows({
        items: [
          { type: "image", category: "other", caption_en: "", image: "" },
          { type: "image", category: "other", caption_en: "WORLD", image: "/images/uploads/world.webp" }
        ]
      }).items;
    });
    assert.deepEqual(cleanedItems, [
      { type: "image", category: "other", caption_en: "WORLD", image: "/images/uploads/world.webp" }
    ]);

    const automaticGallery = await page.evaluate(() => {
      return window.__upcycCMSApplyAutomaticFields({
        type: "image",
        category: "",
        date: "",
        youtubeUrl: "https://youtu.be/D1fjOEujwgw",
        caption_tr: "Atölye Videosu",
        caption_en: "",
        alt_tr: "",
        alt_en: ""
      });
    });
    assert.equal(automaticGallery.type, "youtube");
    assert.equal(automaticGallery.category, "other");
    assert.match(automaticGallery.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(automaticGallery.alt_tr, "Atölye Videosu");
    assert.deepEqual(consoleErrors, []);
  } finally {
    await browser.close();
    await server.close();
  }
});

test("admin blocks Decap when Git Gateway repo preflight fails", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);
  let decapRequests = 0;

  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    await page.route("https://identity.netlify.com/**", (route) => route.fulfill({
      status: 200,
      contentType: "text/javascript; charset=utf-8",
      body: `
        window.netlifyIdentity = {
          handlers: {},
          user: {
            email: "admin@example.com",
            user_metadata: {},
            jwt: function () { return Promise.resolve("test-token"); }
          },
          on: function (name, handler) { this.handlers[name] = handler; },
          init: function () { if (this.handlers.init) this.handlers.init(this.user); },
          currentUser: function () { return this.user; },
          close: function () {},
          open: function () {}
        };
      `
    }));
    await page.route("**/.netlify/git/settings", (route) => route.fulfill({
      status: 200,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ github_enabled: true })
    }));
    await page.route("**/.netlify/git/github/branches/main", (route) => route.fulfill({
      status: 404,
      contentType: "application/json; charset=utf-8",
      body: JSON.stringify({ message: "branch unavailable" })
    }));
    await page.route("https://unpkg.com/decap-cms@3.14.0/**", (route) => {
      decapRequests++;
      return route.fulfill({ status: 500, body: "" });
    });
    await page.route("https://cdn.jsdelivr.net/npm/decap-cms@3.14.0/**", (route) => {
      decapRequests++;
      return route.fulfill({ status: 500, body: "" });
    });

    await page.goto(`${server.baseUrl}/admin/`, { waitUntil: "commit" });
    await page.waitForFunction(() => /Git Gateway bağlantısı doğrulanamadı/.test(document.body.innerText));

    const bodyText = await page.locator("body").innerText();
    assert.doesNotMatch(bodyText, /Not Found/i);
    assert.equal(decapRequests, 0);
    assert.equal(await page.evaluate(() => Boolean(window.CMS)), false);
  } finally {
    await browser.close();
    await server.close();
  }
});

test("Turkish homepage loads the shared application without broken assets", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.addInitScript(() => {
      localStorage.setItem("cookieConsentDismissed", "true");
    });

    await page.goto(`${server.baseUrl}/tr/`, { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cms-status") === "loaded");

    assert.equal(await page.getAttribute("html", "lang"), "tr");
    assert.equal(
      await page.getAttribute('link[rel="canonical"]', "href"),
      "https://upcyclingpatterns.com/tr/"
    );
    assert.deepEqual(consoleErrors, []);
  } finally {
    await browser.close();
    await server.close();
  }
});

test("homepage opens without console errors or broken same-origin links", async () => {
  const server = await startStaticServer();
  const browser = await launchBrowser(chromium);
  const consoleErrors = [];

  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(error.message));

    await page.addInitScript(() => {
      localStorage.setItem("cookieConsentDismissed", "true");
    });

    await page.goto(`${server.baseUrl}/`, { waitUntil: "commit" });
    await page.waitForFunction(() => document.documentElement.getAttribute("data-cms-status") === "loaded");

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[href]"))
        .map((link) => link.href)
        .filter((href) => href.startsWith(location.origin))
        .map((href) => new URL(href).pathname)
        .filter((pathname) => pathname && pathname !== "/")
        .filter((pathname, index, all) => all.indexOf(pathname) === index);
    });

    for (const pathname of links) {
      const response = await fetch(`${server.baseUrl}${pathname}`);
      assert.notEqual(response.status, 404, `${pathname} returned 404`);
    }

    assert.deepEqual(consoleErrors, []);
  } finally {
    await browser.close();
    await server.close();
  }
});
