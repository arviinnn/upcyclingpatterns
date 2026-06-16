# Changelog — Upcycling Patterns

All notable changes to the Upcycling Patterns website are documented here.
This project follows [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

> **Format:** `Added` (new), `Changed` (modified), `Fixed` (bug), `Removed` (deleted), `Security` (vulnerability).

---

## [1.5.2] - 2026-06-16

Admin startup and redirect-cache recovery release.

### Changed
- Removed the floating admin quick menu so Decap CMS always owns its own navigation after login.
- Bumped the site asset and service-worker cache version to force browsers onto the current deployment.

### Fixed
- Cleared stale `#/` and old Decap collection hashes before CMS loads, preventing login-screen `Not Found` toasts.
- Added a clear Git Gateway 404 message when Netlify Identity is connected but the GitHub repository is not available through Git Gateway.
- Added root cache clearing headers to break stale browser redirect/cache state without deleting admin cookies.

---

## [1.5.1] — 2026-06-15

Admin reliability and Turkish-first automatic translation release.

### Changed
- Simplified daily CMS editing around Turkish input fields and translated visible admin labels.
- Extended Turkish-to-English DeepL generation to image descriptions, countries, partner roles, team records, mobility records and logo titles.
- Deduplicated translation requests and split them safely within DeepL request limits.

### Fixed
- Prevented protected collection routes and the quick menu from appearing before authentication, removing the Decap login-screen `Not Found` error.
- Blocked publishing when DeepL fails instead of silently copying Turkish text into English fields.
- Added exact translation-result validation and Turkish admin error messages.

## [1.5.0] — 2026-06-14

Repository hardening, dependency refresh and production cleanup release.

### Added
- Added `package-lock.json` and deterministic `npm ci` installs in GitHub Actions.
- Added strict image-format, manifest-icon, social-image and CMS JSON validation.
- Added translation endpoint tests for malformed inputs and incomplete provider responses.

### Changed
- Upgraded CI and Netlify from Node.js 20 to Node.js 24 LTS.
- Updated Sharp to 0.35.1 and kept Playwright at 1.60.0.
- Updated GitHub Actions to `actions/checkout@v5` and `actions/setup-node@v6`.
- Made service-worker delivery network-first for CSS and JavaScript updates.

### Fixed
- Corrected PNG logo files that were incorrectly named with `.jpeg` extensions.
- Prevented `/admin`, `/.netlify/*` and browser-reset requests from entering the PWA cache.
- Added a provider timeout and exact response-shape checks to the authenticated translation function.
- Restricted CMS external links to HTTPS and rejected encoded path traversal in public asset paths.

### Removed
- Removed unused public contact/newsletter functions, eliminating unnecessary serverless attack surface.
- Removed ignored `dist` copies, the fake minify step and unreferenced duplicate image assets.
- Losslessly reduced PNG asset size without changing dimensions or visual quality.

## [1.4.1] — 2026-06-14

Technical reliability and cleanup release.

### Fixed
- Replaced regex-based CSS/JavaScript minification that corrupted regular expressions, text, and `calc()` values with verified distribution copies.
- Added syntax checks for generated JavaScript during every build.
- Corrected PWA cache lookups so precached files and the offline homepage are actually available, while CMS JSON prefers fresh network content.
- Prevented the opening loader and service-worker registration from waiting indefinitely on third-party resources.
- Added a timeout-driven Decap CMS CDN fallback and sanitized CMS-provided image, social, and email URLs.
- Removed browser-test dependence on third-party CDN completion and added coverage for build outputs and CMS media references.

### Removed
- Duplicate legacy image copies and IDE workspace metadata.

## [1.4.0] — 2026-06-13

Simple mobile admin and automatic translation release.

### Added
- Turkish Decap CMS interface with a fixed quick menu for Gallery, News, Files and FAQ.
- Secure `/.netlify/functions/translate` endpoint backed by DeepL and protected by Netlify Identity.
- Automatic Turkish-to-English translation for every matching `_tr` / `_en` admin field.
- Automatic gallery media type, date, year, category, alt text, summary and default content generation.
- Mobile admin layout rules for narrow screens, touch controls and phone photo uploads.

### Changed
- Gallery entry now shows only Turkish title, photo upload and YouTube URL.
- News entry now primarily shows Turkish title and photo.
- Downloads primarily show Turkish title, file and optional photo.
- FAQ primarily shows Turkish question and answer.
- All English admin fields are hidden and maintained automatically.

### Fixed
- Phone image formats that the browser can decode are converted to upload-safe WebP before Decap validates the file.
- Translation provider failure no longer loses the entry; Turkish text is preserved as a temporary English fallback.

## [1.3.1] — 2026-06-13

Admin optional-fields and redirect-loop hardening release.

### Changed
- Every Decap CMS widget and repeatable list can now be left empty, so editors only fill the fields needed for the item they are adding.
- The `www` alias is served with a Netlify rewrite instead of a permanent host redirect; canonical metadata still points search engines to the apex domain.

### Fixed
- Accidental blank gallery/news/output/FAQ rows are removed automatically before a CMS entry is saved.
- Empty CMS rows already present in JSON data are ignored by the public-site renderers.
- A gallery item can be published with only a photo and optional caption without reopening or completing older entries.
- Old opposing apex/`www` redirects cached on individual devices can no longer continue a host-to-host redirect loop after this release is deployed.

### Verified
- All 23 automated tests pass, including Decap configuration loading, blank-row cleanup, image optimization, responsive checks, accessibility checks, SEO, JSON validation, and broken-link smoke tests.

## [1.3.0] — 2026-06-13

Admin reliability and redirect recovery release.

### Added
- Automatic client-side optimization for oversized JPG, PNG, and WebP admin uploads.
- `/admin/recover.html` for clearing expired Netlify Identity sessions.
- `/reset-browser` recovery route for clearing stale redirects, cookies, storage, service workers, and caches.
- Automated coverage for admin configuration loading, image optimization, image-only gallery entries, and redirect ownership.

### Changed
- Decap CMS is pinned to `3.14.0` and uses its default direct-to-main publishing flow.
- Repeatable admin lists keep existing entries fully collapsed and add new chronological entries at the top.
- Gallery captions and alt text are optional, so a photo-only item can be added without editing previous records.
- Apex/`www` and HTTP/HTTPS redirects are owned only by Netlify's primary-domain configuration.

### Fixed
- Removed the extra branch/pull-request operations that could surface as `Failed to persist entry: TypeError: Failed to fetch`.
- Prevented the service worker from intercepting admin, authentication, Git Gateway, or browser-recovery requests.
- Prevented conflicting cached host redirects from creating device-specific `ERR_TOO_MANY_REDIRECTS` loops.

## [1.2.4] — 2026-06-07

General site-quality pass across frontend resilience, SEO metadata, admin convenience, hosting headers, and documentation.

### Added
- CMS JSON preload hints on the homepage so editable content can start loading earlier.
- PWA manifest shortcut for the Admin Panel.
- `/manifest.webmanifest` redirect to `/manifest.json` for older browser/tool compatibility.
- Explicit `sitemap.xsl` content-type and cache headers in both `netlify.toml` and `_headers`.
- CMS load-status attributes on `<html>` for easier debugging: `data-cms-status` and `data-cms-loaded-count`.

### Changed
- CMS JSON fetches now use same-origin credentials and an 8-second timeout, so a stalled data file cannot hang homepage enhancement.
- Sitemap `lastmod` values updated to `2026-06-07`.
- Legal page footer update dates moved to `7 June 2026` / `7 Haziran 2026`.
- Dark-mode focus-ring coverage expanded for lightbox controls.
- Distribution ignore rules now also exclude `upcycling-website*.zip`.
- README and deployment documentation updated to v1.2.4.

### Fixed
- Older `/manifest.webmanifest` requests now resolve cleanly instead of falling through to 404.
- `sitemap.xsl` now serves with the correct MIME type on Netlify fallback headers as well as primary Netlify config.

---

## [1.2.3] — 2026-06-06

Admin-usability pass focused on making homepage content editable without code.

### Added
- `data/sections.json` with 32 CMS-managed About, Mission, Goals, Timeline, Activities, Results, and Details cards.
- New Decap CMS collection: **Homepage Sections**, so editors can add, remove, reorder, translate, and upload photos for homepage cards directly from `/admin/`.
- Standard card image renderer for admin-managed homepage sections, with fixed aspect ratios, lazy loading, safe public URL handling, and image fallback states.
- Admin panel shortcut in the footer legal area for easier access.

### Changed
- About and Explore homepage cards now render from CMS data when available, while the original HTML remains as a safe fallback.
- Partner cards no longer show school logos beside the flag; logos remain available for the footer logo strip and admin records.
- README and deployment guide updated to v1.2.3 and to reflect the new 7-collection CMS structure.

### Fixed
- Homepage section photos can now be uploaded through the admin media library without manually writing file paths or editing code.
- Admin-managed card images use stable responsive dimensions so photo additions do not resize or break the card layout.

---

## [1.2.2] — 2026-06-06

Second production-hardening pass focused on CMS scalability, social previews, and documentation accuracy.

### Added
- Dynamic homepage rendering for all CMS-managed lists. News, gallery, downloads, partners, and FAQ entries now render every item from `data/*.json` instead of being capped by the original static card count.
- Partner logo/action support on homepage cards, including website and email links when provided in the CMS.
- Standard visual assets for browser/PWA/social support: `/favicon.ico`, `/images/favicon.png`, `/apple-touch-icon.png`, `/images/icon-512.png`, `/images/icon-maskable-512.png`, and `/og-image.png`.
- Ready-to-track `images/uploads/.gitkeep` so Decap CMS media uploads have a real repository folder.

### Changed
- Admin collection descriptions and media hints now match the live behavior: every CMS item is visible, with clear image-size standards for hero, gallery, covers, and partner logos.
- Sitemap `lastmod` values updated to `2026-06-06`.
- Netlify and fallback `_headers` cache rules added for `/og-image.png`, `/favicon.ico`, and `/apple-touch-icon.png`.
- README and deployment documentation updated to v1.2.2 and to reflect that icons and Open Graph imagery are now included.

### Fixed
- Removed stale documentation saying PWA icons and the Open Graph image still needed to be generated.
- Removed a non-public personal note that had been left at the end of the changelog.

---

## [1.2.1] — 2026-05-20

A production-readiness pass. No visual or animation changes — every fix
targets correctness, CMS workflow, social sharing, and PWA compliance.

### Added
- **Editorial workflow on the CMS.** `publish_mode: editorial_workflow` is now active in `admin/config.yml`, so editor saves go through *Draft → In Review → Ready → Publish* instead of going straight to `main`. The live site can no longer be changed by a single accidental save.
- **PWA install support.** `manifest.json` now ships three real PNG icons (`/images/icon-192.png`, `/images/icon-512.png`, `/images/icon-maskable-512.png` for Android adaptive shapes) alongside the original JPEG fallback. The previous single `sizes: "any"` JPEG-only setup failed Lighthouse's PWA installability check.
- **Manifest link on the homepage.** `index.html` was missing `<link rel="manifest" href="/manifest.json" />` — every other page had it. Added.
- **Full Open Graph + Twitter Card set on `success.html`.** Canonical, OG (13 tags), Twitter (5 tags), Google Fonts preconnect + stylesheet, plus the `ogDescription` / `ogLocale` keys in the i18n dictionary so meta values track the active language. Brings `success.html` to parity with every other legal page.
- **XSL stylesheet binding on `sitemap.xml`.** `<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>` directive added on line 2. The pretty HTML sitemap (already shipped in v1.2.0) was sitting unused — humans visiting `/sitemap.xml` now see the styled table, crawlers still see raw XML.
- **`success.html` is finally reachable.** The contact form's hidden `redirect` value changed from `false` to `https://upcyclingpatterns.com/success.html`. When JS works (the normal case) the form still shows the inline thank-you message; when JS fails the browser's native POST now lands on the dedicated success page instead of leaving the user staring at a Web3Forms JSON response.
- **Bilingual `<noscript>` banner.** The "JavaScript is disabled" warning on `index.html` is now shown in both English and Turkish so a Turkish visitor with JS off can still read it.

### Changed
- **Gallery is now CMS-first.** `script.js`'s `buildFixedGalleryItems()` always returned the same three hard-coded items and silently threw away anything edited in `/admin/Gallery`. Renamed to `buildGalleryItems()` with the correct precedence: if `gallery.json` has entries, use them; otherwise fall back to the original three items. Editing the gallery from the admin panel now actually changes the live site.
- **`netlify.toml` header rule fixed.** The `/manifest.webmanifest` block was a dead rule — the real file is `manifest.json`. Path corrected so the `Content-Type: application/manifest+json` and cache-control headers actually get applied.
- **iOS status bar style updated.** `apple-mobile-web-app-status-bar-style` on `index.html` changed from `default` to `black-translucent` — the modern PWA standard for full-bleed home-screen launches.
- **YouTube iframe privacy.** Added `referrerpolicy="strict-origin-when-cross-origin"` to both gallery iframes so YouTube only sees the origin, not the full referring URL. HTML entities in `src` (`&amp;`) tightened for spec compliance.
- **Language detection normalises case.** `?lang=TR` and `?lang=tr` are now treated the same — the early-detection script lowercases the URL parameter before comparing against `SUPPORTED`.

### Fixed
- **CSP `<meta http-equiv>` removed from `404.html`.** Every other legal page already relies on the real CSP shipped from `netlify.toml` + `_headers`. The 404-only meta tag was duplicate-and-weaker and made the legal-page set inconsistent.
- **`local_backend: true` deactivated.** This flag is intended for local development with `npx decap-server`. Left on in production it makes Decap CMS try to reach `http://localhost:8081` before Git Gateway, causing "Failed to load entries" errors for editors on the live site. Now commented out with a clear note on when to re-enable it.

### Security
- Editor saves no longer bypass review — every content change must be explicitly published by an authenticated maintainer (see `publish_mode: editorial_workflow` above).

### Notes for follow-up (resolved in v1.2.2)
- Documentation references were reviewed and updated where they no longer matched the current file set.
- The missing PWA and social-preview assets were generated and added in v1.2.2.

---

## [1.2.0] — 2026-05-11

### Added
- Full Turkish (TR) localization on every legal page (`accessibility.html`, `funding-disclaimer.html`, `terms.html`, `success.html`, `privacy-policy.html`, `cookie-policy.html`, `404.html`) with a top-of-page EN/TR switcher.
- Cross-tab language sync via the `storage` event — switching language in one tab updates open tabs of the same site.
- Open Graph and Twitter Card metadata on every page (404, success, terms, accessibility, funding-disclaimer, privacy-policy, cookie-policy) so social shares look right.
- `hreflang` alternates (`en`, `tr`, `x-default`) on all legal pages.
- `@media print` styles on legal pages — clean printable output for school records.
- WCAG 2.1 AA reference text in the accessibility statement.
- Storage event listener in `404.html` for live language updates.
- `aria-label` on every language switcher button (`Switch to English` / `Türkçe'ye geç`).

### Changed
- `admin/config.yml` is now a 775-line, validation-heavy CMS schema:
  - Slug rules force ASCII + `clean_accents: true` so Turkish characters become clean URLs.
  - Every text/string field has a `pattern` regex with 2–80 / 5–200 / 10–400 / 10–1000 character limits and human-readable error messages.
  - Email and URL fields validated via reusable YAML anchors (`&email_field`, `&https_url`).
  - Country code list expanded from 31 to 36 entries (Albania, Kosovo, Serbia, Montenegro, Bosnia & Herzegovina added).
  - All `select` widgets use `{label, value}` object syntax with flag emojis.
  - Upload limits per field (`hero` 1 MB, `logo` 1 MB, `gallery photo` 3 MB, `output file` 25 MB).
  - Lists have `min` / `max` caps (partners min 1, gallery max 20, news max 100, outputs max 50).
  - `commit_messages` now include `{{author-login}}` so every edit is attributed.
- `admin/index.html` rewritten with fallback CDN (jsDelivr if unpkg fails), explicit `netlifyIdentity.init()`, retry button, error states, `<noscript>` fallback, dark theme sync, polling for the Identity widget, and `logout` → `/` redirect.
- `404.html`:
  - `color-scheme` changed from `light` to `light dark`.
  - Two `theme-color` entries for light/dark.
  - Full `html[data-theme="dark"]` override set (ambient, grid, card, badge, buttons, quick-links, lang-box).
  - Storage helpers guard against `localStorage` being disabled.
  - `URLSearchParams` lowercase normalisation.
  - `forEach` replaced with traditional `for` loops for older browser safety.
  - `access_token=` recognised in the Identity-token bounce list.

### Fixed
- Apple-touch-icon and favicon paths are now consistent across every page (`/favicon.ico`, `/apple-touch-icon.png`) matching the manifest.
- Polish partner name in `data/partners.json` corrected with proper diacritics: `Zespół Szkół Samochodowych im. Tadeusza Tańskiego`; city filled in as `Włocławek`.
- Gallery caption `"Workshop Activities 1"` → `"Workshop Activities"` (trailing index dropped).
- `data/news.json`, `data/outputs.json` field order now matches the order in `admin/config.yml` (editor-friendly diffs).
- `Permissions-Policy` removed from `<meta http-equiv>` blocks on legal pages — it was silently ignored there. The real policy lives in `netlify.toml` and `_headers`.
- `_headers` enriched with `Cross-Origin-Resource-Policy`, `X-DNS-Prefetch-Control`, `Access-Control-Allow-Origin` for fonts/images, and immutable cache rules for app icons.
- `_redirects` extended with HTTPS + apex canonical, `/index.html → /`, friendly aliases (`/privacy`, `/terms`, …), and clean 404s for common probe paths (`/wp-admin`, `/.env`, `/.git/*`).
- `.gitignore` expanded to ~150 lines covering Netlify CLI, Decap local backend, Python venv, WebStorm/Sublime/Vim, image-tool caches, distribution ZIPs, and an explicit allowlist (`!data/*.json`, `!admin/config.yml`).

### Security
- `noindex, nofollow, noarchive, nosnippet, noimageindex` enforced on `/admin/*` via both `<meta name="robots">` and `_headers` `X-Robots-Tag`.
- Identity widget panel now redirects to `/admin/` on login (replace, not push, so the back button doesn't loop through the token URL).

---

## [1.1.1] — 2026-05-11

### Fixed (technical-only pass, no visual or animation changes)
- Removed duplicate Open Graph meta block in `index.html` (the entire `<meta property="og:*">` set was emitted twice).
- Unified `og:image` and `twitter:image` to a single canonical `/og-image.png` path.
- Added the three missing Turkish translations (`termsLink`, `accessibilityLink`, `fundingDisclaimerLink`) so the footer legal column is fully localised when switching to TR.
- Standardised the `apple-touch-icon` and favicon paths across all pages to match the manifest.
- Added an early `data-theme` detection script to `success.html`, `terms.html`, `accessibility.html`, `funding-disclaimer.html`, and `404.html` so a user's chosen dark/light mode from the main site is respected on these pages.
- Added matching `html[data-theme="dark"]` CSS overrides so the dark mode actually styles correctly.
- Reviewed the `publish_mode` setting in `admin/config.yml` (the actual `publish_mode: editorial_workflow` line was added later in v1.2.1).
- Added an explicit `netlifyIdentity.init()` call in `admin/index.html` to guard against environments where the widget's auto-init silently fails.
- Added `hreflang="x-default"` alternates for the privacy and cookie sitemap entries.
- Renamed `_headers.txt` → `_headers`, `_redirects.txt` → `_redirects`, `gitignore.txt` → `.gitignore` so Netlify and Git can actually read them.

### Unchanged
- All design tokens, layout, animations, transitions, glass effects, hover states, and timings are byte-identical to v1.1.0. This release is purely a technical-correctness pass.

---

## [1.1.0] — 2026-05-10

### Added
- Accessibility statement page.
- Funding disclaimer page.
- Terms of use page.
- Success page for contact form flow.
- Root icon files for browser, mobile, and social sharing support.
- `.gitignore`.
- `LICENSE`.
- `CHANGELOG.md`.
- Minimal `_headers` file for Netlify compatibility.

### Changed
- Improved legal page structure.
- Improved project documentation.
- Improved browser and social media metadata readiness.
- Improved static hosting compatibility.

---

## [1.0.0] — 2026-05-10

### Added
- Main Upcycling Patterns homepage.
- Responsive design.
- Dark mode support.
- English/Turkish language system.
- Admin panel with Decap CMS.
- CMS data files (`site.json`, `news.json`, `gallery.json`, `outputs.json`, `partners.json`, `faq.json`).
- Privacy policy page.
- Cookie policy page.
- Custom 404 page.
- Sitemap.
- Robots file.
- Netlify configuration.
- Contact form structure.
- Footer legal area.
- Project and partner logo sections.

---

[1.5.1]: https://github.com/your-org/upcycling-patterns/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/your-org/upcycling-patterns/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/your-org/upcycling-patterns/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/your-org/upcycling-patterns/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/your-org/upcycling-patterns/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/your-org/upcycling-patterns/compare/v1.2.4...v1.3.0
[1.2.4]: https://github.com/your-org/upcycling-patterns/compare/v1.2.3...v1.2.4
[1.2.3]: https://github.com/your-org/upcycling-patterns/compare/v1.2.2...v1.2.3
[1.2.2]: https://github.com/your-org/upcycling-patterns/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/your-org/upcycling-patterns/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/your-org/upcycling-patterns/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/your-org/upcycling-patterns/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/your-org/upcycling-patterns/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/your-org/upcycling-patterns/releases/tag/v1.0.0
