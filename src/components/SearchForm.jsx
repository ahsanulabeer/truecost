export default function SearchForm({
  address,
  setAddress,
  downPayment,
  setDownPayment,
  interestRate,
  setInterestRate,
  loading,
  onAnalyze,
}) {
  return (
    <>
      <div className="search-row">
        <input
          className="search-input"
          placeholder="Enter a home address (e.g. 1062 Calhoun Ave, Bronx NY 10465)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && onAnalyze()}
        />
        <button
          className="analyze-btn"
          onClick={onAnalyze}
          disabled={loading || !address.trim()}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      <div className="params-row">
        <div className="param-field">
          <span className="param-label">Down Payment %</span>
          <input
            className="param-input"
            placeholder="20"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </div>
        <div className="param-field">
          <span className="param-label">Interest Rate %</span>
          <input
            className="param-input"
            placeholder="7.1"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
        </div>
      </div>
    </>
  );
}
