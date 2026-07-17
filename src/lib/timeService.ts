import { getCurrentGameTime } from '@/lib/gameTime'

/** Default Hero Day rolls at 5:00 AM local time. */
export const DEFAULT_HERO_DAY_BOUNDARY = { hour: 5, minute: 0 } as const

export interface HeroDayBoundary {
  hour: number
  minute: number
}

export interface HeroDaySettings {
  boundary: HeroDayBoundary
}

export const DEFAULT_HERO_DAY_SETTINGS: HeroDaySettings = {
  boundary: DEFAULT_HERO_DAY_BOUNDARY,
}

/** Calendar date key `YYYY-MM-DD` (no Hero Day shift). */
export function formatCalendarDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Inverse of `formatCalendarDateKey` — noon local to avoid DST edge cases.
 */
export function parseCalendarDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0)
}

function isBeforeBoundary(
  date: Date,
  boundary: HeroDayBoundary = DEFAULT_HERO_DAY_BOUNDARY,
): boolean {
  const h = date.getHours()
  const m = date.getMinutes()
  if (h < boundary.hour) return true
  if (h === boundary.hour && m < boundary.minute) return true
  return false
}

/**
 * Hero Day key for `now`. Times before the boundary belong to the previous
 * calendar day's Hero Day (e.g. 1:00 AM Saturday → Friday's key).
 */
export function getHeroDayKey(
  now: Date = getCurrentGameTime(),
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): string {
  const d = new Date(now)
  if (isBeforeBoundary(d, settings.boundary)) {
    d.setDate(d.getDate() - 1)
  }
  return formatCalendarDateKey(d)
}

/** Alias used throughout quest / streak / history systems. */
export function getActiveHeroDayKey(
  now: Date = getCurrentGameTime(),
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): string {
  return getHeroDayKey(now, settings)
}

export function getHeroYesterdayKey(
  now: Date = getCurrentGameTime(),
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): string {
  const today = parseCalendarDateKey(getHeroDayKey(now, settings))
  today.setDate(today.getDate() - 1)
  return formatCalendarDateKey(today)
}

/** When the Hero Day identified by `heroDayKey` begins. */
export function getHeroDayStart(
  heroDayKey: string,
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): Date {
  const start = parseCalendarDateKey(heroDayKey)
  start.setHours(settings.boundary.hour, settings.boundary.minute, 0, 0)
  return start
}

/** Exclusive end of the Hero Day (start of the next Hero Day). */
export function getHeroDayEnd(
  heroDayKey: string,
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): Date {
  const end = getHeroDayStart(heroDayKey, settings)
  end.setDate(end.getDate() + 1)
  return end
}

/** True when `now` falls inside the Hero Day window for `heroDayKey`. */
export function isWithinHeroDay(
  heroDayKey: string,
  now: Date = getCurrentGameTime(),
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): boolean {
  const start = getHeroDayStart(heroDayKey, settings).getTime()
  const end = getHeroDayEnd(heroDayKey, settings).getTime()
  const t = now.getTime()
  return t >= start && t < end
}

/** ISO week key derived from the Hero Day date (not raw clock date). */
export function getHeroWeekKey(
  now: Date = getCurrentGameTime(),
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): string {
  const heroDay = parseCalendarDateKey(getHeroDayKey(now, settings))
  const d = new Date(Date.UTC(heroDay.getFullYear(), heroDay.getMonth(), heroDay.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** `YYYY-MM` for the Hero Day's calendar month. */
export function getHeroMonthKey(
  now: Date = getCurrentGameTime(),
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): string {
  const heroDay = parseCalendarDateKey(getHeroDayKey(now, settings))
  const year = heroDay.getFullYear()
  const month = String(heroDay.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export function addHeroDays(heroDayKey: string, days: number): string {
  const d = parseCalendarDateKey(heroDayKey)
  d.setDate(d.getDate() + days)
  return formatCalendarDateKey(d)
}

/** Resolve Hero Day key for an arbitrary timestamp (for history records). */
export function getHeroDayKeyForTimestamp(
  isoTimestamp: string,
  settings: HeroDaySettings = DEFAULT_HERO_DAY_SETTINGS,
): string {
  return getHeroDayKey(new Date(isoTimestamp), settings)
}
