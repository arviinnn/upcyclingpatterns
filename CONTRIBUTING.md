# Contributing

This project is a static Erasmus+ website. Most everyday edits should happen through `/admin/`, not by editing code.

## Folder Map

- `index.html`: The homepage structure.
- `style.css`: Visual design, responsive layout, light/dark mode rules.
- `script.js`: Interactions, CMS JSON loading, forms, language switching, PWA registration.
- `sw.js`: Offline cache and PWA service worker.
- `data/`: Editable site content in JSON format.
- `images/`: Site images, logos, icons and uploads.
- `scripts/`: Local build, validation and utility scripts.
- `tests/`: Automated checks for accessibility, links and translations.
- `netlify/functions/`: Authenticated server-side helpers used by the admin panel.
- `.github/workflows/`: CI and Lighthouse automation.

## Before Publishing

Run these commands from the project root:

```bash
npm ci
npm run validate:json
npm test
npm run build
```

## Editing Rules

- Keep public text in `data/*.json` or `admin/config.yml` whenever possible.
- Keep images in the matching folder under `images/`.
- Do not place secret keys in frontend files.
- Use environment variables for backend secrets, for example `DEEPL_AUTH_KEY`.
- Test mobile width after layout changes.

## Image Rules

- Hero images: `images/hero/`
- Official logos: `images/logos/official/`
- Partner school logos: `images/logos/partners/`
- Gallery photos: `images/gallery/`
- PWA icons: `images/pwa/`
- CMS uploads: `images/uploads/`

## Commit Checklist

- JSON files parse successfully.
- No horizontal overflow on mobile.
- Logo strip keeps the same size in light and dark mode.
- Turkish and English labels both exist for new visible text.
- New files are listed in this guide or `CONTENT-GUIDE.md` if editors need to understand them.
