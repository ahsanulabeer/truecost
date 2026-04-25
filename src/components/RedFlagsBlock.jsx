export default function RedFlagsBlock({ flags }) {
  if (!flags?.length) return null;
  return (
    <div className="analysis-block" style={{ borderColor: "rgba(196,75,75,0.2)" }}>
      <div className="analysis-title" style={{ color: "var(--red)" }}>
        Cost Considerations
      </div>
      {flags.map((flag, i) => (
        <div key={i} className="breakdown-row">
          <span className="breakdown-name">{flag}</span>
        </div>
      ))}
    </div>
  );
}
