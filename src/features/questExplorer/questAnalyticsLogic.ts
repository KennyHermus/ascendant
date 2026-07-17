import {
  isDateInRange,
  resolvePeriodRange,
} from '@/features/analytics/analyticsPeriods'
import { toAttemptStats } from '@/features/analytics/analyticsHelpers'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { questSupportsPlayerMiss } from '@/features/quests/questMissPolicy'
import { addHeroDays, parseCalendarDateKey } from '@/lib/timeService'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import type { AnalyticsDateRange, AnalyticsPeriod } from '@/types/analytics'
import type { CompletionGrade } from '@/types/completion'
import type {
  QuestCompletionRecord,
  QuestHistory,
  QuestMissRecord,
} from '@/types/questHistory'
import type { QuestDefinition } from '@/types/quest'

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const HERO_DAY_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/** Per-quest performance stats for Quest Explorer — one resolved period. */
export interface QuestPerformanceStats {
  questId: string
  period: AnalyticsPeriod
  range: AnalyticsDateRange | null
  completed: number
  missed: number
  completionRate: number | null
  currentStreak: number
  longestStreak: number
  perfectCount: number
  onTimeCount: number
  completedLateCount: number
  missedCount: number
  avgCompletionTime: string | null
  avgLatenessMinutes: number | null
  mostCommonWeekday: string | null
  lastCompletedAt: string | null
  lastCompletedHeroDay: string | null
  lastMissedAt: string | null
  lastMissedHeroDay: string | null
}

export interface QuestExplorerEntry {
  definition: QuestDefinition
  stats: QuestPerformanceStats
}

export interface QuestPeriodRecords {
  range: AnalyticsDateRange | null
  definition: QuestDefinition | undefined
  completions: QuestCompletionRecord[]
  misses: QuestMissRecord[]
  supportsPlayerMiss: boolean
}

function filterCompletions(
  history: QuestHistory,
  questId: string,
  range: AnalyticsDateRange | null,
): QuestCompletionRecord[] {
  return history.completions.filter(
    (c) => c.questId === questId && isDateInRange(c.heroDayKey, range),
  )
}

function filterMisses(
  history: QuestHistory,
  questId: string,
  range: AnalyticsDateRange | null,
  includeAllMisses: boolean,
  definition: QuestDefinition | undefined,
): QuestMissRecord[] {
  if (!includeAllMisses && definition && !questSupportsPlayerMiss(definition)) {
    return []
  }
  return history.misses.filter(
    (m) => m.questId === questId && isDateInRange(m.heroDayKey, range),
  )
}

function includeLiveToday(
  input: AnalyticsInput,
  range: AnalyticsDateRange | null,
): boolean {
  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  if (!isDateInRange(todayKey, range)) return false
  const hasSnapshot = input.history.dailySnapshots.some((s) => s.date === todayKey)
  return !hasSnapshot
}

/**
 * Single source of truth for quest history in a period — merges persisted
 * records with live-today quest state when the day is not yet snapshotted.
 */
export function resolveQuestPeriodRecords(
  input: AnalyticsInput,
  questId: string,
  period: AnalyticsPeriod,
): QuestPeriodRecords {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const definition = input.questDefinitions.find((d) => d.id === questId)
  const supportsPlayerMiss = definition
    ? questSupportsPlayerMiss(definition)
    : false

  let completions = filterCompletions(input.questHistory, questId, range)
  let misses = filterMisses(
    input.questHistory,
    questId,
    range,
    false,
    definition,
  )

  if (includeLiveToday(input, range)) {
    const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
    const live = input.quests.find((q) => q.id === questId)

    if (live?.status === 'completed' && live.completedAt && live.completionGrade) {
      if (!completions.some((c) => c.heroDayKey === todayKey)) {
        completions = [
          ...completions,
          {
            id: 'live',
            questId,
            heroDayKey: todayKey,
            completedAt: live.completedAt,
            grade: live.completionGrade,
            minutesOffset:
              input.questHistory.completions.find(
                (c) => c.questId === questId && c.heroDayKey === todayKey,
              )?.minutesOffset ?? 0,
          },
        ]
      }
    }

    if (
      supportsPlayerMiss &&
      live?.status === 'missed' &&
      !misses.some((m) => m.heroDayKey === todayKey)
    ) {
      misses = [
        ...misses,
        {
          id: 'live',
          questId,
          heroDayKey: todayKey,
          missedAt: input.now.toISOString(),
        },
      ]
    }
  }

  return { range, definition, completions, misses, supportsPlayerMiss }
}

function countByGrade(
  completions: QuestCompletionRecord[],
): Record<Exclude<CompletionGrade, 'missed'>, number> {
  const counts = { perfect: 0, onTime: 0, completed: 0 }
  for (const c of completions) {
    if (c.grade in counts) counts[c.grade] += 1
  }
  return counts
}

export function formatLocalClockTime(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** Minutes from local midnight for a valid timestamp, or null. */
export function minutesFromMidnight(isoTimestamp: string): number | null {
  const d = new Date(isoTimestamp)
  if (Number.isNaN(d.getTime())) return null
  return d.getHours() * 60 + d.getMinutes()
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

function averageCompletionClockTime(
  completions: QuestCompletionRecord[],
): string | null {
  const minutes = completions
    .map((c) => minutesFromMidnight(c.completedAt))
    .filter((m): m is number => m !== null)
  const avg = mean(minutes)
  if (avg === null) return null
  const h = Math.floor(avg / 60) % 24
  const m = Math.round(avg % 60)
  return formatLocalClockTime(new Date(2000, 0, 1, h, m))
}

function averageLateness(
  completions: QuestCompletionRecord[],
  isTimed: boolean,
): number | null {
  if (!isTimed || completions.length === 0) return null
  const late = completions
    .map((c) => c.minutesOffset)
    .filter((offset) => offset > 0)
  return mean(late)
}

function mostCommonWeekday(completions: QuestCompletionRecord[]): string | null {
  if (completions.length === 0) return null
  const counts = new Map<number, number>()
  for (const c of completions) {
    if (!HERO_DAY_KEY_PATTERN.test(c.heroDayKey)) continue
    const day = parseCalendarDateKey(c.heroDayKey).getDay()
    counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  let bestDay = -1
  let bestCount = 0
  for (const [day, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      bestDay = day
    }
  }
  return bestDay >= 0 ? WEEKDAY_LABELS[bestDay] : null
}

function computeQuestStreaks(
  completions: QuestCompletionRecord[],
  misses: QuestMissRecord[],
  activeDayKey: string,
): { current: number; longest: number } {
  const completedDays = new Set(completions.map((c) => c.heroDayKey))
  const missedDays = new Set(misses.map((m) => m.heroDayKey))

  const allDays = [...new Set([...completedDays, ...missedDays])].sort()
  if (allDays.length === 0) return { current: 0, longest: 0 }

  let longest = 0
  let run = 0
  for (const day of allDays) {
    if (completedDays.has(day)) {
      run += 1
      longest = Math.max(longest, run)
    } else {
      run = 0
    }
  }

  let current = 0
  let cursor = activeDayKey
  const minDay = allDays[0]
  while (cursor >= minDay) {
    if (missedDays.has(cursor)) break
    if (completedDays.has(cursor)) {
      current += 1
      cursor = addHeroDays(cursor, -1)
    } else {
      break
    }
  }

  return { current, longest }
}

export function getQuestPerformanceStats(
  input: AnalyticsInput,
  questId: string,
  period: AnalyticsPeriod,
): QuestPerformanceStats {
  const { range, definition, completions, misses } = resolveQuestPeriodRecords(
    input,
    questId,
    period,
  )
  const isTimed = !!definition?.timing

  const grades = countByGrade(completions)
  const completed = completions.length
  const missed = misses.length
  const activeDayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  const streaks = computeQuestStreaks(completions, misses, activeDayKey)

  const lastCompletion =
    completions.length > 0
      ? completions.reduce((a, b) =>
          a.completedAt > b.completedAt ? a : b,
        )
      : undefined
  const lastMiss =
    misses.length > 0
      ? misses.reduce((a, b) => (a.missedAt > b.missedAt ? a : b))
      : undefined

  return {
    questId,
    period,
    range,
    completed,
    missed,
    completionRate: toAttemptStats(completed, missed).rate,
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    perfectCount: grades.perfect,
    onTimeCount: grades.onTime,
    completedLateCount: grades.completed,
    missedCount: missed,
    avgCompletionTime: averageCompletionClockTime(completions),
    avgLatenessMinutes: averageLateness(completions, isTimed),
    mostCommonWeekday: mostCommonWeekday(completions),
    lastCompletedAt: lastCompletion?.completedAt ?? null,
    lastCompletedHeroDay: lastCompletion?.heroDayKey ?? null,
    lastMissedAt: lastMiss?.missedAt ?? null,
    lastMissedHeroDay: lastMiss?.heroDayKey ?? null,
  }
}

export function getAllQuestExplorerEntries(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): QuestExplorerEntry[] {
  return input.questDefinitions.map((definition) => ({
    definition,
    stats: getQuestPerformanceStats(input, definition.id, period),
  }))
}

export function searchQuestExplorerEntries(
  entries: QuestExplorerEntry[],
  query: string,
): QuestExplorerEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (e) =>
      e.definition.name.toLowerCase().includes(q) ||
      e.definition.id.toLowerCase().includes(q) ||
      e.definition.category.toLowerCase().includes(q),
  )
}

export function getQuestHistoryInPeriod(
  input: AnalyticsInput,
  questId: string,
  period: AnalyticsPeriod,
): {
  completions: QuestCompletionRecord[]
  misses: QuestMissRecord[]
  range: AnalyticsDateRange | null
} {
  const records = resolveQuestPeriodRecords(input, questId, period)
  return {
    completions: records.completions,
    misses: records.misses,
    range: records.range,
  }
}
