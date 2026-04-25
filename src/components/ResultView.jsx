import ResultHeader from "./ResultHeader";
import CostCards from "./CostCards";
import TotalBar from "./TotalBar";
import AnalysisBlock from "./AnalysisBlock";
import RedFlagsBlock from "./RedFlagsBlock";

export default function ResultView({
  result,
  propertyData,
  listingPrice,
  setListingPrice,
  computedMortgage,
  trueMonthlyCost,
  trueAnnualCost,
  costToListingRatio,
}) {
  return (
    <div className="result-grid">
      <ResultHeader
        property={result.property}
        confidence={result.confidence}
        propertyData={propertyData}
        listingPrice={listingPrice}
        setListingPrice={setListingPrice}
      />
      <CostCards
        monthlyCosts={result.monthlyCosts}
        computedMortgage={computedMortgage}
      />
      <TotalBar
        trueMonthlyCost={trueMonthlyCost}
        trueAnnualCost={trueAnnualCost}
        costToListingRatio={costToListingRatio}
      />
      <AnalysisBlock
        analysis={result.analysis}
        marketContext={result.marketContext}
      />
      <RedFlagsBlock flags={result.redFlags} />
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
