import { toAttemptStats } from '@/features/analytics/analyticsHelpers'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import {
  isDateInRange,
  resolvePeriodRange,
} from '@/features/analytics/analyticsPeriods'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { formatCalendarDateKey } from '@/lib/timeService'
import type {
  AnalyticsDateRange,
  AnalyticsPeriod,
  AttemptStats,
} from '@/types/analytics'
import type { GameEvent } from '@/types/event'
import type { QuestDefinition } from '@/types/quest'

export interface QuestAttemptProfile {
  questId: string
  name: string
  definition: QuestDefinition
  stats: AttemptStats
  /** Completions counted from lifetime map (lifetime period) or events. */
  completedFromLifetime: boolean
}

/**
 * Per-quest attempt profiles for a period.
 * Completions: lifetime uses `questCompletionCounts`; shorter periods use events.
 * Misses: always from `QUEST_FAILED` events in range (recent buffer — confidence low when sparse).
 */
export function buildQuestAttemptProfiles(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): QuestAttemptProfile[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const profiles = new Map<string, { completed: number; missed: number }>()

  for (const definition of input.questDefinitions) {
    profiles.set(definition.id, { completed: 0, missed: 0 })
  }

  if (period === 'lifetime') {
    for (const [questId, count] of Object.entries(
      input.hero.lifetimeStats.questCompletionCounts,
    )) {
      const entry = profiles.get(questId)
      if (entry && count > 0) entry.completed = count
    }
  } else {
    for (const completion of input.questHistory.completions) {
      if (!isDateInRange(completion.heroDayKey, range)) continue
      const entry = profiles.get(completion.questId)
      if (entry) entry.completed += 1
    }
    for (const miss of input.questHistory.misses) {
      if (!isDateInRange(miss.heroDayKey, range)) continue
      const entry = profiles.get(miss.questId)
      if (entry) entry.missed += 1
    }
  }

  // Fallback: event buffer when questHistory is empty for a quest in range.
  if (period !== 'lifetime') {
    for (const event of input.events) {
      if (event.type !== 'QUEST_COMPLETED' && event.type !== 'QUEST_FAILED') {
        continue
      }
      const periodKey = eventPeriodKey(event)
      if (!isDateInRange(periodKey, range)) continue

      const entry = profiles.get(event.questId)
      if (!entry) continue

      const hasHistory =
        event.type === 'QUEST_COMPLETED'
          ? input.questHistory.completions.some(
              (c) =>
                c.questId === event.questId && c.heroDayKey === periodKey,
            )
          : input.questHistory.misses.some(
              (m) => m.questId === event.questId && m.heroDayKey === periodKey,
            )
      if (hasHistory) continue

      if (event.type === 'QUEST_COMPLETED') entry.completed += 1
      else entry.missed += 1
    }
  }

  // Live today when not yet in questHistory.
  if (period !== 'lifetime') {
    const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
    if (isDateInRange(todayKey, range)) {
      const questStatus = new Map(input.quests.map((q) => [q.id, q.status]))
      for (const definition of input.questDefinitions) {
        const status = questStatus.get(definition.id)
        const entry = profiles.get(definition.id)
        if (!entry || !status) continue
        if (status === 'completed') {
          const hasRecord = input.questHistory.completions.some(
            (c) => c.questId === definition.id && c.heroDayKey === todayKey,
          )
          if (!hasRecord) entry.completed += 1
        } else if (status === 'missed') {
          const hasRecord = input.questHistory.misses.some(
            (m) => m.questId === definition.id && m.heroDayKey === todayKey,
          )
          if (!hasRecord) entry.missed += 1
        }
      }
    }
  }

  const result: QuestAttemptProfile[] = []
  for (const definition of input.questDefinitions) {
    const raw = profiles.get(definition.id)!
    result.push({
      questId: definition.id,
      name: definition.name,
      definition,
      stats: toAttemptStats(raw.completed, raw.missed),
      completedFromLifetime: period === 'lifetime',
    })
  }
  return result
}

export function eventPeriodKey(event: GameEvent): string {
  if (event.type === 'QUEST_COMPLETED') {
    return event.heroDayKey ?? formatCalendarDateKey(new Date(event.timestamp))
  }
  if (event.type === 'QUEST_FAILED') {
    return (
      event.heroDayKey ??
      event.periodKey ??
      formatCalendarDateKey(new Date(event.timestamp))
    )
  }
  return formatCalendarDateKey(new Date(event.timestamp))
}

export function filterEventsInRange(
  events: readonly GameEvent[],
  range: AnalyticsDateRange | null,
): GameEvent[] {
  return events.filter((event) => isDateInRange(eventPeriodKey(event), range))
}

/** Split an inclusive date range into earlier / later halves by mid date key. */
export function splitRangeInHalf(
  range: AnalyticsDateRange | null,
  snapshotsDates: string[],
): { earlier: AnalyticsDateRange | null; later: AnalyticsDateRange | null } {
  if (!range) {
    if (snapshotsDates.length < 4) {
      return { earlier: null, later: null }
    }
    const mid = Math.floor(snapshotsDates.length / 2)
    return {
      earlier: {
        start: snapshotsDates[0],
        end: snapshotsDates[mid - 1],
      },
      later: {
        start: snapshotsDates[mid],
        end: snapshotsDates[snapshotsDates.length - 1],
      },
    }
  }

  const start = parseIsoDay(range.start)
  const end = parseIsoDay(range.end)
  const midMs = start + (end - start) / 2
  const midDate = new Date(midMs)
  const midKey = formatCalendarDateKey(midDate)

  return {
    earlier: { start: range.start, end: midKey },
    later: { start: midKey, end: range.end },
  }
}

function parseIsoDay(dateKey: string): number {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0).getTime()
}

export function confidenceFromSampleSize(
  attempts: number,
): 'low' | 'medium' | 'high' {
  if (attempts >= 10) return 'high'
  if (attempts >= 4) return 'medium'
  return 'low'
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return '—'
  return `${Math.round(rate * 100)}%`
}

export function formatSignedMinutes(minutes: number): string {
  const rounded = Math.round(minutes)
  if (rounded === 0) return 'on target'
  if (rounded > 0) return `${rounded}m after target`
  return `${Math.abs(rounded)}m before target`
}
