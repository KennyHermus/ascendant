import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { getCurrentGameTime } from '@/lib/gameTime'
import { addHeroDays } from '@/lib/timeService'
import type { AnalyticsDateRange, AnalyticsPeriod } from '@/types/analytics'
import type { DailySnapshot } from '@/types/history'
import type { QuestDefinition } from '@/types/quest'

/** Inclusive calendar-day count for each rolling window (today = 1 day). */
export const ANALYTICS_PERIOD_DAY_COUNT: Record<AnalyticsPeriod, number> = {
  today: 1,
  last7: 7,
  last30: 30,
  last90: 90,
  last180: 180,
  last365: 365,
}

/**
 * Resolves an inclusive Hero Day key range for a rolling period, relative to
 * application time. Each window ends on the active quest day and spans the
 * previous N−1 calendar days (e.g. Last 7 Days = today plus six prior days).
 */
export function resolvePeriodRange(
  period: AnalyticsPeriod,
  questDefinitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): AnalyticsDateRange {
  const end = getActiveQuestDayKey(questDefinitions, now)
  const dayCount = ANALYTICS_PERIOD_DAY_COUNT[period]
  const start = dayCount === 1 ? end : addHeroDays(end, -(dayCount - 1))
  return { start, end }
}

export function isDateInRange(dateKey: string, range: AnalyticsDateRange): boolean {
  return dateKey >= range.start && dateKey <= range.end
}

/** Snapshots whose `date` falls inside the period. */
export function filterSnapshotsForPeriod(
  snapshots: readonly DailySnapshot[],
  range: AnalyticsDateRange,
): DailySnapshot[] {
  return snapshots.filter((snapshot) => isDateInRange(snapshot.date, range))
}

export function weeksInRange(range: AnalyticsDateRange): number {
  const startParts = range.start.split('-').map(Number)
  const endParts = range.end.split('-').map(Number)
  const startMs = new Date(startParts[0], startParts[1] - 1, startParts[2], 12).getTime()
  const endMs = new Date(endParts[0], endParts[1] - 1, endParts[2], 12).getTime()
  const days = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1
  return Math.max(1, days / 7)
}
