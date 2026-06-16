# Upcycling Patterns — Project Website

**Erasmus+ KA210-SCH** · International school partnership website
**Coordinator:** MEV Koleji Özel Basınköy Anadolu Lisesi · Istanbul, Türkiye
**Live:** [https://upcyclingpatterns.com](https://upcyclingpatterns.com)
**Status:** Production · v1.5.2 (June 2026)

---

## 📁 Project Structure

```
upcycling-patterns/
├── index.html                  ← Main website (all sections)
├── style.css                   ← All styling
├── script.js                   ← Interactions, i18n, form handling
├── 404.html                    ← Custom not-found page (EN/TR)
├── success.html                ← Contact-form thank-you page
├── privacy-policy.html         ← Privacy policy (EN/TR)
├── cookie-policy.html          ← Cookie policy (EN/TR)
├── terms.html                  ← Terms of use (EN/TR)
├── accessibility.html          ← Accessibility statement (EN/TR)
├── funding-disclaimer.html     ← Funding disclaimer (EN/TR)
│
├── manifest.json               ← PWA manifest (icons, theme, app name)
├── robots.txt                  ← Crawler rules
├── sitemap.xml                 ← SEO sitemap
├── sitemap.xsl                 ← Pretty HTML view for human visitors of /sitemap.xml
├── netlify.toml                ← Netlify config (headers, redirects, cache)
├── _headers                    ← Fallback for netlify.toml headers
├── _redirects                  ← Fallback for netlify.toml redirects
├── .gitignore                  ← Git ignore rules
├── LICENSE                     ← CC BY-NC-SA 4.0 + third-party notices
├── CHANGELOG.md                ← Version history
├── DEPLOYMENT.md               ← Step-by-step deploy guide
├── README.md                   ← This file
│
├── admin/                      ← Decap CMS admin panel
│   ├── index.html              ←   Login + editor entry
│   └── config.yml              ←   Schema for the 7 content collections
│
├── data/                       ← CMS-managed JSON (editable from /admin/)
│   ├── site.json               ←   Global site settings
│   ├── sections.json           ←   About + Explore homepage cards
│   ├── news.json               ←   News items
│   ├── gallery.json            ←   Gallery photos
│   ├── outputs.json            ←   Downloadable outputs
│   ├── partners.json           ←   Partner schools
│   └── faq.json                ←   FAQ entries
│
└── images/                     ← All site images, logos, gallery photos
    └── uploads/                ←   CMS-uploaded media
```

For a plain-language, file-by-file explanation of the codebase, see
**[CODE-EXPLANATION.md](./CODE-EXPLANATION.md)**. It explains the purpose of
the main files, the CMS JSON files, and the test suite for non-developers.

---

## 🚀 Deploy

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for the full step-by-step checklist.

**Short version:**

1. Push this folder to a GitHub repo.
2. Create a Netlify site from the repo. Build command: empty. Publish dir: `.`
3. Netlify → Identity → enable → Registration: Invite only → Services: Git Gateway: enable.
4. Invite editors at Identity → Invite users.
5. Add `DEEPL_AUTH_KEY` in Netlify environment variables for automatic Turkish-to-English admin translation.
6. (Optional) Set up Web3Forms key for the contact form — see DEPLOYMENT step 5.
7. Add custom domain `upcyclingpatterns.com` in Netlify domain settings.

Total time: ~20 minutes.

---

## ✏️ Editing Content (Admin Panel)

Visit `https://upcyclingpatterns.com/admin/` and log in with your invite email.

| Section          | What you can edit                                |
| ---------------- | ------------------------------------------------ |
| ⚙️ Site Settings | Project name, email, social links, dates         |
| 🧩 Homepage Sections | Turkish card content; English is generated automatically |
| 📰 News          | Turkish title + photo                            |
| 🖼️ Gallery       | Turkish title + photo or YouTube URL             |
| 📥 Downloads     | Turkish title + file or photo                    |
| 🤝 Partners      | Partner schools & their details                  |
| ❓ FAQ           | Turkish question + answer                        |

**Direct publishing:** saving an admin entry commits only the edited JSON/media files to `main`; Netlify then deploys that commit. Repeatable lists keep old entries collapsed and add new entries at the top.

**Automatic translation:** Turkish fields are translated to English by the authenticated Netlify Function at `/.netlify/functions/translate`. Set `DEEPL_AUTH_KEY` in Netlify; the key never reaches the browser. If the provider is temporarily unavailable, the entry still saves and preserves the Turkish text as a fallback.

Validation is built-in: minimum/maximum character lengths, valid email and URL formats, file-size limits per field (max 1 MB for logos, 3 MB for photos, 25 MB for downloads).

All CMS list items render on the live homepage. Homepage sections, news, gallery, downloads, partners, and FAQ entries are no longer limited to the first few static cards.

---

## 🌍 Languages

- **English** (default) — served at `/`
- **Türkçe** — served at `/tr/` (or `?lang=tr`, or via the EN/TR toggle)

Every legal page (privacy, cookie, terms, accessibility, funding, 404) supports both languages with an in-page switcher. Language preference is stored in `localStorage` and syncs across open tabs via the `storage` event.

To add a new language:

1. Open `script.js` → find the `translations` object.
2. Add a new key (e.g. `de`) to `SUPPORTED_LANGS` and `translations`.
3. Translate every string in the new dictionary.
4. Add a button: `<button class="lang-btn" data-lang="de">DE</button>` in the language switcher.

The legal pages (`accessibility.html`, `funding-disclaimer.html`, etc.) each have their own self-contained translation dictionary — extend them the same way.

---

## 🎨 Design System

CSS variables in `style.css` (and inline in each legal page) control the entire theme:

```css
--primary: #2f7a43;        /* Main brand green */
--primary-light: #57b26c;  /* Lighter green */
--accent: #b8ff7a;         /* Highlight lime */
--bg-1, --bg-2, --bg-3;    /* Light backgrounds */
--text-main, --text-soft;  /* Text shades */
--radius-sm, --radius-md;  /* Border radii */
--shadow-soft, --shadow-strong;
```

Dark mode is controlled by `[data-theme="dark"]` on `<html>`. A user's choice is stored in `localStorage` under `siteTheme` and syncs across all pages and tabs.

To rebrand: change these variables — everything else updates automatically.

---

## 🔐 Security

- All security headers managed in `netlify.toml` (CSP, HSTS, X-Frame-Options, Permissions-Policy, X-Content-Type-Options, COOP, CORP).
- Two distinct CSPs: strict for public pages, permissive for `/admin/*` (CMS needs to load from CDNs).
- Deploy previews and branch deploys get `X-Robots-Tag: noindex` automatically so draft content never leaks to search engines.
- Honeypot field + 8-second cooldown on the contact form prevent spam.
- Form data sent over HTTPS only, never logged client-side.
- Email addresses obfuscated in HTML, decoded by JS to defeat scrapers.
- Identity widget redirects use `replace()` so the back button doesn't loop through token URLs.
- Admin panel: `noindex, nofollow, noarchive, nosnippet, noimageindex` enforced via both `<meta>` and `X-Robots-Tag` header.

---

## 🛠️ Local Development

```bash
# Serve locally — any static server works:
npx serve .
# or
python3 -m http.server 8000
```

To test the CMS locally without deploying:

```bash
# Terminal 1 — local Decap CMS proxy
npx decap-server

# Terminal 2 — static server
npx serve .

# Open http://localhost:3000/admin/
```

**Note:** `local_backend: true` is commented out in `admin/config.yml` for production safety. Before running `npx decap-server`, uncomment it (remove the `#` from `# local_backend: true`). Remember to re-comment it before pushing — leaving it active in production breaks the live admin panel.

---

## 📋 Versioning

This project follows [Semantic Versioning](https://semver.org/). See [CHANGELOG.md](./CHANGELOG.md) for the full version history.

Current version: **v1.5.2** (June 2026)

---

## 📞 Contact

- **Email:** [upcyclingpatterns@gmail.com](mailto:upcyclingpatterns@gmail.com)
- **Instagram:** [@upcycling_patterns](https://www.instagram.com/upcycling_patterns/)
- **X:** [@UPatternsKA210](https://x.com/UPatternsKA210)
- **YouTube:** [@upcyclingpatterns](https://www.youtube.com/@upcyclingpatterns)
- **LinkedIn:** [upcycling-patterns-ka210](https://www.linkedin.com/company/upcycling-patterns-ka210/)

---

## ⚖️ License

Project-original content licensed under **CC BY-NC-SA 4.0**. Third-party logos and EU/Erasmus+ visibility elements remain the property of their respective owners. See [LICENSE](./LICENSE) for the full text.

---

## ⚠️ Disclaimer

> Funded by the European Union. Views and opinions expressed are however those of the author(s) only and do not necessarily reflect those of the European Union or the Turkish National Agency. Neither the European Union nor the granting authority can be held responsible for them.

---

*Designed and developed by the Upcycling Patterns project team · Last updated: 14 June 2026.*
