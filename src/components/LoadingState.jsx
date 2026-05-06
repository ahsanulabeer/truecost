const STEPS = [
  { phrase: "Looking up property details...", icon: SearchIcon },
  { phrase: "Fetching listing data...", icon: HomeIcon },
  { phrase: "Analyzing regional tax rates...", icon: BarChartIcon },
  { phrase: "Estimating utility costs...", icon: ZapIcon },
  { phrase: "Calculating maintenance reserves...", icon: WrenchIcon },
  { phrase: "Computing insurance estimates...", icon: ShieldIcon },
  { phrase: "Finalizing your TrueCost report...", icon: CheckIcon },
];

export const LOADING_STEP_COUNT = STEPS.length;

export default function LoadingState({ loadingStep }) {
  const safeStep = Math.min(loadingStep, STEPS.length - 1);
  const progress = ((safeStep + 1) / STEPS.length) * 100;

  return (
    <div className="loading-state">
      <div className="loading-icons">
        {STEPS.map(({ icon: Icon }, i) => {
          const state =
            i < safeStep ? "done" : i === safeStep ? "active" : "pending";
          return (
            <div key={i} className={`loading-icon-cell ${state}`}>
              <Icon />
            </div>
          );
        })}
      </div>
      <div className="loading-progress">
        <div
          className="loading-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="loading-phrase">{STEPS[safeStep].phrase}</div>
    </div>
  );
}

function SvgBase({ children }) {
  return (
    <svg
      className="loading-icon-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function SearchIcon() {
  return (
    <SvgBase>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" />
    </SvgBase>
  );
}

function HomeIcon() {
  return (
    <SvgBase>
      <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V11z" />
      <path d="M9 22V12h6v10" />
    </SvgBase>
  );
}

function BarChartIcon() {
  return (
    <SvgBase>
      <line x1="4" y1="20" x2="4" y2="14" />
      <line x1="12" y1="20" x2="12" y2="9" />
      <line x1="20" y1="20" x2="20" y2="4" />
    </SvgBase>
  );
}

function ZapIcon() {
  return (
    <SvgBase>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </SvgBase>
  );
}

function WrenchIcon() {
  return (
    <SvgBase>
      <path d="M14.7 6.3a4.5 4.5 0 0 0 6.4 6.4l-9.4 9.4a2.12 2.12 0 0 1-3-3l9.4-9.4a4.5 4.5 0 0 0-6.4-6.4l3.4 3.4-2 2-3.4-3.4a4.5 4.5 0 0 0 6.4 6.4z" />
    </SvgBase>
  );
}

function ShieldIcon() {
  return (
    <SvgBase>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </SvgBase>
  );
}

function CheckIcon() {
  return (
    <SvgBase>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </SvgBase>
  );
}
