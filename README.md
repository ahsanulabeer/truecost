# TrueCost

> The real cost of home — beyond the listing price.

TrueCost takes a US home address and returns the **true monthly cost of ownership**: mortgage P+I, property tax, insurance, utilities, maintenance reserves, and HOA — all in one view. It combines real listing/AVM data from RentCast with regional cost analysis from Anthropic's Claude API to give a much more honest picture than the sticker price alone.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.5.0-blue)

## Features

- **Two-column app layout** — fixed-viewport: search bar + intro on the left (vertically centered, doesn't move), results / suggestions / loading on the right with internal scroll. Mobile collapses to a single column with normal page scroll
- **Auto-loaded nearby listings** — geolocation request fires on first paint; if granted, the right panel populates with ~6 active MLS listings from the user's ZIP. If the user denies (or geolocation fails), the panel populates anyway, falling back to a randomized pick from a curated NYC residential neighborhood list (Park Slope, Astoria, Forest Hills, Riverdale, UWS, Bay Ridge, Jackson Heights, Williamsburg, LIC, Sunset Park) — title swaps to "Homes in [Neighborhood]" so it's never a lie
- **Refresh suggestions** — circular icon button in the listings header advances the RentCast offset by 6 each click (shows the next page). Logo click does the same. Existing cards stay visible and dim during fetch (no skeleton flash); icon spins. Wraps back to offset 0 if the page returns 0 listings
- **Listing-card result view** — analysis renders as a Zillow-style property card with a Street View hero, address heading, beds · baths · sqft · year-built meta, and a side-by-side List Price / True Monthly block
- **Real property data** — active MLS listings or AVM valuations from [RentCast](https://www.rentcast.io/api)
- **Live cost analysis** — Claude estimates regional taxes, utilities, insurance, and maintenance based on the property's location, age, and characteristics
- **Property imagery** — Google Maps Static + Street View Static images, with metadata-checked fallback to a hybrid satellite map when no Street View is available
- **Authoritative formatted addresses** — when RentCast returns an estimate without a normalized address (or the typed input is messy), the property-image function reverse-geocodes via Google so the displayed address is always canonical
- **Adjustable inputs** — change list price, down payment, or interest rate and totals recompute instantly. List price formats with thousand separators as you type
- **Confidence + source badges** — every result tells you whether the price came from a live listing or an AVM estimate, and the model's confidence
- **Cost considerations** — 0–3 region-specific red flags (flood zones, high tax districts, aging systems, etc.)
- **Multi-phase loading screen** — single line of icon "stations" (search → home → tax → utilities → maintenance → insurance → done) above a thin progress bar; the active station pulses red, completed stations fill black, the bar fills with the brand red as the analysis proceeds

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
- A [Google Maps API key](https://console.cloud.google.com/apis/credentials) with **Maps Static API**, **Street View Static API**, and **Geocoding API** enabled (Geocoding powers the canonical-address fallback and the lat/lng → ZIP lookup behind nearby listings). For production, restrict the key to HTTP referrers matching your domain — the key is embedded in image URLs sent to the browser.

> ⚠️ Use `netlify dev`, **not** `npm run dev`. The vanilla Vite dev server doesn't run the serverless functions in `netlify/functions/`, so the API calls would 404.

## Project layout

```
netlify/functions/
├── analyze.js              — Anthropic proxy (keeps the key server-side, normalizes upstream errors)
├── rentcast.js             — RentCast proxy (listings + AVM fallback)
├── property-image.js       — Google Maps proxy (Street View metadata + Geocoding for canonical address + image URLs)
└── nearby-listings.js      — Reverse-geocode lat/lng → ZIP, RentCast listings-by-ZIP, parallel Street View per listing

src/
├── App.jsx                 — state, two-column layout, analyze() orchestration, derived totals
├── App.css                 — all visual styles
├── components/
│   ├── Header.jsx          — minimal: logo (red equal-mark + wordmark + tagline) that triggers a refresh on click
│   ├── SearchForm.jsx      — address input, params, analyze button
│   ├── LoadingState.jsx    — icon-station progress bar with single-phrase status
│   ├── NearbyListings.jsx  — auto-fires geolocation, NYC fallback, paginated refresh, image-led property cards
│   ├── ResultView.jsx      — orchestrates the result section
│   ├── PropertyHero.jsx    — listing-card: image hero, address, meta, List Price + True Monthly side-by-side, badges
│   ├── CostCards.jsx       — 6-card monthly cost grid
│   ├── AnalysisBlock.jsx   — narrative + market context
│   └── RedFlagsBlock.jsx   — cost-warning items
└── utils/
    └── format.js           — currency formatter + thousand-separator helper
```

## Deploy (Netlify)

The frontend and the proxy functions deploy together — there's no separate backend to manage.

1. Push to GitHub (auto-deploys if the repo is connected to a Netlify site).
2. In **Netlify dashboard → Site settings → Environment variables**, add:
   - `ANTHROPIC_API_KEY`
   - `RENTCAST_API_KEY`
   - `GOOGLE_MAPS_API_KEY`

   (No `VITE_` prefix — these are read by the serverless functions, not the client.)
3. Netlify reads `netlify.toml` for the build command, publish directory, and `/api/*` → `/.netlify/functions/:splat` redirect, so `/api/analyze`, `/api/rentcast`, `/api/property-image`, and `/api/nearby-listings` route to the functions automatically.
4. In **Google Cloud Console**, restrict your Maps API key to HTTP referrers matching your deployed domain (e.g. `https://yoursite.netlify.app/*`). The key is embedded in the image URLs returned to the browser — referrer restriction is what stops third parties from using your quota.

## Security

The Anthropic and RentCast keys are fully server-side: the browser never sees them. `src/App.jsx` calls `/api/analyze` and `/api/rentcast` on the same origin, and the Netlify Functions inject the real keys before forwarding upstream.

The Google Maps key is a different shape of trust. Static-map and Street-View URLs are images the browser fetches directly from `maps.googleapis.com`, so the key has to ride along in the URL string. The defense for that is **HTTP-referrer restriction in Google Cloud Console** — restrict the key to `https://yourdomain/*` and the wider internet can't reuse your quota.

If you previously ran with `VITE_*`-prefixed keys (those got inlined into the browser bundle), **rotate them in the Anthropic, RentCast, and Google Cloud dashboards** before going public.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Current version: **0.5.0** (two-column layout + brand refresh + auto-loaded suggestions + redesigned loading state).

The version shown in the app header is read directly from `package.json`. Bump it there before tagging a release.

### Changelog

- **0.5.0**
  - **Two-column app layout.** `.app` is now a fixed `100vh` flex column with `overflow: hidden`. `.main` is a CSS grid (`minmax(360px, 5fr) minmax(0, 7fr)`) splitting the viewport in half: left panel holds the intro headline + subhead + SearchForm and is `overflow: hidden` (locked in place, vertically centered); right panel is `overflow-y: auto` with a styled scrollbar and renders one of `NearbyListings` / `LoadingState` / error / `ResultView` based on state. Mobile (< 900px) collapses to a single column with normal page scroll. Removed the old anchor refs and result-scroll effects — no longer needed when the right column is always in view.
  - **Brand refresh.** Switched the visual identity:
    - Display font moved from DM Serif Display to **DM Sans** at weight 900 (heavier, more impactful). Body weights extended to the full 300–900 range. Instrument Serif dropped entirely (one fewer font request).
    - Primary color shifted from forest green (`#2c6e49`) to a warm red (`#c84030`); primary-light/dark recalibrated. `--text` darkened to `#1a1a1a` for a truer black under the heavier wordmark.
    - **New token**: `--money: #1e3a5f` (deep navy). All previously-red price elements (True Monthly Cost label + value, listing-card price overlay, fallback price) now render in navy — red on dollar amounts read as "alert" / "something is wrong" in financial UIs, navy reads as trust/finance and stays distinct from the brand red.
    - **New logo** in `Header.jsx`: black wordmark, weight 900, sized 26px with negative letter-spacing, plus a red unequal "equal sign" to the left (top bar 16px, bottom bar 26px, both 4px tall) implemented as flex-stacked `<span>` elements.
    - **Confidence badge `.high`** decoupled from `--primary` (was green, would have been red and collided with `.low`). Now charcoal text on warm-cream surface — a "verified" treatment.
    - `.headline` typography retuned: weight 900, line-height 1.05, letter-spacing -1.5px (heavy sans needs different optical compensation than display serif).
  - **Auto-loaded nearby listings.** `NearbyListings` no longer has a CTA button. On mount, geolocation request fires immediately with an 8s timeout. On grant, fetches with the user's coords. On denial / timeout / no API, picks one of 10 curated NYC residential neighborhoods at random (Park Slope, Astoria, Forest Hills, Riverdale, UWS, Bay Ridge, Jackson Heights, Williamsburg, LIC, Sunset Park) and uses those coords. The title swaps from "Homes near you" to "Homes in [Neighborhood]" when the fallback fires so the heading is never misleading. While fetching, a 4-card shimmering skeleton occupies the grid. Removed the dismiss-on-direct-search rule and `nearbyDismissed` state — listings are now permanent fixtures of the right panel until results take over.
  - **Refresh / pagination.** `/api/nearby-listings` now accepts an `offset` parameter and forwards it to RentCast. `NearbyListings` tracks an `offset` state, advances by 6 per refresh. Two refresh entry points, both behaving identically: a circular icon button in the section header (Lucide-style `refresh-cw` SVG with a `refresh-spin` keyframe), and a logo click — wired via a `refreshSignal` prop with a `useRef` first-render guard. Existing cards stay visible during refresh, dim to 0.55 opacity, become unclickable; no skeleton flash. If a paginated fetch returns 0 listings AND offset > 0, offset resets to 0 (one extra fetch) so the user always sees something.
  - **Loading screen redesign.** Replaced the 7-row stepper list with a single horizontal row of 7 circular icon "stations" (search → home → bar-chart → zap → wrench → shield → check-circle, all inline SVGs in Lucide style), a thin 3px progress bar fills `--primary` red beneath them, and a single phrase below the bar shows only the current step's text. Stations animate: pending = muted on cream, done = white-on-black, active = white-on-red with a 1.4s scale-pulse. Bar fill = `((step + 1) / 7) × 100%` with a 0.4s eased `width` transition.
  - **Header simplified.** Removed the version badge from the wordmark and the right-side ticker that displayed "30yr Fixed: 7.10%" and "Avg Maintenance: 1.0%/yr" — both were misleading (the rate was just echoing the input field default; the maintenance number was a hardcoded 1% rule constant unrelated to the actual cost-card output). Tagline "The real cost of home" relocated under the wordmark as an uppercase letterspaced subtitle inside a new `.logo-stack`. `Header.jsx` no longer takes `interestRate`.
  - **List price comma formatting.** New `formatThousands(value)` helper in `utils/format.js`. Wired into `PropertyHero`'s editable price input (`onChange` formats keystrokes) and into both programmatic `setListingPrice` calls in `App.jsx` (RentCast price + Claude estimate). The existing `activePriceNum` parser already strips non-digits, so calculations work transparently.
  - **Vertical centering.** Left panel uses `justify-content: center`. Loading state self-centers via `margin-top: auto; margin-bottom: auto` inside the right-panel flex column.
  - **Bug fix: Analyze button event-as-arg.** `<button onClick={onAnalyze}>` was passing the SyntheticEvent as the first argument to `analyze`, which was treating it as `addressOverride` and crashing on `.trim()`. The Enter-key path called `onAnalyze()` with no args, which is why typed-then-Enter worked but typed-then-Click didn't. Fixed at the call site (`onClick={() => onAnalyze()}`) and defensively in `analyze()` itself (`typeof addressOverride === "string" ? addressOverride : null`).
- **0.4.0**
  - **Nearby listings.** New `NearbyListings` component renders a "Search for homes in your area" CTA under the search form. On click it requests browser geolocation; on grant, the new `/api/nearby-listings` function reverse-geocodes the coordinates to a ZIP via Google's Geocoding API (with `result_type=postal_code` for surgical accuracy), queries RentCast for active sale listings in that ZIP, and runs parallel Street View metadata checks for each result. Each listing renders as a property-style card with a 16:9 Street View hero (hybrid satellite map fallback), price chip overlay, and emphasized address + beds/baths/sqft meta. Clicking a card runs the full analysis on that property without re-routing through the address input.
  - **Dismiss-on-direct-search.** If the user submits a typed address before engaging the nearby-listings feature, the CTA is permanently removed for the rest of the session (only restored on a real page refresh). If listings have already been shown, the grid stays visible across analyses so the user can keep clicking through suggestions.
  - **Canonical address fallback.** Added a Google Geocoding call to `/api/property-image`, returning a `formattedAddress` alongside the image URLs. `App.jsx` resolves the displayed address by priority: `rcData.address → imgData.formattedAddress → user-typed`. This eliminates the "Property Address Not Provided" placeholder Claude was producing when RentCast returned an estimate without a normalized address, and corrects messy typed inputs (e.g. "123 main st brooklyn" → "123 Main St, Brooklyn, NY 11201").
  - **`analyze()` accepts an address override.** Refactored to take an optional first argument so a card click can analyze a listing's address without waiting for a `setAddress` re-render. Promise.all swaps the RentCast fetch out for `Promise.resolve(prefetched)` when the caller already has the data.
  - **Hardened analyze proxy.** `/api/analyze` now wraps the upstream fetch in try/catch (network failures → 502 with cause), and on non-2xx responses parses Anthropic's body to surface `error.message` even when the upstream returns non-JSON (HTML error pages, plain text). The client always gets a structured `{ error: { message } }` payload now, so popup errors are diagnostic instead of "API error: 500 Internal Server Error".
  - **Suggestion-card visual polish.** Cards moved to a `minmax(280px, 1fr)` grid with 16/18px padding, address bumped from 13 → 16px (weight 500, slight negative tracking), meta from 12 → 13px, and price overlay from 18 → 20px to balance the hero image weight.
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
