# 🚀 Deployment Checklist — Upcycling Patterns

A no-fluff checklist for getting the site live on Netlify with the CMS working.
Print this, tick the boxes, finish in under 30 minutes.

---

## 📋 At a glance

| Step | What | Time |
|---|---|---|
| 1 | Replace files & push to GitHub | 5 min |
| 2 | Connect repo to Netlify | 3 min |
| 3 | Enable Identity + Git Gateway | 2 min |
| 4 | Invite editors | 2 min |
| 5 | Wire up Web3Forms key | 3 min |
| 6 | Add custom domain (optional) | 5 min |
| 7 | Verify everything works | 5 min |

---

## ☑️ Step 1 — File layout & GitHub push

Your repo's root must look like this. The `images/` folder from your existing repo is preserved as-is.

```
upcycling-patterns/
├── index.html                  ← Main website
├── style.css                   ← All site styling
├── script.js                   ← All site interactions, i18n, form handling
├── 404.html                    ← Custom not-found page
├── success.html                ← Form-submitted thank-you page
├── privacy-policy.html
├── cookie-policy.html
├── terms.html
├── accessibility.html
├── funding-disclaimer.html
├── manifest.json                  ← PWA manifest (icons, theme, app name)
├── robots.txt
├── sitemap.xml
├── sitemap.xsl                    ← Pretty HTML view when humans visit /sitemap.xml
├── netlify.toml                ← Headers, redirects, caching
├── _headers                    ← Fallback for netlify.toml headers
├── _redirects                  ← Fallback for netlify.toml redirects
├── .gitignore
├── LICENSE                     ← CC BY-NC-SA 4.0 + third-party notices
├── CHANGELOG.md
├── README.md
├── DEPLOYMENT.md               ← This file
│
├── admin/                      ← Decap CMS admin panel
│   ├── index.html
│   └── config.yml
│
├── data/                       ← CMS-managed JSON
│   ├── site.json
│   ├── sections.json
│   ├── news.json
│   ├── gallery.json
│   ├── outputs.json
│   ├── partners.json
│   └── faq.json
│
└── images/                     ← All site images
    └── uploads/                ← CMS uploads go here automatically
```

**Common mistakes to avoid:**

- ❌ `_headers.txt` / `_redirects.txt` — these MUST be named `_headers` and `_redirects` (no `.txt`). Netlify will silently ignore them otherwise.
- ❌ `_gitignore` / `gitignore.txt` — must be `.gitignore` (with the leading dot). If you uploaded the file as `_gitignore`, rename it to `.gitignore` before pushing or Git will ignore the ignore file itself.
- ❌ `admin/index.html` at the site root — must be inside `admin/`.
- ❌ `manifest.webmanifest` (older name) — this project uses `manifest.json`. Don't introduce two manifest files.

**Push it:**

```bash
git init
git add .
git commit -m "Initial upload — Upcycling Patterns site v1.5.1"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/upcycling-patterns.git
git push -u origin main
```

---

## ☑️ Step 2 — Connect repo to Netlify

1. Sign in at [https://app.netlify.com](https://app.netlify.com)
2. **Add new site → Import an existing project → GitHub**
3. Authorise Netlify on your GitHub account.
4. Pick the `upcycling-patterns` repo.
5. Build settings:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.`
6. **Deploy site.**

Netlify deploys in ~30 seconds and gives you a `*.netlify.app` URL. Open it — the site should already be live.

---

## ☑️ Step 3 — Enable Netlify Identity + Git Gateway

This is the **single biggest reason admin panels don't work**. Don't skip it.

1. **Site overview → Identity** → click **Enable Identity**.
2. **Identity → Registration preferences** → choose **Invite only** (recommended for a school project).
3. **Identity → Services → Git Gateway** → click **Enable Git Gateway**.

Without Git Gateway, editors can log in but cannot save content.

---

## ☑️ Step 4 — Invite editors

1. **Identity → Invite users** → enter your email + any teacher / coordinator emails.
2. Each person gets an email with an invite link → they set a password.
3. They log in at `https://YOUR-SITE.netlify.app/admin/`.

Editors can create or update homepage sections, news, gallery, downloads, partners, and FAQ items. **Save** commits only the edited content and selected media directly to `main`; Netlify then deploys the change. Large JPG/PNG/WebP uploads are optimized in the admin before Decap sends them.

---

## ☑️ Step 4.1 — Enable automatic translation

1. Create a DeepL API Free or Pro key.
2. In Netlify open **Site configuration → Environment variables**.
3. Add `DEEPL_AUTH_KEY` with the DeepL key as its value.
4. Trigger a new production deploy.

The key is used only by the authenticated server-side Netlify Function and is never included in public JavaScript. Editors write Turkish; matching English fields are generated during Save.

---

## ☑️ Step 5 — Wire up the contact form (Web3Forms)

This project already ships with a working Web3Forms access key (`d1ccc863-13a2-4ab6-ad6d-cd276763dcc5`). The contact form works out of the box and emails go to `upcyclingpatterns@gmail.com`. **You can skip this step entirely if you're happy with the existing setup.**

Only follow these instructions if you want to swap in your **own** Web3Forms key:

1. Visit [https://web3forms.com](https://web3forms.com).
2. Enter `upcyclingpatterns@gmail.com` (or whichever email should receive form submissions).
3. Click **Create Access Key**.
4. Copy the new key (looks like `aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee`).
5. Two ways to install it:

   **Option A — via the admin panel (easier):**
   - Log in at `/admin/`.
   - **Site Settings → General Information → Web3Forms Access Key**.
   - Paste the new key, save, publish.
   - `data/site.json` will be updated and `script.js` reads from it at runtime, overriding the hard-coded fallback.

   **Option B — directly in code (3 places, must all match):**
   - `index.html` (2 occurrences): the `data-access-key="..."` attribute on `<form id="contactForm">` AND the `<input type="hidden" name="access_key" value="..." />` field.
   - `script.js` (1 occurrence): the `WEB3FORMS_ACCESS_KEY` constant near the top.
   - `data/site.json` (1 occurrence): the `web3formsKey` field.
   - Commit and push.

6. Test by sending yourself a message from the live site.

**Form behaviour:**
- JS enabled (the normal case) → `script.js` submits via `fetch()` and shows an inline thank-you message. The visitor stays on the same page.
- JS disabled (rare) → the browser performs a native POST and Web3Forms redirects to `/success.html` (set via the form's hidden `redirect` field).
- Network failure or invalid key → the email link in the contact card opens the visitor's mail client with a fallback message.

---

## ☑️ Step 6 — Custom domain (optional)

1. **Netlify dashboard → Domain settings → Add custom domain**.
2. Enter `upcyclingpatterns.com`.
3. Netlify shows you DNS records — set them at your registrar:
   - `A` record → `75.2.60.5`
   - `CNAME` `www` → `your-site.netlify.app`
4. Wait 5–10 minutes for DNS to propagate.
5. **Domain settings → HTTPS → Provision certificate** (or wait — Netlify does it automatically).

The site is now reachable at `https://upcyclingpatterns.com` with the apex (no `www`) as canonical.

---

## ☑️ Step 7 — Smoke test

Open `https://upcyclingpatterns.com/` and tick:

| Check | Expected |
|---|---|
| Page loads | Hero visible in < 2 s |
| Theme toggle (top-right) | Light ↔ Dark, persists on refresh |
| Language toggle (EN/TR) | Switches all visible text, persists on refresh |
| Click a gallery image | Lightbox opens with prev/next |
| FAQ accordion | Chevron rotates 45° when expanding |
| Cookie banner | Appears once, dismisses on click |
| Mobile menu | Hamburger slides open on small screens |
| Contact form (JS on) | Sends successfully → inline "Thank you" message |
| Contact form (JS off) | Native POST → redirects to `/success.html` |
| Admin panel | `/admin/` shows login → after login, all 7 collections visible |
| Direct publishing | Save in admin → one commit is created on `main` and Netlify starts a deploy |
| 404 page | Visit `/this-does-not-exist` → custom 404 shows |
| Legal pages | Visit `/privacy`, `/terms`, `/accessibility`, `/funding`, `/cookies` — all load and redirect to `.html` versions |
| Privacy / Cookie / Terms | Same dark mode as main site, EN/TR switcher works |
| Social share preview | Paste site URL into WhatsApp/Twitter → preview shows logo + title + description |
| PWA install | Chrome/Edge address bar shows install button |
| Sitemap | Visit `/sitemap.xml` → pretty HTML table (XSL styled), not raw XML |

---

## 🆘 Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Admin shows blank page | Identity not enabled | Step 3 |
| Admin says "config error" | Missing `data/*.json` | Make sure all 7 files are in `data/` |
| Admin can't save | Git Gateway disabled | Step 3 |
| Turkish text saves but English is not translated | `DEEPL_AUTH_KEY` missing or invalid | Complete Step 4.1 and redeploy |
| Admin login redirects in a loop | Identity invite email link expired | Re-invite the user |
| Site shows `ERR_TOO_MANY_REDIRECTS` on only one device | Old apex/`www` 301 responses cached by that browser | Deploy v1.3.1+, then visit `/reset-browser` once on that device |
| Admin shows "Failed to load entries" only on live site | `local_backend: true` left in `admin/config.yml` | Comment it out (it's only for local dev with `npx decap-server`) |
| Form silently fails | Web3Forms key invalid or unset | Step 5 |
| CMS images broken | `images/uploads/` doesn't exist | Create it as an empty folder + commit `.gitkeep` |
| CMS edits from admin don't show on site | Draft not published, deploy still building, or browser cache | Publish the entry, wait for Netlify deploy, then hard reload |
| "Not secure" warning | First deploy without HTTPS | Wait 5 min for Netlify auto-cert |
| Dark mode flash on load | Browser cache | Hard reload (Ctrl/Cmd+Shift+R) |
| Language doesn't switch on legal pages | Cached JS | Hard reload |
| `_headers` rules don't apply | Filename has `.txt` extension | Rename to `_headers` (no extension) |
| `.gitignore` doesn't ignore anything | File uploaded as `_gitignore` | Rename to `.gitignore` (with leading dot) before pushing |
| PWA install button missing | Icons not deployed or browser cache | Confirm `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` exist in `/images/pwa/`, then hard reload |
| Sitemap shows raw XML | Browser cache or XSL not present | Hard reload; confirm `/sitemap.xsl` exists in repo root |

---

## 🔄 Updating the site after deploy

Two ways:

**For editors (recommended):**
- Log in at `/admin/` → edit content → publish. Done.

**For developers:**
```bash
git add .
git commit -m "Describe what you changed"
git push
```
Netlify auto-deploys in ~30 seconds.

---

## 📞 Quick contacts

- **Web3Forms:** [https://web3forms.com](https://web3forms.com) — free, no signup
- **Netlify Identity docs:** [https://docs.netlify.com/security/secure-access-to-sites/identity/](https://docs.netlify.com/security/secure-access-to-sites/identity/)
- **Decap CMS docs:** [https://decapcms.org/docs/](https://decapcms.org/docs/)
- **Project email:** upcyclingpatterns@gmail.com

---

## ✅ You're done

Once Steps 1–5 are complete, the site is fully operational: live homepage, working admin (with editorial workflow), dark mode, EN/TR switching, lightbox, cookie compliance, contact form, friendly 404, and proper social-share previews. Step 6 (custom domain) and Step 7 (smoke test) can be done at your own pace.

---

## 📝 Notes — Included visual assets

These assets are included in the repository and should be pushed with the site:

**PWA icons.**
- `/images/pwa/icon-192.png` (192×192 — Android home screen)
- `/images/pwa/icon-512.png` (512×512 — splash screen)
- `/images/pwa/icon-maskable-512.png` (512×512 with safe-area padding — Android adaptive shapes)
- `/favicon.ico`, `/images/favicon.png`, and `/apple-touch-icon.png`

**Open Graph image.** `/og-image.png` is included at 1200×630 for social previews on WhatsApp, X/Twitter, LinkedIn, Facebook, and search result cards.

**Other expected images.** Keep the organized assets under `/images/hero/`, `/images/branding/`, `/images/gallery/`, and `/images/logos/`. The automated asset tests verify every referenced local file before deployment.

---

**Last updated:** 15 June 2026 · v1.5.1
