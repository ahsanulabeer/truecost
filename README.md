# TrueCost

> The real cost of home — beyond the listing price.

TrueCost takes a US home address and returns the **true monthly cost of ownership**: mortgage P+I, property tax, insurance, utilities, maintenance reserves, and HOA — all in one view. It combines real listing/AVM data from RentCast with regional cost analysis from Anthropic's Claude API to give a much more honest picture than the sticker price alone.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.3.0-blue)

## Features

- **Listing-card result view** — the analysis renders as a Zillow-style property card with a Street View hero image, a small map inset, address heading, beds · baths · sqft · year-built meta, and a side-by-side List Price / True Monthly block
- **Real property data** — pulls active MLS listings or AVM valuations from [RentCast](https://www.rentcast.io/api)
- **Live cost analysis** — Claude estimates regional taxes, utilities, insurance, and maintenance based on the property's location, age, and characteristics
- **Property imagery** — Google Maps Static + Street View Static images, with metadata-checked fallback to a hybrid satellite map when no Street View is available for the address
- **Adjustable inputs** — change the listing price, down payment, or interest rate and the totals recompute instantly
- **Confidence + source badges** — every result tells you whether the price came from a live listing or an AVM estimate, and how confident the model is
- **Cost considerations** — surfaces 0–3 region-specific red flags (flood zones, high tax districts, aging systems, etc.)
- **Smooth focus flow** — clicking Analyze scrolls to the loading state; when the result lands, the property card scrolls fully into view automatically
- **Clickable home logo** — the TrueCost wordmark in the header resets the search/result and smooth-scrolls to the top

## Stack

- React 19 + Vite
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- RentCast API (listings + AVM)
- Google Maps Static API + Street View Static API (property imagery)
- Plain CSS, no UI framework

## Setup

```bash
git clone <this-repo>
cd truecost
npm install
npm install -g netlify-cli   # one-time, for local serverless functions
cp .env.example .env
# fill in your two API keys (no VITE_ prefix — they're server-side only)
netlify dev                  # serves the site + functions at localhost:8888
```

You'll need:
- An [Anthropic API key](https://console.anthropic.com/settings/keys)
- A [RentCast API key](https://app.rentcast.io/app/api) (free tier covers `/listings/sale`; AVM `/avm/value` requires a paid plan)
- A [Google Maps API key](https://console.cloud.google.com/apis/credentials) with **Maps Static API** and **Street View Static API** enabled. For production, restrict the key to HTTP referrers matching your domain — the key is embedded in image URLs sent to the browser.

> ⚠️ Use `netlify dev`, **not** `npm run dev`. The vanilla Vite dev server doesn't run the serverless functions in `netlify/functions/`, so the API calls would 404.

## Project layout

```
netlify/functions/
├── analyze.js              — Anthropic proxy (keeps the key server-side)
├── rentcast.js             — RentCast proxy (listings + AVM fallback)
└── property-image.js       — Google Maps proxy (Street View metadata check + image URLs)

src/
├── App.jsx                 — state, analyze() orchestration, derived totals, scroll behaviors
├── App.css                 — all visual styles
├── components/
│   ├── Header.jsx          — clickable logo (resets app state) + ticker
│   ├── SearchForm.jsx      — address input, params, analyze button
│   ├── LoadingState.jsx    — animated step indicator
│   ├── ResultView.jsx      — orchestrates the result section
│   ├── PropertyHero.jsx    — listing-card: image hero, address, meta, List Price + True Monthly side-by-side, badges
│   ├── CostCards.jsx       — 6-card monthly cost grid
│   ├── AnalysisBlock.jsx   — narrative + market context
│   └── RedFlagsBlock.jsx   — cost-warning items
└── utils/
    └── format.js           — currency formatter
```

## Deploy (Netlify)

The frontend and the proxy functions deploy together — there's no separate backend to manage.

1. Push to GitHub (auto-deploys if the repo is connected to a Netlify site).
2. In **Netlify dashboard → Site settings → Environment variables**, add:
   - `ANTHROPIC_API_KEY`
   - `RENTCAST_API_KEY`
   - `GOOGLE_MAPS_API_KEY`

   (No `VITE_` prefix — these are read by the serverless functions, not the client.)
3. Netlify reads `netlify.toml` for the build command, publish directory, and `/api/*` → `/.netlify/functions/:splat` redirect, so `/api/analyze`, `/api/rentcast`, and `/api/property-image` route to the functions automatically.
4. In **Google Cloud Console**, restrict your Maps API key to HTTP referrers matching your deployed domain (e.g. `https://yoursite.netlify.app/*`). The key is embedded in the image URLs returned to the browser — referrer restriction is what stops third parties from using your quota.

## Security

The Anthropic and RentCast keys are fully server-side: the browser never sees them. `src/App.jsx` calls `/api/analyze` and `/api/rentcast` on the same origin, and the Netlify Functions inject the real keys before forwarding upstream.

The Google Maps key is a different shape of trust. Static-map and Street-View URLs are images the browser fetches directly from `maps.googleapis.com`, so the key has to ride along in the URL string. The defense for that is **HTTP-referrer restriction in Google Cloud Console** — restrict the key to `https://yourdomain/*` and the wider internet can't reuse your quota.

If you previously ran with `VITE_*`-prefixed keys (those got inlined into the browser bundle), **rotate them in the Anthropic, RentCast, and Google Cloud dashboards** before going public.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Current version: **0.3.0** (listing-card result view + Street View / map property imagery).

The version shown in the app header is read directly from `package.json`. Bump it there before tagging a release.

### Changelog

- **0.3.0**
  - **New listing-card result view.** `ResultHeader` and `TotalBar` were merged into a single `PropertyHero` that mirrors a Zillow/Redfin property card: image hero on top, address heading + beds/baths/sqft/year-built meta, and a side-by-side List Price (editable) / True Monthly (brand-color, prominent) block underneath.
  - **Property imagery via Google Maps.** New `/api/property-image` Netlify Function calls Google's Street View metadata endpoint to check availability, then returns Street View + Static Map URLs. The frontend uses Street View as the hero with the map as a corner inset; if no Street View is available for the address, the map fills the whole hero.
  - **Clickable home logo.** The TrueCost wordmark in the header is now a button — clicking it resets address, listing price, result, property data, image, error, and loading state, then smooth-scrolls to the top.
  - **Auto-scroll behaviors.** Pressing Analyze smooth-scrolls to a permanent anchor just below the search form (so the loading state lands in view, with `scroll-padding-top` accounting for the sticky header). When the result lands, a separate effect smooth-scrolls the property card into view with `block: "end"` and a `scroll-margin-bottom` buffer.
  - **Favicon.** Replaced the template's lightning-bolt mark with a green `TC` monogram in the brand color.
  - **Component cleanup.** Removed `ResultHeader.jsx` and `TotalBar.jsx`; their roles consolidated into `PropertyHero.jsx`. `analyze()` now optionally accepts an address override, and image fetching runs in parallel with RentCast via `Promise.all`.
- **0.2.0** — Both Anthropic and RentCast calls moved behind Netlify Functions; client no longer reads any API keys.
- **0.1.0** — Initial release. Component-first React/Vite layout, direct browser-to-API calls (keys exposed in bundle).

## License

Not yet specified.
