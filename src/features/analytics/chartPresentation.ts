import { parseDateKey } from '@/lib/storage'
import type { ChartSeries } from '@/features/analytics/analyticsSeries'

export interface ChartDataPoint {
  date: string
  dateLabel: string
  value: number
}

/** Maps a ChartSeries into Recharts-friendly rows (presentation only). */
export function seriesToChartData(series: ChartSeries): ChartDataPoint[] {
  return series.points.map((point) => ({
    date: point.date,
    dateLabel: formatChartDateLabel(point.date),
    value: point.value,
  }))
}

export function formatChartDateLabel(dateKey: string): string {
  const date = parseDateKey(dateKey)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatChartInteger(value: number): string {
  return String(Math.round(value))
}

/** For completion-rate series stored as [0, 1]. */
export function formatChartPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

/** Scale completion series values to 0–100 for chart axis display. */
export function scalePercentSeriesData(data: ChartDataPoint[]): ChartDataPoint[] {
  return data.map((row) => ({ ...row, value: row.value * 100 }))
}
