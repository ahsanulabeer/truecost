import { useEffect, useState } from "react";
import { formatCurrency } from "../utils/format";

const SLICE_COLORS = [
  "var(--primary)",
  "var(--money)",
  "var(--warm)",
  "var(--text)",
  "#6b8e23",
  "var(--muted)",
];

export default function CostBreakdownModal({
  title,
  icon,
  total,
  note,
  breakdown,
  onClose,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const slices = (breakdown || [])
    .filter((s) => s && s.amount > 0)
    .map((s, i) => ({ ...s, color: SLICE_COLORS[i % SLICE_COLORS.length] }));

  const sliceTotal = slices.reduce((sum, s) => sum + s.amount, 0) || 1;
  const hovered = hoveredIndex !== null ? slices[hoveredIndex] : null;
  const hoveredPct = hovered
    ? ((hovered.amount / sliceTotal) * 100).toFixed(0)
    : null;

  return (
    <div
      className="cost-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} breakdown`}
    >
      <div className="cost-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="cost-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <header className="cost-modal-header">
          <span className="cost-modal-icon" aria-hidden="true">
            {icon}
          </span>
          <h3 className="cost-modal-title">{title}</h3>
        </header>

        <div className="cost-modal-total">
          <span className="cost-modal-total-value">{formatCurrency(total)}</span>
          <span className="cost-modal-total-unit">/mo</span>
        </div>

        {slices.length > 0 ? (
          <>
            <div className="cost-donut-wrapper">
              <Donut
                slices={slices}
                sliceTotal={sliceTotal}
                hoveredIndex={hoveredIndex}
                onHover={setHoveredIndex}
              />
              {hovered && (
                <div className="cost-donut-center" aria-hidden="true">
                  <div className="cost-donut-center-label">{hovered.label}</div>
                  <div className="cost-donut-center-amount">
                    {formatCurrency(hovered.amount)}
                  </div>
                  <div className="cost-donut-center-pct">{hoveredPct}%</div>
                </div>
              )}
            </div>
            <ul className="cost-modal-legend">
              {slices.map((s, i) => {
                const pct = (s.amount / sliceTotal) * 100;
                return (
                  <li
                    key={s.label}
                    className={`cost-modal-legend-item${i === hoveredIndex ? " active" : ""}`}
                    onMouseEnter={() => setHoveredIndex(i)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <span
                      className="cost-modal-legend-swatch"
                      style={{ background: s.color }}
                    />
                    <span className="cost-modal-legend-label">{s.label}</span>
                    <span className="cost-modal-legend-amount">
                      {formatCurrency(s.amount)}
                    </span>
                    <span className="cost-modal-legend-pct">
                      {pct.toFixed(0)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="cost-modal-empty">No breakdown available.</p>
        )}

        {note && <p className="cost-modal-note">{note}</p>}
      </div>
    </div>
  );
}

function Donut({ slices, sliceTotal, hoveredIndex, onHover }) {
  const cx = 100;
  const cy = 100;
  const rOuter = 95;
  const rInner = 65;

  if (slices.length === 1) {
    return (
      <svg
        className="cost-donut"
        viewBox="0 0 200 200"
        aria-hidden="true"
      >
        <circle
          cx={cx}
          cy={cy}
          r={(rOuter + rInner) / 2}
          fill="none"
          stroke={slices[0].color}
          strokeWidth={rOuter - rInner}
        />
      </svg>
    );
  }

  let startDeg = 0;
  const arcs = slices.map((s, i) => {
    const sweep = (s.amount / sliceTotal) * 360;
    const endDeg = startDeg + sweep;
    const path = arcPath(cx, cy, rOuter, rInner, startDeg, endDeg);
    const out = { path, color: s.color, key: s.label, index: i };
    startDeg = endDeg;
    return out;
  });

  return (
    <svg className="cost-donut" viewBox="0 0 200 200">
      {arcs.map((a) => {
        const isDimmed = hoveredIndex !== null && hoveredIndex !== a.index;
        return (
          <path
            key={a.key}
            d={a.path}
            fill={a.color}
            className="cost-donut-slice"
            style={{ opacity: isDimmed ? 0.35 : 1 }}
            onMouseEnter={() => onHover(a.index)}
            onMouseLeave={() => onHover(null)}
          />
        );
      })}
    </svg>
  );
}

function arcPath(cx, cy, rOuter, rInner, startDeg, endDeg) {
  const startOuter = polar(cx, cy, rOuter, endDeg);
  const endOuter = polar(cx, cy, rOuter, startDeg);
  const startInner = polar(cx, cy, rInner, startDeg);
  const endInner = polar(cx, cy, rInner, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return [
    "M", startOuter.x, startOuter.y,
    "A", rOuter, rOuter, 0, largeArc, 0, endOuter.x, endOuter.y,
    "L", startInner.x, startInner.y,
    "A", rInner, rInner, 0, largeArc, 1, endInner.x, endInner.y,
    "Z",
  ].join(" ");
}

function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
