/** Shared presentation formatters — no Engine math. */

/** Rate in [0, 1] → percent label; null → em dash. */
export function formatRatePercent(rate: number | null): string {
  if (rate === null) return '—'
  return `${Math.round(rate * 100)}%`
}

export function rateToPercent(rate: number | null): number | null {
  if (rate === null) return null
  return Math.round(rate * 100)
}
