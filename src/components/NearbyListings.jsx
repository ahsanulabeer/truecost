import { formatCurrency } from "../utils/format";

export default function NearbyListings({
  listings,
  refreshing,
  fallbackName,
  onRefresh,
  onSelectListing,
}) {
  const title = fallbackName
    ? `Homes in ${fallbackName}`
    : "Suggested homes near you";
  const isInitialLoad = listings === null;
  const refreshDisabled = isInitialLoad || refreshing;

  return (
    <section className="nearby-listings">
      <header className="nearby-listings-header">
        <h3 className="nearby-listings-title">{title}</h3>
        <button
          type="button"
          className={`nearby-refresh-btn${refreshing ? " is-refreshing" : ""}`}
          onClick={onRefresh}
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
          ? [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="nearby-listing-card nearby-listing-skeleton"
              >
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
