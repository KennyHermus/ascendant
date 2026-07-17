import { parseCalendarDateKey } from '@/lib/timeService'
import type { ChartSeries } from '@/features/analytics/analyticsSeries'

export interface ChartDataPoint {
  date: string
  dateLabel: string
  value: number
}

const HERO_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Maps a ChartSeries into Recharts-friendly rows (presentation only). */
export function seriesToChartData(series: ChartSeries): ChartDataPoint[] {
  return series.points.map((point) => ({
    date: point.date,
    dateLabel: formatChartDateLabel(point.date),
    value: point.value,
  }))
}

export function formatChartDateLabel(dateKey: string): string {
  if (!HERO_DAY_KEY_PATTERN.test(dateKey)) {
    return dateKey
  }
  const date = parseCalendarDateKey(dateKey)
  if (Number.isNaN(date.getTime())) return dateKey
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatChartTimeOfDay(minutesFromMidnight: number): string {
  const hours = Math.floor(minutesFromMidnight / 60) % 24
  const minutes = Math.round(minutesFromMidnight % 60)
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
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
