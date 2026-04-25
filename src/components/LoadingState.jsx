const LOADING_STEPS = [
  "Looking up property details...",
  "Fetching listing data...",
  "Analyzing regional tax rates...",
  "Estimating utility costs...",
  "Calculating maintenance reserves...",
  "Computing insurance estimates...",
  "Finalizing your TrueCost report...",
];

export const LOADING_STEP_COUNT = LOADING_STEPS.length;

export default function LoadingState({ loadingStep }) {
  return (
    <div className="loading-state">
      <div className="loading-label">
        Crunching the numbers
        <div className="dot-anim">
          <span />
          <span />
          <span />
        </div>
      </div>
      <div className="loading-steps">
        {LOADING_STEPS.map((step, i) => (
          <div
            key={i}
            className={`loading-step ${i < loadingStep ? "done" : i === loadingStep ? "active" : ""}`}
          >
            {i < loadingStep ? "✓ " : i === loadingStep ? "→ " : "  "}
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}
