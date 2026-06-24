/*
 * Upcycling Patterns service worker.
 *
 * Why this file exists:
 * - Gives the site an offline shell after the first successful visit.
 * - Helps browsers treat the project as an installable PWA together with manifest.json.
 * - Keeps fresh content possible by using a network-first strategy for HTML pages.
 */

const CACHE_VERSION = "upcycling-patterns-v1.5.2";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/style.css?v=1.5.2",
  "/script.js?v=1.5.2",
  "/manifest.json",
  "/data/site.json",
  "/data/content.json",
  "/data/design.json",
  "/data/logos.json",
  "/data/timeline.json",
  "/data/mobility.json",
  "/data/team.json",
  "/data/sections.json",
  "/data/explore.json",
  "/data/partners.json",
  "/data/gallery.json",
  "/data/news.json",
  "/data/outputs.json",
  "/data/faq.json",
  "/images/hero/hero.webp",
  "/images/branding/logo.jpeg",
  "/images/gallery/team-collaboration.jpg",
  "/images/logos/official/funded.png",
  "/images/logos/official/logo-sozlu.png",
  "/images/logos/official/turkiye-ulusal-ajansi.png",
  "/images/logos/official/turkiyeavrupa.jpeg",
  "/images/logos/partners/mev-koleji.png",
  "/images/logos/partners/ohrid.png",
  "/images/logos/partners/poland.png",
  "/images/logos/partners/vilnius.png",
  "/images/favicon.png",
  "/images/pwa/icon-192.png",
  "/images/pwa/icon-512.png",
  "/images/pwa/icon-maskable-512.png",
  "/favicon.ico",
  "/favicon-48x48.png",
  "/favicon-96x96.png",
  "/apple-touch-icon.png",
  "/og-image.png"
];

const HTML_FALLBACK = "/index.html";

function isSameOrigin(requestUrl) {
  return requestUrl.origin === self.location.origin;
}

function isHtmlNavigation(request) {
  return request.mode === "navigate" || request.headers.get("accept")?.includes("text/html");
}

function isStaticAsset(requestUrl) {
  return /\.(?:css|js|mjs|json|webp|png|jpe?g|gif|svg|ico|woff2?)$/i.test(requestUrl.pathname);
}

function isApplicationCode(requestUrl) {
  return /\.(?:css|js|mjs)$/i.test(requestUrl.pathname);
}

async function cacheStaticAssets() {
  const cache = await caches.open(STATIC_CACHE);
  await cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: "reload" })));
}

async function deleteOldCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith("upcycling-patterns-") && !key.startsWith(CACHE_VERSION))
      .map((key) => caches.delete(key))
  );
}

function offlineResponse() {
  return new Response("Offline", {
    status: 503,
    statusText: "Service Unavailable",
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) return (await caches.match(fallbackUrl)) || offlineResponse();
    return offlineResponse();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);

  const fresh = fetch(request)
    .then(async (response) => {
      if (response && response.ok) await cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached || offlineResponse());

  return cached || fresh;
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheStaticAssets());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(deleteOldCaches().then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || !isSameOrigin(requestUrl)) return;

  // Authentication, Git Gateway and recovery requests must always go
  // directly to Netlify. Never let a stale PWA cache affect the admin panel.
  if (
    requestUrl.pathname === "/admin" ||
    requestUrl.pathname.startsWith("/admin/") ||
    requestUrl.pathname.startsWith("/.netlify/") ||
    requestUrl.pathname === "/reset-browser" ||
    requestUrl.pathname === "/reset-browser.html"
  ) return;

  if (isHtmlNavigation(request)) {
    event.respondWith(networkFirst(request, HTML_FALLBACK));
    return;
  }

  // CMS data should prefer the network so published edits appear on the next
  // visit, while the install-time copy remains available offline.
  if (requestUrl.pathname.startsWith("/data/") && requestUrl.pathname.endsWith(".json")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Application code must prefer the network so a deploy never leaves users
  // on an old CSS/JavaScript bundle for the first visit after an update.
  if (isApplicationCode(requestUrl)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset(requestUrl)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
