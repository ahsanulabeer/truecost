# TrueCost

> The real cost of home — beyond the listing price.

TrueCost takes a US home address and returns the **true monthly cost of ownership**: mortgage P+I, property tax, insurance, utilities, maintenance reserves, and HOA — all in one view. It combines real listing/AVM data from RentCast with regional cost analysis from Anthropic's Claude API to give a much more honest picture than the sticker price alone.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.2.0-blue)

## Features

- **Real property data** — pulls active MLS listings or AVM valuations from [RentCast](https://www.rentcast.io/api)
- **Live cost analysis** — Claude estimates regional taxes, utilities, insurance, and maintenance based on the property's location, age, and characteristics
- **Adjustable inputs** — change the listing price, down payment, or interest rate and the totals recompute instantly
- **Confidence + source badges** — every result tells you whether the price came from a live listing or an AVM estimate, and how confident the model is
- **Cost considerations** — surfaces 0–3 region-specific red flags (flood zones, high tax districts, aging systems, etc.)

## Stack

- React 19 + Vite
- Anthropic Claude API (`claude-sonnet-4-20250514`)
- RentCast API (listings + AVM)
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

> ⚠️ Use `netlify dev`, **not** `npm run dev`. The vanilla Vite dev server doesn't run the serverless functions in `netlify/functions/`, so the API calls would 404.

## Project layout

```
netlify/functions/
├── analyze.js              — Anthropic proxy (keeps the key server-side)
└── rentcast.js             — RentCast proxy (listings + AVM fallback)

src/
├── App.jsx                 — state, analyze() orchestration, derived totals
├── App.css                 — all visual styles
├── components/
│   ├── Header.jsx          — logo + ticker
│   ├── SearchForm.jsx      — address input, params, analyze button
│   ├── LoadingState.jsx    — animated step indicator
│   ├── ResultView.jsx      — orchestrates the result section
│   ├── ResultHeader.jsx    — property name, badges, listing price input
│   ├── CostCards.jsx       — 6-card monthly cost grid
│   ├── TotalBar.jsx        — true monthly + annual totals
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

   (No `VITE_` prefix — these are read by the serverless functions, not the client.)
3. Netlify reads `netlify.toml` for the build command, publish directory, and `/api/*` → `/.netlify/functions/:splat` redirect, so `/api/analyze` and `/api/rentcast` route to the functions automatically.

## Security

API keys are kept server-side. The browser never sees `ANTHROPIC_API_KEY` or `RENTCAST_API_KEY` — `src/App.jsx` only ever calls `/api/analyze` and `/api/rentcast` on the same origin, and the Netlify Functions inject the real keys before forwarding to the upstream APIs.

If you previously ran with `VITE_*`-prefixed keys (those got inlined into the browser bundle), **rotate them in the Anthropic and RentCast dashboards** before going public.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Current version: **0.2.0** (added Netlify Functions proxy for both API calls).

The version shown in the app header is read directly from `package.json`. Bump it there before tagging a release.

### Changelog

- **0.2.0** — Both Anthropic and RentCast calls moved behind Netlify Functions; client no longer reads any API keys.
- **0.1.0** — Initial release. Component-first React/Vite layout, direct browser-to-API calls (keys exposed in bundle).

## License

Not yet specified.
