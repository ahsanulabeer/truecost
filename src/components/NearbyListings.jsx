import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "../utils/format";

const NYC_FALLBACKS = [
  { latitude: 40.671, longitude: -73.981, name: "Park Slope" },
  { latitude: 40.7644, longitude: -73.9235, name: "Astoria" },
  { latitude: 40.7195, longitude: -73.8448, name: "Forest Hills" },
  { latitude: 40.8973, longitude: -73.9085, name: "Riverdale" },
  { latitude: 40.787, longitude: -73.9754, name: "Upper West Side" },
  { latitude: 40.6261, longitude: -74.0327, name: "Bay Ridge" },
  { latitude: 40.7556, longitude: -73.883, name: "Jackson Heights" },
  { latitude: 40.7081, longitude: -73.9571, name: "Williamsburg" },
  { latitude: 40.7447, longitude: -73.9485, name: "Long Island City" },
  { latitude: 40.6451, longitude: -74.0123, name: "Sunset Park" },
];

const PAGE_SIZE = 6;

function pickFallback() {
  return NYC_FALLBACKS[Math.floor(Math.random() * NYC_FALLBACKS.length)];
}

export default function NearbyListings({ onSelectListing, refreshSignal = 0 }) {
  const [coords, setCoords] = useState(null);
  const [offset, setOffset] = useState(0);
  const [listings, setListings] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [fallbackName, setFallbackName] = useState(null);
  const firstSignal = useRef(true);

  useEffect(() => {
    if (firstSignal.current) {
      firstSignal.current = false;
      return;
    }
    setOffset((o) => o + PAGE_SIZE);
  }, [refreshSignal]);

  useEffect(() => {
    let cancelled = false;

    function resolveFallback() {
      const fb = pickFallback();
      if (cancelled) return;
      setFallbackName(fb.name);
      setCoords({ latitude: fb.latitude, longitude: fb.longitude });
    }

    if (!navigator.geolocation) {
      resolveFallback();
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      resolveFallback,
      { timeout: 8000 }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    if (listings !== null) setRefreshing(true);

    fetch("/api/nearby-listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        offset,
        limit: PAGE_SIZE,
      }),
    })
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((data) => {
        if (cancelled) return;
        const next = data.listings || [];
        if (!next.length && offset > 0) {
          setOffset(0);
          return;
        }
        setListings(next);
        setRefreshing(false);
      })
      .catch(() => {
        if (!cancelled) setRefreshing(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, offset]);

  const title = fallbackName ? `Homes in ${fallbackName}` : "Homes near you";
  const isInitialLoad = listings === null;
  const refreshDisabled = isInitialLoad || refreshing;

  return (
    <section className="nearby-listings">
      <header className="nearby-listings-header">
        <h3 className="nearby-listings-title">{title}</h3>
        <button
          type="button"
          className={`nearby-refresh-btn${refreshing ? " is-refreshing" : ""}`}
          onClick={() => setOffset((o) => o + PAGE_SIZE)}
          disabled={refreshDisabled}
          aria-label="Show different listings"
          title="Show different listings"
        >
          <svg
            className="refresh-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            <path d="M3 21v-5h5" />
          </svg>
        </button>
      </header>
      <div
        className="nearby-listings-grid"
        style={{ opacity: refreshing ? 0.55 : 1 }}
      >
        {isInitialLoad
          ? [0, 1, 2, 3].map((i) => (
              <div key={i} className="nearby-listing-card nearby-listing-skeleton">
                <div className="nearby-listing-media skeleton-block" />
                <div className="nearby-listing-info">
                  <div className="skeleton-line skeleton-line-lg" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-line-short" />
                </div>
              </div>
            ))
          : listings.map((l) => {
              const heroSrc = l.streetViewUrl || l.mapUrl;
              return (
                <button
                  key={l.address}
                  type="button"
                  className="nearby-listing-card"
                  onClick={() => onSelectListing(l.address)}
                  disabled={refreshing}
                >
                  {heroSrc && (
                    <div className="nearby-listing-media">
                      <img
                        className="nearby-listing-img"
                        src={heroSrc}
                        alt={l.address}
                        loading="lazy"
                      />
                      <div className="nearby-listing-price-overlay">
                        {formatCurrency(l.price)}
                      </div>
                    </div>
                  )}
                  <div className="nearby-listing-info">
                    {!heroSrc && (
                      <div className="nearby-listing-price">
                        {formatCurrency(l.price)}
                      </div>
                    )}
                    <div className="nearby-listing-address">{l.address}</div>
                    <div className="nearby-listing-meta">
                      {[
                        l.beds && `${l.beds} bd`,
                        l.baths && `${l.baths} ba`,
                        l.sqft && `${l.sqft.toLocaleString()} sqft`,
                      ]
                        .filter(Boolean)
                        .join("  ·  ")}
                    </div>
                  </div>
                </button>
              );
            })}
      </div>
    </section>
  );
}
