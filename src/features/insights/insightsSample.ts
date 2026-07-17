import { appendEvents, recordQuestCompleted, recordQuestFailed } from '@/features/events/eventLogic'
import { generateSampleHistory } from '@/features/history/historySample'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { formatDateKey, parseDateKey } from '@/lib/storage'
import type { GameEvent } from '@/types/event'
import type { Hero } from '@/types/hero'
import type { HeroHistory } from '@/types/history'
import type { QuestDefinition } from '@/types/quest'

export interface SampleInsightDataResult {
  history: HeroHistory
  events: GameEvent[]
  snapshotsAdded: number
  eventsAdded: number
}

export interface GenerateSampleInsightDataInput {
  history: HeroHistory
  events: GameEvent[]
  hero: Hero
  questDefinitions: QuestDefinition[]
  todayKey: string
  /** Past days of synthetic snapshots. */
  days?: number
}

/**
 * DEV-only: backfills History snapshots + a small set of quest events so
 * Insights has enough signal to interpret. Does not invent coaching text —
 * only underlying Analytics/History inputs.
 */
export function generateSampleInsightData(
  input: GenerateSampleInsightDataInput,
): SampleInsightDataResult {
  const days = input.days ?? 60
  const beforeCount = input.history.dailySnapshots.length

  const history = generateSampleHistory({
    history: input.history,
    hero: input.hero,
    days,
    todayKey: input.todayKey,
  })

  const snapshotsAdded = history.dailySnapshots.length - beforeCount
  const timed = input.questDefinitions.filter((d) => d.timing)
  const streakQuests = input.questDefinitions.filter((d) => d.contributesToStreak)
  const newEvents: GameEvent[] = []
  const today = parseDateKey(input.todayKey)

  // Seed recent timed completions / misses across the last ~10 days for
  // average-offset and late-success insights.
  for (let offset = 1; offset <= 10; offset += 1) {
    const day = new Date(today)
    day.setDate(today.getDate() - offset)
    const dayKey = formatDateKey(day)

    for (const definition of timed) {
      if (!definition.timing) continue
      const [h, m] = definition.timing.targetTime.split(':').map(Number)
      const target = new Date(day)
      target.setHours(h, m, 0, 0)
      if (h === 0 && m === 0) target.setDate(target.getDate() + 1)

      // Alternate: on-time, grace (late success), miss
      const mode = offset % 3
      if (mode === 0) {
        const at = new Date(target.getTime() - 5 * 60_000)
        newEvents.push(recordQuestCompleted(definition, at))
      } else if (mode === 1) {
        const at = new Date(
          target.getTime() + Math.min(definition.timing.graceMinutes - 5, 20) * 60_000,
        )
        newEvents.push(recordQuestCompleted(definition, at))
      } else {
        const at = new Date(
          target.getTime() + (definition.timing.graceMinutes + 10) * 60_000,
        )
        newEvents.push(recordQuestFailed(definition, at, dayKey))
      }
    }

    // Occasional streak-quest miss for breaker insights
    if (offset % 4 === 0 && streakQuests[0]) {
      const missAt = new Date(day)
      missAt.setHours(22, 0, 0, 0)
      newEvents.push(recordQuestFailed(streakQuests[0], missAt, dayKey))
    }
  }

  const events = appendEvents(input.events, newEvents)

  return {
    history,
    events,
    snapshotsAdded,
    eventsAdded: newEvents.length,
  }
}

export function resolveTodayKeyForSample(
  questDefinitions: QuestDefinition[],
  now: Date,
): string {
  return getActiveQuestDayKey(questDefinitions, now)
}
