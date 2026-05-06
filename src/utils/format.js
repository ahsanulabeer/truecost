export function formatCurrency(val) {
  if (!val && val !== 0) return "—";
  return "$" + Math.round(val).toLocaleString();
}

export function formatThousands(value) {
  if (value === null || value === undefined || value === "") return "";
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return "";
  const [whole, decimal] = cleaned.split(".");
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimal !== undefined ? `${withCommas}.${decimal}` : withCommas;
}
