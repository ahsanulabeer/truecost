export default function ResultHeader({
  property,
  confidence,
  propertyData,
  listingPrice,
  setListingPrice,
}) {
  const meta = [
    property?.propertyType,
    property?.beds && `${property.beds} bed`,
    property?.baths && `${property.baths} bath`,
    property?.sqft && `${property.sqft.toLocaleString()} sqft`,
    property?.yearBuilt && `Built ${property.yearBuilt}`,
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="result-header">
      <div>
        <div className="property-name">{property?.address}</div>
        <div className="property-meta">{meta}</div>
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span className={`confidence-badge ${confidence}`}>
            {confidence} confidence
          </span>
          {propertyData && (
            <span
              className={`data-source-badge ${propertyData.source === "listing" ? "live" : "estimated"}`}
            >
              {propertyData.source === "listing" ? "Live MLS listing" : "AVM estimate"}
            </span>
          )}
        </div>
      </div>
      <div className="listing-price-block">
        <div className="listing-price-label">
          {propertyData?.source === "listing" ? "Listing Price" : "Estimated Value"}
        </div>
        <input
          className="listing-price-input"
          placeholder="Enter price"
          value={listingPrice}
          onChange={(e) => setListingPrice(e.target.value)}
        />
        <div className="listing-price-hint">Edit to recalculate</div>
      </div>
    </div>
  );
}
