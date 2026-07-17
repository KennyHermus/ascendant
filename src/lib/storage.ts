import { getCurrentGameTime } from '@/lib/gameTime'
import {
  formatCalendarDateKey,
  getActiveHeroDayKey,
  getHeroWeekKey,
  getHeroYesterdayKey,
  parseCalendarDateKey,
} from '@/lib/timeService'

/**
 * Stable storage key. Do not embed a version in this string — the persisted
 * shape now evolves via `src/lib/migrations`, not by changing the key.
 */
export const STORAGE_KEY = 'ascendant-game'

/** @deprecated Use `formatCalendarDateKey` from `@/lib/timeService`. */
export function formatDateKey(date: Date): string {
  return formatCalendarDateKey(date)
}

/** Hero Day key for the current moment (5:00 AM boundary). */
export function getTodayDateString(): string {
  return getActiveHeroDayKey()
}

/** ISO week key from Hero Day date. */
export function getWeekKey(date: Date = getCurrentGameTime()): string {
  return getHeroWeekKey(date)
}

export function getYesterdayDateString(): string {
  return getHeroYesterdayKey()
}

/** @deprecated Use `parseCalendarDateKey` from `@/lib/timeService`. */
export function parseDateKey(dateKey: string): Date {
  return parseCalendarDateKey(dateKey)
}
