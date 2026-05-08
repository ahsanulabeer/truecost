import { useEffect } from "react";

export default function HowItWorksModal({ onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="cost-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="How it works"
    >
      <div
        className="cost-modal how-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="cost-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h3 className="cost-modal-title">How it works</h3>
        <p className="how-modal-intro">
          TrueCost combines live property data with AI-driven cost analysis to
          show the real monthly cost of owning a home — beyond the sticker price.
        </p>

        <div className="how-modal-section">
          <h4 className="how-modal-heading">Where the numbers come from</h4>
          <ul className="how-modal-list">
            <li>
              <strong>Listing &amp; valuation</strong> — active MLS listings
              and AVM estimates from licensed real estate data partners.
            </li>
            <li>
              <strong>Property tax</strong> — public-records value when
              available; otherwise, a regional estimate.
            </li>
            <li>
              <strong>Insurance, utilities, maintenance, HOA</strong> — AI cost
              analysis using regional norms, climate, property age and type,
              and your household size.
            </li>
            <li>
              <strong>Mortgage P+I</strong> — exact math using the standard
              amortization formula and your loan terms. Not an estimate.
            </li>
            <li>
              <strong>Address &amp; imagery</strong> — geocoded and validated
              against trusted mapping data.
            </li>
          </ul>
        </div>

        <div className="how-modal-section">
          <h4 className="how-modal-heading">What you can adjust</h4>
          <p className="how-modal-text">
            List price, down payment, interest rate, loan type (30/20/15/10-year
            fixed or 5/7/10-year ARM), and household size. Totals recompute
            instantly as you change inputs.
          </p>
        </div>

        <div className="how-modal-section">
          <h4 className="how-modal-heading">Verified vs. estimated</h4>
          <ul className="how-modal-list">
            <li>
              <strong>Verified</strong>: list price (when an active listing
              matches), mortgage P+I, property tax (when in public records).
            </li>
            <li>
              <strong>Estimated</strong>: insurance, utilities, maintenance,
              HOA, and any cost where verified data isn't available.
            </li>
          </ul>
        </div>

        <p className="how-modal-disclaimer">
          Estimates are not a substitute for a professional home inspection,
          licensed appraisal, or financial advice. Always consult a licensed
          real estate agent, CPA, or mortgage professional before purchasing.
        </p>
      </div>
    </div>
  );
}
