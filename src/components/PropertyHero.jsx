import { formatCurrency, formatThousands } from "../utils/format";

export default function PropertyHero({
  property,
  confidence,
  propertyData,
  propertyImage,
  listingPrice,
  setListingPrice,
  trueMonthlyCost,
  trueAnnualCost,
  costToListingRatio,
}) {
  const meta = [
    property?.beds && `${property.beds} bd`,
    property?.baths && `${property.baths} ba`,
    property?.sqft && `${property.sqft.toLocaleString()} sqft`,
    property?.yearBuilt && `Built ${property.yearBuilt}`,
    property?.propertyType,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const heroSrc = propertyImage?.streetViewUrl || propertyImage?.mapUrl || null;
  const showInsetMap =
    propertyImage?.hasStreetView && propertyImage?.mapUrl;

  return (
    <article className="property-card">
      {heroSrc && (
        <div className="property-card-media">
          <img
            className="property-card-hero-img"
            src={heroSrc}
            alt={property?.address || "Property"}
            loading="eager"
          />
          {showInsetMap && (
            <img
              className="property-card-inset-map"
              src={propertyImage.mapUrl}
              alt="Map view"
              loading="lazy"
            />
          )}
          <div className="property-card-overlay-badges">
            {propertyData && (
              <span
                className={`data-source-badge ${
                  propertyData.source === "listing" ? "live" : "estimated"
                }`}
              >
                {propertyData.source === "listing"
                  ? "Live MLS Listing"
                  : "AVM Estimate"}
              </span>
            )}
            <span className={`confidence-badge ${confidence}`}>
              {confidence} confidence
            </span>
          </div>
        </div>
      )}

      <div className="property-card-info">
        <div className="property-card-header">
          <h2 className="property-card-address">{property?.address}</h2>
          <div className="property-card-meta">{meta}</div>
        </div>

        <div className="property-card-prices">
          <div className="price-block">
            <div className="price-label">
              {propertyData?.source === "listing" ? "List Price" : "Estimated Value"}
            </div>
            <input
              className="price-list-input"
              placeholder="Enter price"
              inputMode="numeric"
              value={listingPrice}
              onChange={(e) => setListingPrice(formatThousands(e.target.value))}
            />
            <div className="price-hint">Edit to recalculate</div>
          </div>

          <div className="price-block price-block-true">
            <div className="price-label">True Monthly Cost</div>
            <div className="price-true-value">
              {formatCurrency(trueMonthlyCost)}
              <span className="price-true-unit">/mo</span>
            </div>
            <div className="price-true-secondary">
              {formatCurrency(trueAnnualCost)}/yr
              {costToListingRatio
                ? ` · ${costToListingRatio.toFixed(1)}× listing annually`
                : ""}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
