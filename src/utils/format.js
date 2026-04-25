export function formatCurrency(val) {
  if (!val && val !== 0) return "—";
  return "$" + Math.round(val).toLocaleString();
}
