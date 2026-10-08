# Heaven — Luxury Real Estate Website

A fast, fully responsive multi-page real-estate site with real photography, cinematic scroll animations, an interactive 3D floor plan and a built-in assistant ("Halo").

Built with **Vite + vanilla JS**, **three.js**, **GSAP** (ScrollTrigger, SplitText) and **Lenis**. There is no framework and no backend: everything is static and can be hosted anywhere (Netlify, Vercel, cPanel, S3…).

## Quick start

```bash
npm install
npm run dev       # local dev server at http://localhost:5173
npm run build     # production build into /dist
npm run preview   # serve the production build locally
```

Upload the contents of `dist/` to any static host. Configure the host to serve `404.html` for unknown routes.

## Pages

| Page | File | Highlights |
|---|---|---|
| Home | `index.html` | Golden-hour photo hero with slow zoom and parallax, quick search, scroll-lit statement, featured carousel, **pinned "Build your Heaven" photo story**, neighbourhood cards, Heaven Match CTA, counters, testimonials, journal, CTA |
| Properties | `properties.html` | Live filters (search, buy/rent, area, type, beds, price), sort (incl. "best match"), grid/list view, saved homes, compare, URL sync, mobile filter sheet |
| Property detail | `property.html?id=…` | Gallery + lightbox (swipe/keys), day/dusk preview, **interactive 3D floor plan**, neighbourhood scores, mortgage calculator with donut chart, tour booking, similar and recently viewed homes |
| Buy / Rent | `buy.html`, `rent.html` | Process steps, pre-filtered listings, FAQs |
| Sell | `sell.html` | **Instant valuation tool**, marketing plan, seller story |
| About | `about.html` | Story, counters, values, pinned horizontal milestones timeline |
| Agents | `agents.html` | Filterable advisor cards with contact actions |
| Journal / Article | `journal.html`, `article.html?id=…` | Category filters, reading-progress bar, related posts |
| Contact | `contact.html` | Validated form, office cards, illustrated map, FAQ |
| 404 | `404.html` | Friendly not-found page with photo and quick links |

## Signature features

- **Halo chatbot** (`src/js/components/chatbot.js`, knowledge base in `src/data/chatbot.js`): typo-tolerant intent matching, natural-language property search ("3 bed villa in Malibu under 5M"), mortgage maths ("mortgage on $1.5M"), a guided tour-booking flow, quick-reply chips, and history kept for the session.
- **Heaven Match quiz:** 5 questions about how you live, then every home gets a match % that is used for sorting and badges. It also personalises the hero greeting ("Good evening, Alex. 5 homes match your preferences").
- **Time-aware greeting:** the hero card greets visitors by time of day (and by name after the quiz).
- **Favourites and compare:** heart any home (saved in the browser), then compare up to 3 side by side.
- **Dark mode** (follows the system, with a manual toggle), a custom cursor, magnetic buttons, rolling-letter nav, page-transition curtain, and a first-visit preloader.

## Editing content

All content lives in plain data files, so no code changes are needed:

- `src/data/properties.js` — listings (price, beds, images, features, neighbourhood scores, agent)
- `src/data/agents.js` — team
- `src/data/articles.js` — journal posts
- `src/data/chatbot.js` — Halo's answers and keywords
- Shared header and footer: `src/partials/*.html` (included into every page at build time)
- Colours and type: `src/styles/tokens.css`

### Images

Photos are royalty-free from Unsplash, stored locally as WebP in two sizes (`-sm` 860px, `-lg` 1600px). To add one, put its Unsplash photo id in `scripts/fetch-images.mjs` and run `npm run images`, or drop your own `name-sm.webp` / `name-lg.webp` into `public/images/`.

## Performance notes

- three.js (~196 KB gzipped) is code-split and only loaded on the property page, when the 3D floor plan scrolls near the viewport. It pauses off-screen and in background tabs.
- Adaptive quality: slow devices automatically drop resolution and frame rate. Mobile renders at a lower pixel ratio, without shadows, at 30 fps.
- Self-hosted, preloaded latin font subsets; responsive `srcset` images; lazy loading; no layout shift from JS-rendered lists.
- `prefers-reduced-motion` disables smooth scroll and heavy motion.

## Project structure

```
index.html … 404.html        pages (Vite multi-page inputs)
public/                      images, fonts, favicon, manifest, robots, sitemap
scripts/fetch-images.mjs     image downloader
src/data/                    content
src/partials/                head, header, footer, filters, CTA band
src/styles/                  tokens, base, components, home, pages
src/js/main.js               shared boot (scroll, nav, transitions, cursor, theme, favourites, chat)
src/js/core/                 utils, store, motion, icons
src/js/components/           chatbot, quiz, listing filters, cards, carousel
src/js/three/                stage, floorplan
src/js/pages/                one entry per page
```
