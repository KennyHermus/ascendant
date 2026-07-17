import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { getCurrentGameTime } from '@/lib/gameTime'
import {
  formatCalendarDateKey,
  getHeroMonthKey,
  getHeroWeekKey,
  parseCalendarDateKey,
} from '@/lib/timeService'
import type { AnalyticsDateRange, AnalyticsPeriod } from '@/types/analytics'
import type { DailySnapshot } from '@/types/history'
import type { QuestDefinition } from '@/types/quest'

/**
 * Resolves an inclusive Hero Day key range for a period, relative to
 * application time. `lifetime` returns `null` (unbounded).
 */
export function resolvePeriodRange(
  period: AnalyticsPeriod,
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): AnalyticsDateRange | null {
  const todayKey = getActiveQuestDayKey(questDefinitions, now)

  switch (period) {
    case 'today':
      return { start: todayKey, end: todayKey }
    case 'week': {
      const week = getHeroWeekKey(now)
      const center = parseCalendarDateKey(todayKey)
      let start = todayKey
      let end = todayKey
      for (let offset = -7; offset <= 7; offset += 1) {
        const cursor = new Date(center)
        cursor.setDate(center.getDate() + offset)
        if (getHeroWeekKey(cursor) !== week) continue
        const key = formatCalendarDateKey(cursor)
        if (key < start) start = key
        if (key > end) end = key
      }
      return { start, end }
    }
    case 'month': {
      const monthKey = getHeroMonthKey(now)
      const [year, month] = monthKey.split('-').map(Number)
      const start = formatCalendarDateKey(new Date(year, month - 1, 1, 12, 0, 0))
      const end = formatCalendarDateKey(new Date(year, month, 0, 12, 0, 0))
      return { start, end }
    }
    case 'lifetime':
      return null
  }
}

export function isDateInRange(
  dateKey: string,
  range: AnalyticsDateRange | null,
): boolean {
  if (!range) return true
  return dateKey >= range.start && dateKey <= range.end
}

/** Snapshots whose `date` falls inside the period (all of them for lifetime). */
export function filterSnapshotsForPeriod(
  snapshots: readonly DailySnapshot[],
  range: AnalyticsDateRange | null,
): DailySnapshot[] {
  if (!range) return [...snapshots]
  return snapshots.filter((snapshot) => isDateInRange(snapshot.date, range))
}
