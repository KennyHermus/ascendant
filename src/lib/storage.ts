import { getCurrentGameTime } from '@/lib/gameTime'

/**
 * Stable storage key. Do not embed a version in this string — the persisted
 * shape now evolves via `src/lib/migrations`, not by changing the key.
 */
export const STORAGE_KEY = 'ascendant-game'

export function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getTodayDateString(): string {
  return formatDateKey(getCurrentGameTime())
}

/** ISO week key: YYYY-Www */
export function getWeekKey(date: Date = getCurrentGameTime()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function getYesterdayDateString(): string {
  const d = getCurrentGameTime()
  d.setDate(d.getDate() - 1)
  return formatDateKey(d)
}
