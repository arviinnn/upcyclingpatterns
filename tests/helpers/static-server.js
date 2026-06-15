const fs = require("fs");
const http = require("http");
const path = require("path");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8"
};

const projectRoot = path.resolve(__dirname, "..", "..");
const chromeExecutable = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

function safeFilePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  // Netlify rewrites /tr/ to the shared homepage document in production.
  // Mirror that one route locally so browser tests exercise the real setup.
  if (decodedPath === "/tr" || decodedPath === "/tr/") {
    return path.join(projectRoot, "index.html");
  }
  const normalized = path.normalize(decodedPath).replace(/^(\.\.[/\\])+/, "");
  let filePath = path.join(projectRoot, normalized);

  if (!filePath.startsWith(projectRoot)) return null;
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  return filePath;
}

function serveFile(request, response) {
  const filePath = safeFilePath(new URL(request.url, "http://localhost").pathname);

  if (!filePath || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.writeHead(200, {
    "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(response);
}

async function startStaticServer() {
  const server = http.createServer(serveFile);

  await new Promise((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

async function launchBrowser(chromium) {
  const launchOptions = {};
  if (fs.existsSync(chromeExecutable)) {
    launchOptions.executablePath = chromeExecutable;
  }
  return chromium.launch(launchOptions);
}

async function mockAdminCdn(page) {
  const identityStub = `
    window.netlifyIdentity = {
      handlers: {},
      on: function (name, handler) { this.handlers[name] = handler; },
      init: function () { if (this.handlers.init) this.handlers.init(null); },
      currentUser: function () { return null; }
    };
  `;
  const cmsStub = `
    window.CMS = { registerEventListener: function () {} };
    window.setTimeout(function () {
      var root = document.createElement("div");
      root.id = "nc-root";
      root.textContent = "Login with Netlify Identity";
      document.body.appendChild(root);
    }, 50);
  `;

  await page.route("https://identity.netlify.com/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript; charset=utf-8",
    body: identityStub
  }));
  await page.route("https://unpkg.com/decap-cms@3.14.0/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript; charset=utf-8",
    body: cmsStub
  }));
  await page.route("https://cdn.jsdelivr.net/npm/decap-cms@3.14.0/**", (route) => route.fulfill({
    status: 200,
    contentType: "text/javascript; charset=utf-8",
    body: cmsStub
  }));
}

module.exports = { launchBrowser, mockAdminCdn, projectRoot, startStaticServer };
