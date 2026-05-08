# TrueCost

> The real cost of home — beyond the listing price.

TrueCost takes a US home address and returns the **true monthly cost of ownership**: mortgage P+I, property tax, insurance, utilities, maintenance reserves, and HOA — all in one view. It combines real listing/AVM data from RentCast with regional cost analysis from Anthropic's Claude API to give a much more honest picture than the sticker price alone.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Version](https://img.shields.io/badge/version-0.6.0-blue)

## Features

- **Two-column app layout** — fixed-viewport: search bar + intro on the left (vertically centered, doesn't move), results / suggestions / loading on the right with internal scroll. Mobile collapses to a single column with normal page scroll
- **Address autocomplete** — Google Places suggestions appear as the user types (debounced, US-address-restricted, keyboard-navigable). Server-side `addressValid` check (Google Geocoding `location_type` + `street_number` presence) catches paste/junk bypasses
- **Auto-loaded nearby listings** — geolocation request fires on first paint; the right panel populates with ~10 active MLS listings filtered to **Single Family + Multi-Family** from the user's ZIP. If geolocation is denied or fails, falls back to a randomized pick from a curated NYC residential neighborhood list (Park Slope, Astoria, Forest Hills, Riverdale, UWS, Bay Ridge, Jackson Heights, Williamsburg, LIC, Sunset Park) — title swaps to "Homes in [Neighborhood]"
- **Refresh suggestions** — circular icon button in the listings header (and a logo click) advances the RentCast offset by 10 each time. Existing cards dim during fetch — no skeleton flash; icon spins. Wraps back to offset 0 if the page returns 0 listings
- **Compare-another strip in results** — after viewing a TrueCost report, a horizontal-scrolling row of nearby listings appears at the bottom. One click → analyze that property. The currently-displayed property is filtered out so you don't compare to yourself
- **Listing-card result view** — analysis renders as a Zillow-style property card with a Street View hero, address heading, beds · baths · sqft · year-built meta, and a side-by-side List Price / True Monthly block
- **Interactive cost breakdowns** — every cost card is clickable; opens a modal with an SVG donut chart breaking the line into sub-components (mortgage P+I split, property-tax jurisdictions, insurance categories, utility services, maintenance reserve buckets, HOA allocations). Hover any slice to dim others and see label/amount/percentage in the donut center; legend rows highlight in sync
- **Configurable mortgage** — pick from **30 / 20 / 15 / 10-year fixed** or **5/1, 7/1, 10/1 ARM**. Term drives amortization math; ARM selection automatically surfaces a rate-reset risk in the red flags
- **Household size factor** — 1–5+ occupants. Drives utilities (near-linear scaling) and maintenance estimates
- **Verified property tax (when available)** — RentCast's `/properties` endpoint pulls public-record tax data; when present, the propertyTax line is overridden with the verified annual amount divided by 12, and the breakdown is scaled proportionally to sum to the verified total
- **Real property data** — active MLS listings or AVM valuations from RentCast
- **Live cost analysis** — AI cost estimates for regional taxes, utilities, insurance, maintenance, and HOA based on the property's location, age, type, and household size
- **Property imagery** — Google Maps Static + Street View Static images, with metadata-checked fallback to a hybrid satellite map when no Street View is available
- **Authoritative formatted addresses** — Google Geocoding canonicalizes messy input (e.g. "123 main st brooklyn" → "123 Main St, Brooklyn, NY 11201")
- **Adjustable inputs** — change list price, down payment, interest rate, loan type, or household size; totals recompute instantly. List price formats with thousand separators as you type
- **How it works** — header pill button opens a methodology modal (data sources, what's verified vs. estimated, what's adjustable, disclaimers)
- **Confidence + source badges** — every result tells you whether the price came from a live listing or an AVM estimate, and the model's confidence
- **Cost considerations** — 0–3 region-specific red flags (flood zones, high tax districts, aging systems, ARM rate-reset risk)
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
- **Two Google Maps API keys** (the project splits browser-side vs. server-side calls so each key has minimum scope):
  - `GOOGLE_MAPS_API_KEY` — used for **Maps Static API** and **Street View Static API** image URLs that ride along in browser image tags. Restrict this one to **HTTP referrers** matching your domain.
  - `GOOGLE_MAPS_SERVER_KEY` — used by Netlify functions for **Geocoding API**, **Street View Static API** (metadata only), and **Places API** (autocomplete). Server calls have no HTTP referrer, so this key needs **Application restrictions: None**, with API restrictions limited to those three APIs. Without it, address autocomplete, address validation, ZIP-based listings lookup, and Street View availability checks all fail silently.
  - Optional simplification: if you don't want a second key, set only `GOOGLE_MAPS_API_KEY` with Application restrictions = None and all three APIs enabled — the server functions fall back to it. Less secure (a leaked key has wider scope) but works.

> ⚠️ Use `netlify dev`, **not** `npm run dev`. The vanilla Vite dev server doesn't run the serverless functions in `netlify/functions/`, so the API calls would 404.

## Project layout

```
netlify/functions/
├── analyze.js              — Anthropic proxy (keeps the key server-side, normalizes upstream errors)
├── rentcast.js             — RentCast proxy: parallel /listings + /avm + /properties; merges price/details with public-records property tax
├── property-image.js       — Google Maps proxy: Street View metadata + Geocoding (canonical address + addressValid signal + image URLs)
├── nearby-listings.js      — Lat/lng → ZIP via Geocoding; parallel RentCast /listings calls for Single Family + Multi-Family; interleaves and dedups; attaches Street View / static map per listing
└── place-autocomplete.js   — Google Places Autocomplete proxy for the address input dropdown (US-restricted, address-shape-only)

src/
├── App.jsx                 — state, two-column layout, analyze() orchestration, derived totals (mortgage P+I + breakdown), tax override pipeline
├── App.css                 — all visual styles
├── components/
│   ├── Header.jsx          — logo (red equal-mark + wordmark + tagline) + "How it works" pill
│   ├── HowItWorksModal.jsx — methodology / data-source / verified-vs-estimated explainer modal
│   ├── SearchForm.jsx      — address input with Places autocomplete dropdown, params (down/rate/household/loan-type), Generate TrueCost Report CTA
│   ├── LoadingState.jsx    — icon-station progress bar with single-phrase status
│   ├── NearbyListings.jsx  — image-led property cards grid (presentational only — state lives in useNearbyListings hook)
│   ├── CompareStrip.jsx    — horizontal-scrolling listings strip rendered at the bottom of the result view; click to analyze another property
│   ├── ResultView.jsx      — orchestrates the result section
│   ├── PropertyHero.jsx    — listing-card: image hero, address, meta, List Price + True Monthly side-by-side, badges
│   ├── CostCards.jsx       — 6-card monthly cost grid; click any card → CostBreakdownModal
│   ├── CostBreakdownModal.jsx — modal with SVG donut chart, hover-linked legend, and per-slice center display
│   ├── AnalysisBlock.jsx   — narrative + market context
│   └── RedFlagsBlock.jsx   — cost-warning items
├── hooks/
│   └── useNearbyListings.js — single-source hook for listings: geolocation, NYC fallback, paginated fetch, refresh, wrap-around
└── utils/
    ├── format.js           — currency formatter + thousand-separator helper
    └── loans.js            — loan-type catalog (30/20/15/10-year fixed + 5/7/10-year ARM): term months, ARM flag, prompt description
```

## Deploy (Netlify)

The frontend and the proxy functions deploy together — there's no separate backend to manage.

1. Push to GitHub (auto-deploys if the repo is connected to a Netlify site).
2. In **Netlify dashboard → Site settings → Environment variables**, add:
   - `ANTHROPIC_API_KEY`
   - `RENTCAST_API_KEY`
   - `GOOGLE_MAPS_API_KEY` — browser-side, referrer-restricted (Maps Static + Street View Static images that ride along in browser image tags)
   - `GOOGLE_MAPS_SERVER_KEY` — server-side, application-restriction = None, scoped to Geocoding + Street View Static + Places. Optional but strongly recommended; falls back to `GOOGLE_MAPS_API_KEY` if not set, but only works if that key has unrestricted application access.

   (No `VITE_` prefix — these are read by the serverless functions, not the client.)
3. Netlify reads `netlify.toml` for the build command, publish directory, and `/api/*` → `/.netlify/functions/:splat` redirect, so `/api/analyze`, `/api/rentcast`, `/api/property-image`, `/api/nearby-listings`, and `/api/place-autocomplete` route to the functions automatically.
4. In **Google Cloud Console**, restrict `GOOGLE_MAPS_API_KEY` to **HTTP referrers** matching your deployed domain (e.g. `https://yoursite.netlify.app/*`). The key is embedded in image URLs the browser fetches directly — referrer restriction is what stops third parties from using your quota. Keep `GOOGLE_MAPS_SERVER_KEY` with **Application restrictions = None** since Netlify outbound IPs aren't fixed; lock it down by **API restrictions** instead (Geocoding + Street View Static + Places).

## Security

The Anthropic and RentCast keys are fully server-side: the browser never sees them. `src/App.jsx` calls `/api/analyze` and `/api/rentcast` on the same origin, and the Netlify Functions inject the real keys before forwarding upstream.

The Google Maps key is a different shape of trust. Static-map and Street-View URLs are images the browser fetches directly from `maps.googleapis.com`, so the key has to ride along in the URL string. The defense for that is **HTTP-referrer restriction in Google Cloud Console** — restrict the key to `https://yourdomain/*` and the wider internet can't reuse your quota.

If you previously ran with `VITE_*`-prefixed keys (those got inlined into the browser bundle), **rotate them in the Anthropic, RentCast, and Google Cloud dashboards** before going public.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Current version: **0.6.0** (address autocomplete + interactive cost breakdowns + listing comparison strip + loan/household configurability + verified property tax).

The version shown in the app header is read directly from `package.json`. Bump it there before tagging a release.

### Changelog

- **0.6.0**
  - **Address autocomplete + validation.** New `/api/place-autocomplete` proxy calls Google Places Autocomplete (US-restricted, address-shape-only, capped at 5 suggestions). `SearchForm` debounces input by 250ms, renders a dropdown beneath the input with structured (main + secondary) results, supports keyboard navigation (Up/Down highlights, Enter selects, Esc dismisses), and refetches on focus when the user comes back to fix an input after an error. Server-side validation hardened: `/api/property-image` now also returns `addressValid`, requiring Google to geocode the input with a `street_number` component AND a non-`APPROXIMATE` `location_type`. RentCast is no longer trusted as an address validator (its loose matching previously let "Brooklyn, NY" through).
  - **Two-key Google Maps split.** Server-side calls (Geocoding, Places, Street View metadata) now use a separate `GOOGLE_MAPS_SERVER_KEY` env var with no application restriction; the original `GOOGLE_MAPS_API_KEY` stays referrer-restricted for image URLs. Falls back to the single key if the server var is unset. Solves the `REQUEST_DENIED — API keys with referer restrictions cannot be used with this API` failure for Places and was silently breaking Geocoding (and therefore the canonical-address fallback + ZIP-based listings lookup) for users with referrer-restricted keys.
  - **Loan type selector.** New dropdown in the params row: 30 / 20 / 15 / 10-year fixed and 5/1, 7/1, 10/1 ARM. Term drives both the prompt's pre-calculated mortgage and the live `computedMortgage` reactive recompute (formerly hardcoded to 360 months). ARM selection appends a directive to the prompt instructing Claude to surface rate-reset risk in the red flags. Introduced `src/utils/loans.js` as the single catalog used by both `App.jsx` math and `SearchForm` UI.
  - **Household size factor.** New select (1–5+) in the params row. Wired into the prompt as a `householdContext` block telling Claude to scale utilities near-linearly (4-person ≈ 2× 1-person at the same property) and to bump maintenance modestly (~10–15%) for heavier occupancy.
  - **Verified property tax.** `/api/rentcast` now also calls RentCast's `/properties` endpoint in parallel (independent of listings/AVM). New `extractAnnualTax` defensively parses the `propertyTaxes` field (object-keyed-by-year or array shapes), picks the most-recent positive total. When present, the prompt's verified-data block names the exact annual + monthly figure for Claude to use, AND `App.jsx` overrides `parsed.monthlyCosts.propertyTax.amount` after the fact (`Math.round(annualTax / 12)`) and proportionally scales the breakdown sub-amounts so the pie chart stays internally consistent. Sets `source: "public-records"` and `taxYear` for future "verified" badge display.
  - **Suggested-listing type filter.** `/api/nearby-listings` now fans out into two parallel RentCast calls per refresh — `propertyType=Single Family` and `propertyType=Multi-Family` — splitting `limit/2` and `offset/2` between them. Results are interleaved (SFH[0], MFH[0], SFH[1], MFH[1], ...), deduped by formatted address, and capped at the requested `limit`. No more condos/townhouses/manufactured/etc. cluttering the suggestion grid.
  - **Page size + skeleton bumped.** `PAGE_SIZE` raised from 6 → 10 listings per page; loading skeleton from 4 → 8 cards so the placeholder doesn't look thin against the final grid.
  - **Cost-card breakdown modals (donut + hover).** Each `CostCards` card is now a clickable `<button>`. Click opens `CostBreakdownModal` with: large navy total at top, an SVG donut chart (280×280, `rOuter=95`, `rInner=65` — sized so center text fits two-line labels like "Personal Property"), and a legend with color swatch / label / amount / percentage. Hover any slice — others dim to 0.35 opacity, the donut center fills with the slice's label/amount/percentage, and the matching legend row picks up an `.active` background. Hovering a legend row does the same in reverse. Center overlay is `pointer-events: none` so it doesn't intercept the cursor. Mortgage's breakdown is computed client-side (first-month Principal vs. Interest from amortization math); other categories use Claude's breakdown allocations from the prompt's expanded JSON schema.
  - **Compare-another strip in results.** Lifted listings state into a new `useNearbyListings` hook so both the listings view AND the result view can consume the same data. New `CompareStrip` component renders a horizontal-scrolling row of nearby listings at the bottom of the result view (above the disclaimer). Filters out the currently-displayed property by formatted-address match. Click any card → analyze that property without leaving results context. Same refresh button as the main listings header.
  - **"How it works" modal.** Header pill button (top-right, `margin-left: auto`) opens a methodology modal: where the numbers come from (vendor-anonymous: "licensed real estate data partners", "AI cost analysis", "trusted mapping data"), what's user-adjustable, what's verified vs. estimated, and a closing disclaimer.
  - **"Generate TrueCost Report" CTA.** Analyze button moved out of the search row onto its own full-width row at the bottom of the form. Renamed from "Analyze" to "Generate TrueCost Report". Picks up brand red with shadow lift on hover; disabled state until the address input has content.
  - **List price comma formatting.** `formatThousands` helper strips non-digits and re-formats with thousands separators on every keystroke. Wired into the editable price input AND into both programmatic `setListingPrice` calls in `App.jsx` (RentCast price + Claude estimate). Existing `activePriceNum` parser at the math boundary already strips commas, so calculations remain numeric.
  - **Bug: `analyze()` event-as-arg.** `<button onClick={onAnalyze}>` was passing the SyntheticEvent as `addressOverride`, crashing on `.trim()`. Fixed at the call site (`onClick={() => onAnalyze()}`) AND defensively in `analyze()` itself (`typeof addressOverride === "string" ? addressOverride : null`).
  - **Favicon.** Updated to a black/red equal-mark on cream rounded-square (matches the v0.5.0 logo refresh).
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
