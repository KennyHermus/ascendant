import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { findNextTimedQuest, formatRemainingMinutes } from '@/features/quests/questTiming'
import { getLockedUnlocksByProximity } from '@/features/unlocks/unlockLogic'
import { getCurrentGameTime } from '@/lib/gameTime'
import { parseDateKey } from '@/lib/storage'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { UnlockDefinition } from '@/types/unlock'

export type ActiveObjective =
  | { kind: 'timedQuest'; questId: string; questName: string; remainingLabel: string; urgent: boolean }
  | { kind: 'unlock'; unlockId: string; unlockName: string; requirementLabel: string }
  | { kind: 'weeklyQuest'; questId: string; questName: string }

/**
 * Cross-feature "what should I do next" view — reads quest + unlock data
 * but owns no state of its own. Intentionally simple/fixed-priority for
 * now (soonest timed deadline, then closest unlock, then one incomplete
 * weekly quest); a natural place to grow smarter later.
 */
export function getActiveObjectives(
  quests: QuestState[],
  questDefinitions: QuestDefinition[],
  unlockDefinitions: UnlockDefinition[],
  now: Date = getCurrentGameTime(),
): ActiveObjective[] {
  const objectives: ActiveObjective[] = []
  const questStatus = new Map(quests.map((q) => [q.id, q.status]))
  const dayKey = getActiveQuestDayKey(questDefinitions, now)
  const questDay = parseDateKey(dayKey)

  const nextTimedQuest = findNextTimedQuest(
    quests,
    questDefinitions,
    now,
    questDay,
    dayKey,
  )

  if (nextTimedQuest) {
    const minutesLeft =
      nextTimedQuest.timing.phase === 'onTime'
        ? nextTimedQuest.timing.minutesUntilTarget
        : nextTimedQuest.timing.minutesUntilDeadline

    objectives.push({
      kind: 'timedQuest',
      questId: nextTimedQuest.definition.id,
      questName: nextTimedQuest.definition.name,
      remainingLabel: minutesLeft !== null ? formatRemainingMinutes(minutesLeft) : '',
      urgent: nextTimedQuest.timing.phase === 'inGracePeriod',
    })
  }

  const closestUnlock = getLockedUnlocksByProximity(
    unlockDefinitions,
    quests,
    questDefinitions,
    now,
  )[0]

  if (closestUnlock) {
    objectives.push({
      kind: 'unlock',
      unlockId: closestUnlock.status.definition.id,
      unlockName: closestUnlock.status.definition.name,
      requirementLabel: closestUnlock.unmet[0]?.label ?? 'Requirements incomplete',
    })
  }

  const incompleteWeekly = questDefinitions.find(
    (d) => d.category === 'weekly' && questStatus.get(d.id) === 'available',
  )
  if (incompleteWeekly) {
    objectives.push({
      kind: 'weeklyQuest',
      questId: incompleteWeekly.id,
      questName: incompleteWeekly.name,
    })
  }

  return objectives
}
