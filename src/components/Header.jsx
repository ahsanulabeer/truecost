import pkg from "../../package.json";

export default function Header({ interestRate }) {
  return (
    <header className="header">
      <div>
        <div className="logo">
          TrueCost <span className="logo-version">v{pkg.version}</span>
        </div>
      </div>
      <div className="logo-sub">The real cost of home</div>
      <div className="ticker">
        <div className="ticker-item">
          <span>30yr Fixed</span>
          <span className="ticker-val">{interestRate || "7.10"}%</span>
        </div>
        <div className="ticker-item">
          <span>Avg Maintenance</span>
          <span className="ticker-val">1.0%/yr</span>
        </div>
      </div>
    </header>
  );
}
