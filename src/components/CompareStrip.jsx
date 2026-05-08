import { formatCurrency } from "../utils/format";

export default function CompareStrip({
  listings,
  refreshing,
  onRefresh,
  onSelect,
  currentAddress,
}) {
  if (!listings || listings.length === 0) return null;

  const filtered = currentAddress
    ? listings.filter((l) => l.address !== currentAddress)
    : listings;

  if (filtered.length === 0) return null;

  return (
    <section className="compare-strip">
      <header className="compare-strip-header">
        <h4 className="compare-strip-title">Compare another nearby</h4>
        <button
          type="button"
          className={`nearby-refresh-btn${refreshing ? " is-refreshing" : ""}`}
          onClick={onRefresh}
          disabled={refreshing}
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
        className="compare-strip-scroll"
        style={{ opacity: refreshing ? 0.55 : 1 }}
      >
        {filtered.map((l) => {
          const heroSrc = l.streetViewUrl || l.mapUrl;
          return (
            <button
              key={l.address}
              type="button"
              className="compare-strip-card"
              onClick={() => onSelect(l.address)}
              disabled={refreshing}
            >
              {heroSrc && (
                <div className="compare-strip-media">
                  <img src={heroSrc} alt={l.address} loading="lazy" />
                  <div className="compare-strip-price">
                    {formatCurrency(l.price)}
                  </div>
                </div>
              )}
              <div className="compare-strip-info">
                <div className="compare-strip-address">{l.address}</div>
                <div className="compare-strip-meta">
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
