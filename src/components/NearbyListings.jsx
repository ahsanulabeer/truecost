import { useState } from "react";
import { formatCurrency } from "../utils/format";

export default function NearbyListings({ onSelectListing, onListingsLoaded }) {
  const [status, setStatus] = useState("idle");
  const [listings, setListings] = useState([]);

  async function handleClick() {
    if (!navigator.geolocation) return;
    setStatus("pending");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const resp = await fetch("/api/nearby-listings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            }),
          });
          if (!resp.ok) {
            setStatus("idle");
            return;
          }
          const data = await resp.json();
          if (!data.listings?.length) {
            setStatus("idle");
            return;
          }
          setListings(data.listings);
          setStatus("loaded");
          onListingsLoaded?.();
        } catch {
          setStatus("idle");
        }
      },
      () => {
        setStatus("idle");
      },
      { timeout: 10000 }
    );
  }

  if (status === "loaded") {
    return (
      <section className="nearby-listings">
        <h3 className="nearby-listings-title">Homes near you</h3>
        <div className="nearby-listings-grid">
          {listings.map((l) => {
            const heroSrc = l.streetViewUrl || l.mapUrl;
            return (
              <button
                key={l.address}
                type="button"
                className="nearby-listing-card"
                onClick={() => onSelectListing(l.address)}
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

  return (
    <div className="nearby-listings-cta">
      <button
        type="button"
        className="nearby-cta-btn"
        onClick={handleClick}
        disabled={status === "pending"}
      >
        {status === "pending"
          ? "Finding homes near you..."
          : "Search for homes in your area"}
      </button>
    </div>
  );
}
