import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { getEffectiveCategory, isQuestActiveOn } from '@/features/quests/questSchedule'
import { findNextTimedQuest, formatRemainingMinutes } from '@/features/quests/questTiming'
import { getCurrentGameTime } from '@/lib/gameTime'
import { parseDateKey } from '@/lib/storage'
import type { QuestDefinition, QuestState } from '@/types/quest'

export interface NextObjective {
  questId: string
  questName: string
  /** Present only when the quest has a deadline today; otherwise it's "Ready" (no time pressure). */
  remainingLabel?: string
}

/**
 * The single most meaningful next action, for the Hero Card's "Next
 * Objective" line — distinct from the (plural) Active Objectives panel
 * elsewhere on the dashboard, which surfaces several items at once.
 *
 * Fixed priority: soonest timed-quest deadline (shared with Active
 * Objectives via `findNextTimedQuest`), then the earliest incomplete
 * Non-Negotiable, then the earliest incomplete Daily Bonus, then an
 * incomplete Weekly quest. "Earliest" means definition order in
 * `data/quests.ts`, which mirrors the day's natural flow (morning routine
 * before evening routine, etc.) — no quest IDs are hardcoded here, only
 * the `category`/`timing` fields already on each definition.
 *
 * Optional quests (e.g. Breakfast) are never suggested — they're never
 * required, so surfacing one as "the next thing to do" would be misleading.
 *
 * Purely reads existing quest data; owns no state of its own.
 */
export function getNextObjective(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): NextObjective | null {
  const questStatus = new Map(quests.map((q) => [q.id, q.status]))
  const dayKey = getActiveQuestDayKey(definitions, now)
  const questDay = parseDateKey(dayKey)
  const isIncomplete = (d: QuestDefinition) =>
    !d.optional && isQuestActiveOn(d, questDay) && questStatus.get(d.id) === 'available'

  const nextTimedQuest = findNextTimedQuest(
    quests,
    definitions,
    now,
    questDay,
    dayKey,
  )
  if (nextTimedQuest) {
    const { timing, definition } = nextTimedQuest
    const minutesLeft =
      timing.phase === 'onTime' ? timing.minutesUntilTarget : timing.minutesUntilDeadline

    return {
      questId: definition.id,
      questName: definition.name,
      remainingLabel:
        minutesLeft !== null ? `${formatRemainingMinutes(minutesLeft)} remaining` : undefined,
    }
  }

  const nextNonNegotiable = definitions.find(
    (d) => getEffectiveCategory(d, questDay) === 'nonNegotiable' && isIncomplete(d),
  )
  if (nextNonNegotiable) {
    return { questId: nextNonNegotiable.id, questName: nextNonNegotiable.name }
  }

  const nextDailyBonus = definitions.find(
    (d) => getEffectiveCategory(d, questDay) === 'dailyBonus' && isIncomplete(d),
  )
  if (nextDailyBonus) {
    return { questId: nextDailyBonus.id, questName: nextDailyBonus.name }
  }

  const nextWeekly = definitions.find(
    (d) => d.category === 'weekly' && isIncomplete(d),
  )
  if (nextWeekly) {
    return { questId: nextWeekly.id, questName: nextWeekly.name }
  }

  return null
}
