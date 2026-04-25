export default function AnalysisBlock({ analysis, marketContext }) {
  if (!analysis) return null;
  return (
    <div className="analysis-block">
      <div className="analysis-title">Cost Analysis</div>
      <div className="analysis-text">{analysis}</div>
      {marketContext && (
        <div
          className="analysis-text"
          style={{ marginTop: 12, color: "var(--muted)", fontStyle: "italic" }}
        >
          {marketContext}
        </div>
      )}
    </div>
  );
}
