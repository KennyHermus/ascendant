import { completionRate } from '@/features/analytics/analyticsHelpers'
import {
  minutesFromMidnight,
  type QuestPeriodRecords,
  resolveQuestPeriodRecords,
} from '@/features/questExplorer/questAnalyticsLogic'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { ChartSeries, ChartSeriesPoint } from '@/features/analytics/analyticsSeries'
import { addHeroDays, parseCalendarDateKey } from '@/lib/timeService'

export interface QuestChartBundle {
  period: AnalyticsPeriod
  questId: string
  isTimed: boolean
  completionTimeline: ChartSeries
  completionVsMiss: { completed: ChartSeries; missed: ChartSeries }
  completionRateTrend: ChartSeries
  completionTimeTrend: ChartSeries
  punctualityDistribution: ChartSeries
}

function buildDayKeysInRange(
  range: { start: string; end: string } | null,
  completions: { heroDayKey: string }[],
  misses: { heroDayKey: string }[],
): string[] {
  if (!range) {
    const keys = new Set<string>()
    for (const c of completions) keys.add(c.heroDayKey)
    for (const m of misses) keys.add(m.heroDayKey)
    return [...keys].sort()
  }

  const keys: string[] = []
  let cursor = range.start
  while (cursor <= range.end) {
    keys.push(cursor)
    cursor = addHeroDays(cursor, 1)
  }
  return keys
}

function completionTimelineSeries(
  dayKeys: string[],
  completedSet: Set<string>,
  missedSet: Set<string>,
): ChartSeries {
  const points: ChartSeriesPoint[] = []
  for (const date of dayKeys) {
    if (completedSet.has(date)) points.push({ date, value: 1 })
    else if (missedSet.has(date)) points.push({ date, value: 0 })
  }
  return {
    id: 'questCompletionTimeline',
    label: 'Completion Timeline',
    points,
  }
}

function perDayFlagSeries(
  id: string,
  label: string,
  dayKeys: string[],
  daySet: Set<string>,
): ChartSeries {
  return {
    id,
    label,
    points: dayKeys.map((date) => ({
      date,
      value: daySet.has(date) ? 1 : 0,
    })),
  }
}

/** Cumulative completion rate in [0, 1] — only on days with at least one attempt. */
function rollingCompletionRateSeries(
  dayKeys: string[],
  completedSet: Set<string>,
  missedSet: Set<string>,
): ChartSeries {
  const points: ChartSeriesPoint[] = []
  let completed = 0
  let missed = 0

  for (const date of dayKeys) {
    const hadAttempt = completedSet.has(date) || missedSet.has(date)
    if (completedSet.has(date)) completed += 1
    if (missedSet.has(date)) missed += 1
    if (!hadAttempt) continue

    points.push({
      date,
      value: completionRate(completed, missed) ?? 0,
    })
  }

  return {
    id: 'questCompletionRateTrend',
    label: 'Completion Rate Trend',
    points,
  }
}

function completionTimeTrendSeries(
  completionsByDay: Map<string, number>,
): ChartSeries {
  const points: ChartSeriesPoint[] = [...completionsByDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, value: minutes }))

  return {
    id: 'questCompletionTimeTrend',
    label: 'Completion Time',
    points,
  }
}

/** Grade counts for timed quests — categorical, not Hero Day keys. */
function punctualityGradeSeries(
  records: QuestPeriodRecords,
): ChartSeries {
  const { completions, misses, supportsPlayerMiss } = records
  const perfect = completions.filter((c) => c.grade === 'perfect').length
  const onTime = completions.filter((c) => c.grade === 'onTime').length
  const late = completions.filter((c) => c.grade === 'completed').length
  const missed = supportsPlayerMiss ? misses.length : 0

  const buckets = [
    { label: 'Perfect', value: perfect },
    { label: 'On Time', value: onTime },
    { label: 'Completed (Late)', value: late },
    { label: 'Missed', value: missed },
  ]

  return {
    id: 'questPunctualityDistribution',
    label: 'Punctuality',
    points: buckets.map((b) => ({
      date: b.label,
      value: b.value,
    })),
  }
}

export function buildQuestChartBundle(
  input: AnalyticsInput,
  questId: string,
  period: AnalyticsPeriod,
): QuestChartBundle {
  const records = resolveQuestPeriodRecords(input, questId, period)
  const { completions, misses, range, definition } = records
  const isTimed = !!definition?.timing

  const completedSet = new Set(completions.map((c) => c.heroDayKey))
  const missedSet = new Set(misses.map((m) => m.heroDayKey))
  const dayKeys = buildDayKeysInRange(range, completions, misses)

  const completionsByDay = new Map<string, number>()
  for (const c of completions) {
    const minutes = minutesFromMidnight(c.completedAt)
    if (minutes !== null) {
      completionsByDay.set(c.heroDayKey, minutes)
    }
  }

  return {
    period,
    questId,
    isTimed,
    completionTimeline: completionTimelineSeries(dayKeys, completedSet, missedSet),
    completionVsMiss: {
      completed: perDayFlagSeries(
        'questCompletedPerDay',
        'Completed',
        dayKeys,
        completedSet,
      ),
      missed: perDayFlagSeries(
        'questMissedPerDay',
        'Missed',
        dayKeys,
        missedSet,
      ),
    },
    completionRateTrend: rollingCompletionRateSeries(
      dayKeys,
      completedSet,
      missedSet,
    ),
    completionTimeTrend: completionTimeTrendSeries(completionsByDay),
    punctualityDistribution: punctualityGradeSeries(records),
  }
}

export function formatHeroDayLabel(dateKey: string): string {
  const d = parseCalendarDateKey(dateKey)
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
