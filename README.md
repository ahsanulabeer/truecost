# TrueCost

> The real cost of home — beyond the listing price.

TrueCost takes a US home address and returns the **true monthly cost of ownership**: mortgage P+I, property tax, insurance, utilities, maintenance reserves, and HOA — all in one view. It combines real listing/AVM data from RentCast with regional cost analysis from Anthropic's Claude API to give a much more honest picture than the sticker price alone.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)

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
cd truecost-debug
npm install
cp .env.example .env
# fill in your two API keys
npm run dev
```

You'll need:
- An [Anthropic API key](https://console.anthropic.com/settings/keys)
- A [RentCast API key](https://app.rentcast.io/app/api) (free tier covers `/listings/sale`; AVM `/avm/value` requires a paid plan)

## Project layout

```
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

## Security note

Vite inlines every `VITE_*` env var into the browser bundle. This project currently calls Anthropic directly from the client (using `anthropic-dangerous-direct-browser-access`), which means the key is recoverable from any deployed JavaScript. Fine for local dev; **before any public deploy, route the Claude call through a backend proxy.**

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Current version: **0.1.0** (initial public-ready release).

The version shown in the app header is read directly from `package.json`. Bump it there before tagging a release.

## License

Not yet specified.
