// Shared display formatting. Pure.
export function fmtTokens(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2).replace(/\.?0+$/, "")}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
  return `${Math.round(n)}`;
}

export const pct = (x: number, digits = 0) => `${(x * 100).toFixed(digits)}%`;

export function fmtHours(h: number): string {
  if (!Number.isFinite(h)) return "—";
  if (h >= 24) return `${(h / 24).toFixed(1)}d`;
  if (h >= 1) return `${h.toFixed(1)}h`;
  return `${Math.round(h * 60)}m`;
}
