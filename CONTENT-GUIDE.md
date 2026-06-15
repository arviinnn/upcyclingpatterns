# Content Guide

This guide is for editors who do not write code.

## What To Edit In Admin

Open `/admin/` and use these sections:

- **Site Settings**: project name, email, dates, hero image, SEO text and social links.
- **Editable Site Text**: navigation labels, hero titles, snapshot labels and footer headings.
- **Design Settings**: hero height, hero crop, section spacing, logo sizes and map hotspot positions.
- **Project Timeline**: the cards shown in Explore > Timeline.
- **Mobility Visits**: country visit records for future mobility pages or reports.
- **Project Team**: team members and roles for a future team page.
- **Homepage Sections**: About, Goals, Activities, Results and Details cards.
- **News**: project announcements.
- **Gallery**: photos and YouTube video cards.
- **Downloads**: project files and outputs.
- **Partners**: partner school information.
- **FAQ**: questions and answers.

## Data Files

- `data/site.json`: global project settings.
- `data/content.json`: short visible interface labels.
- `data/design.json`: layout and visual sizing controls.
- `data/logos.json`: official footer logos.
- `data/timeline.json`: project timeline cards.
- `data/mobility.json`: international visit records.
- `data/team.json`: people and roles.
- `data/sections.json`: homepage section cards.
- `data/partners.json`: partner schools.
- `data/gallery.json`: gallery cards.
- `data/news.json`: news items.
- `data/outputs.json`: downloadable outputs.
- `data/faq.json`: FAQ entries.

## Image Folders

- `images/hero/`: first-screen hero artwork. The current optimized file is `hero.webp`.
- `images/branding/`: project logo files used by the site and admin.
- `images/logos/official/`: EU, national agency and project funding logos.
- `images/logos/partners/`: school logos.
- `images/gallery/`: photos used in the gallery.
- `images/pwa/`: install icons.
- `images/uploads/`: files uploaded from the admin panel.

## Safe Image Sizes

- Hero: WebP, around 1600px wide, under 500 KB if possible.
- Gallery photos: JPG/WebP, 1200x800 or 1200x900, under 2 MB.
- Logos: PNG/WebP/JPG with transparent or clean background, centered.
- OG image: 1200x630 PNG.

## Things Not To Change Manually

- Do not edit `sw.js` unless you understand service worker cache behavior.
- Keep `package-lock.json` committed so local and CI installs use the same dependency graph.
- Do not put passwords, API keys or webhook secrets in JSON, HTML, CSS or JS.

## Quick Recovery

If the site looks broken after an edit:

1. Run `npm run validate:json`.
2. Check the last JSON file edited in `/admin/`.
3. Hard-refresh the browser.
4. If service worker cache seems stuck, unregister the service worker in browser DevTools and reload.
