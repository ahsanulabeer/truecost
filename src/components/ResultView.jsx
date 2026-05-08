import PropertyHero from "./PropertyHero";
import CostCards from "./CostCards";
import AnalysisBlock from "./AnalysisBlock";
import RedFlagsBlock from "./RedFlagsBlock";
import CompareStrip from "./CompareStrip";

export default function ResultView({
  result,
  propertyData,
  propertyImage,
  listingPrice,
  setListingPrice,
  computedMortgage,
  computedMortgageBreakdown,
  trueMonthlyCost,
  trueAnnualCost,
  costToListingRatio,
  nearbyListings,
  nearbyRefreshing,
  onRefreshNearby,
  onSelectListing,
}) {
  return (
    <div className="result-grid">
      <PropertyHero
        property={result.property}
        confidence={result.confidence}
        propertyData={propertyData}
        propertyImage={propertyImage}
        listingPrice={listingPrice}
        setListingPrice={setListingPrice}
        trueMonthlyCost={trueMonthlyCost}
        trueAnnualCost={trueAnnualCost}
        costToListingRatio={costToListingRatio}
      />
      <CostCards
        monthlyCosts={result.monthlyCosts}
        computedMortgage={computedMortgage}
        computedMortgageBreakdown={computedMortgageBreakdown}
      />
      <AnalysisBlock
        analysis={result.analysis}
        marketContext={result.marketContext}
      />
      <RedFlagsBlock flags={result.redFlags} />
      <CompareStrip
        listings={nearbyListings}
        refreshing={nearbyRefreshing}
        onRefresh={onRefreshNearby}
        onSelect={onSelectListing}
        currentAddress={result.property?.address}
      />
      <p className="disclaimer">
        TrueCost estimates combine real property data with AI-generated cost
        analysis using regional averages, public tax records, and actuarial
        benchmarks. They are not a substitute for a professional home inspection,
        licensed appraisal, or financial advice. Actual costs vary. Always
        consult a licensed real estate agent, CPA, or mortgage professional
        before purchasing property.
      </p>
    </div>
  );
}
