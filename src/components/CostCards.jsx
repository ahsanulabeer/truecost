import { formatCurrency } from "../utils/format";

const CARDS = [
  { label: "Mortgage P+I", key: "mortgage", icon: "🏠" },
  { label: "Property Tax", key: "propertyTax", icon: "📊" },
  { label: "Insurance", key: "homeInsurance", icon: "🛡️" },
  { label: "Utilities", key: "utilities", icon: "💡" },
  { label: "Maintenance", key: "maintenance", icon: "🔧" },
  { label: "HOA", key: "hoa", icon: "🏡" },
];

export default function CostCards({ monthlyCosts, computedMortgage }) {
  return (
    <div className="cost-cards">
      {CARDS.map(({ label, key, icon }) => (
        <div key={key} className="cost-card">
          <div className="cost-card-icon">{icon}</div>
          <div className="cost-card-label">{label}</div>
          <div className="cost-card-value">
            {formatCurrency(
              key === "mortgage" ? computedMortgage : monthlyCosts?.[key]?.amount
            )}
          </div>
          <div className="cost-card-note">{monthlyCosts?.[key]?.note}</div>
        </div>
      ))}
    </div>
  );
}
