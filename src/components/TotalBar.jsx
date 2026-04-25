import { formatCurrency } from "../utils/format";

export default function TotalBar({ trueMonthlyCost, trueAnnualCost, costToListingRatio }) {
  return (
    <div className="total-bar">
      <div className="total-label">
        <span>Estimated</span>
        True Monthly Cost
      </div>
      <div>
        <div className="total-value">{formatCurrency(trueMonthlyCost)}</div>
        <div className="total-annual">
          {formatCurrency(trueAnnualCost)} / year
          {costToListingRatio
            ? ` · ${costToListingRatio.toFixed(1)}× listing price annually`
            : ""}
        </div>
      </div>
    </div>
  );
}
