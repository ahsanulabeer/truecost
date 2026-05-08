import { useState } from "react";
import { formatCurrency } from "../utils/format";
import CostBreakdownModal from "./CostBreakdownModal";

const CARDS = [
  { label: "Mortgage P+I", key: "mortgage", icon: "🏠" },
  { label: "Property Tax", key: "propertyTax", icon: "📊" },
  { label: "Insurance", key: "homeInsurance", icon: "🛡️" },
  { label: "Utilities", key: "utilities", icon: "💡" },
  { label: "Maintenance", key: "maintenance", icon: "🔧" },
  { label: "HOA", key: "hoa", icon: "🏡" },
];

export default function CostCards({
  monthlyCosts,
  computedMortgage,
  computedMortgageBreakdown,
}) {
  const [selectedKey, setSelectedKey] = useState(null);

  const selectedCard = selectedKey
    ? CARDS.find((c) => c.key === selectedKey)
    : null;
  const selectedTotal =
    selectedKey === "mortgage"
      ? computedMortgage
      : monthlyCosts?.[selectedKey]?.amount || 0;
  const selectedNote = monthlyCosts?.[selectedKey]?.note || "";
  const selectedBreakdown =
    selectedKey === "mortgage"
      ? computedMortgageBreakdown ||
        monthlyCosts?.mortgage?.breakdown ||
        []
      : monthlyCosts?.[selectedKey]?.breakdown || [];

  return (
    <>
      <div className="cost-cards">
        {CARDS.map(({ label, key, icon }) => (
          <button
            key={key}
            type="button"
            className="cost-card"
            onClick={() => setSelectedKey(key)}
          >
            <div className="cost-card-icon">{icon}</div>
            <div className="cost-card-label">{label}</div>
            <div className="cost-card-value">
              {formatCurrency(
                key === "mortgage" ? computedMortgage : monthlyCosts?.[key]?.amount
              )}
            </div>
            <div className="cost-card-note">{monthlyCosts?.[key]?.note}</div>
          </button>
        ))}
      </div>

      {selectedCard && (
        <CostBreakdownModal
          title={selectedCard.label}
          icon={selectedCard.icon}
          total={selectedTotal}
          note={selectedNote}
          breakdown={selectedBreakdown}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </>
  );
}
