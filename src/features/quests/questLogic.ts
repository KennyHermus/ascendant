import type { CompletionRewardKey } from '@/data/completionRewards'
import {
  resolveCompletionRewards,
  type CompletionRewardClaims,
} from '@/features/quests/completionRewardLogic'
import {
  isQuestActiveOn,
  questContributesToStreakOn,
} from '@/features/quests/questSchedule'
import { getCurrentGameTime } from '@/lib/gameTime'
import { formatDateKey } from '@/lib/storage'
import type { QuestDefinition, QuestState } from '@/types/quest'

export interface CategoryCompletionStatus {
  completed: number
  total: number
  allComplete: boolean
}

export interface QuestProgressSummary {
  morningRoutine: CategoryCompletionStatus
  nutrition: CategoryCompletionStatus
  eveningRoutine: CategoryCompletionStatus
  dailyBonus: CategoryCompletionStatus
}

export interface StreakState {
  currentStreak: number
  lastNonNegotiableCompleteDate: string | null
}

export interface QuestCompletionResult {
  updatedQuests: QuestState[]
  streak: StreakState
  definition: QuestDefinition
  completionClaims: CompletionRewardClaims
  completionXp: number
  completionCurrency: number
}

export function mergeQuestStates(
  persisted: QuestState[],
  definitions: QuestDefinition[],
): QuestState[] {
  const persistedMap = new Map(persisted.map((q) => [q.id, q]))

  return definitions.map((definition) => ({
    id: definition.id,
    status: persistedMap.get(definition.id)?.status ?? 'available',
  }))
}

export function createQuestStates(
  definitions: QuestDefinition[],
): QuestState[] {
  return definitions.map((quest) => ({
    id: quest.id,
    status: 'available',
  }))
}

export function resetQuestsForPeriod(
  quests: QuestState[],
  definitions: QuestDefinition[],
  options: { resetDaily: boolean; resetWeekly: boolean },
): QuestState[] {
  const definitionMap = new Map(definitions.map((d) => [d.id, d]))

  return quests.map((quest) => {
    const definition = definitionMap.get(quest.id)
    if (!definition) return quest

    const shouldReset =
      (options.resetDaily &&
        (definition.category === 'nonNegotiable' ||
          definition.category === 'dailyBonus')) ||
      (options.resetWeekly &&
        (definition.category === 'weekly' ||
          definition.category === 'weeklyBonus'))

    if (shouldReset && quest.status !== 'available') {
      return { ...quest, status: 'available' }
    }

    return quest
  })
}

export function findQuestDefinition(
  definitions: QuestDefinition[],
  id: string,
): QuestDefinition | undefined {
  return definitions.find((quest) => quest.id === id)
}

export function findQuestState(
  quests: QuestState[],
  id: string,
): QuestState | undefined {
  return quests.find((quest) => quest.id === id)
}

/** Resolves the completion-reward group a quest belongs to, if any. */
function getQuestRewardGroup(
  definition: QuestDefinition,
): CompletionRewardKey | null {
  if (definition.category === 'nonNegotiable') {
    return definition.subcategory ?? null
  }
  if (
    definition.category === 'weekly' ||
    definition.category === 'weeklyBonus' ||
    definition.category === 'special'
  ) {
    return definition.category
  }
  return null
}

/** Quests required for a given reward group today (optional/inactive/weekend-suspended excluded). */
function getRequiredQuestsForGroup(
  definitions: QuestDefinition[],
  group: CompletionRewardKey,
  now: Date,
): QuestDefinition[] {
  return definitions.filter((definition) => {
    if (getQuestRewardGroup(definition) !== group) return false

    if (definition.category === 'nonNegotiable') {
      return questContributesToStreakOn(definition, now)
    }

    return isQuestActiveOn(definition, now) && !definition.optional
  })
}

export function getGroupCompletionStatus(
  quests: QuestState[],
  definitions: QuestDefinition[],
  group: CompletionRewardKey,
  now: Date = getCurrentGameTime(),
): CategoryCompletionStatus {
  const requiredQuests = getRequiredQuestsForGroup(definitions, group, now)
  const stateMap = new Map(quests.map((q) => [q.id, q.status]))

  const total = requiredQuests.length
  const completed = requiredQuests.filter(
    (q) => stateMap.get(q.id) === 'completed',
  ).length

  return {
    completed,
    total,
    allComplete: total > 0 && completed === total,
  }
}

/** All non-negotiable quests required today, across every subcategory. */
export function getNonNegotiableCompletionStatus(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): CategoryCompletionStatus {
  const required = definitions.filter((d) =>
    questContributesToStreakOn(d, now),
  )
  const stateMap = new Map(quests.map((q) => [q.id, q.status]))

  const total = required.length
  const completed = required.filter(
    (q) => stateMap.get(q.id) === 'completed',
  ).length

  return {
    completed,
    total,
    allComplete: total > 0 && completed === total,
  }
}

/** Dashboard-facing summary: the three non-negotiable subcategories plus daily bonus. */
export function getQuestProgressSummary(
  quests: QuestState[],
  definitions: QuestDefinition[],
  now: Date = getCurrentGameTime(),
): QuestProgressSummary {
  const stateMap = new Map(quests.map((q) => [q.id, q.status]))

  const dailyBonusQuests = definitions.filter(
    (d) => d.category === 'dailyBonus' && isQuestActiveOn(d, now),
  )
  const weekendBonusLearningWork = definitions.filter(
    (d) =>
      d.category === 'nonNegotiable' &&
      d.schedule?.streakOnlyOnWeekdays &&
      !questContributesToStreakOn(d, now) &&
      isQuestActiveOn(d, now),
  )
  const allDailyBonus = [...dailyBonusQuests, ...weekendBonusLearningWork]

  return {
    morningRoutine: getGroupCompletionStatus(
      quests,
      definitions,
      'morningRoutine',
      now,
    ),
    nutrition: getGroupCompletionStatus(quests, definitions, 'nutrition', now),
    eveningRoutine: getGroupCompletionStatus(
      quests,
      definitions,
      'eveningRoutine',
      now,
    ),
    dailyBonus: {
      total: allDailyBonus.length,
      completed: allDailyBonus.filter(
        (d) => stateMap.get(d.id) === 'completed',
      ).length,
      allComplete:
        allDailyBonus.length > 0 &&
        allDailyBonus.every((d) => stateMap.get(d.id) === 'completed'),
    },
  }
}

/**
 * Resolves streak state from current quest completion.
 * Called after every quest completion and on persistence rehydrate.
 *
 * Streak advances only when every non-negotiable quest required *today*
 * (weekday/weekend-aware) is complete. Daily bonus, weekly, and special
 * quests never affect it.
 */
export function resolveStreakState(
  quests: QuestState[],
  definitions: QuestDefinition[],
  streak: StreakState,
  now: Date = getCurrentGameTime(),
): StreakState {
  const today = formatDateKey(now)
  const nonNegotiable = getNonNegotiableCompletionStatus(
    quests,
    definitions,
    now,
  )

  if (!nonNegotiable.allComplete) {
    // Clear a stale "completed today" marker left by legacy data or partial resets.
    if (streak.lastNonNegotiableCompleteDate === today) {
      return {
        currentStreak: streak.currentStreak,
        lastNonNegotiableCompleteDate: null,
      }
    }
    return streak
  }

  if (streak.lastNonNegotiableCompleteDate === today) {
    return streak
  }

  const yesterdayDate = new Date(now)
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterday = formatDateKey(yesterdayDate)

  const newStreak =
    streak.lastNonNegotiableCompleteDate === yesterday
      ? streak.currentStreak + 1
      : 1

  return {
    currentStreak: newStreak,
    lastNonNegotiableCompleteDate: today,
  }
}

/**
 * Processes a quest completion: marks quest done and resolves streak
 * and completion rewards. Returns null if the quest cannot be completed
 * (already terminal, unknown, or not active today).
 */
export function processQuestCompletion(
  questId: string,
  quests: QuestState[],
  definitions: QuestDefinition[],
  streak: StreakState,
  completionClaims: CompletionRewardClaims,
  now: Date = getCurrentGameTime(),
): QuestCompletionResult | null {
  const questState = findQuestState(quests, questId)
  const definition = findQuestDefinition(definitions, questId)

  if (
    !questState ||
    !definition ||
    questState.status !== 'available' ||
    !isQuestActiveOn(definition, now)
  ) {
    return null
  }

  const updatedQuests = quests.map((quest) =>
    quest.id === questId ? { ...quest, status: 'completed' as const } : quest,
  )

  const completionRewards = resolveCompletionRewards(
    updatedQuests,
    definitions,
    completionClaims,
    now,
  )

  const updatedStreak = resolveStreakState(
    updatedQuests,
    definitions,
    streak,
    now,
  )

  return {
    updatedQuests,
    streak: updatedStreak,
    definition,
    completionClaims: completionRewards.claims,
    completionXp: completionRewards.totalXp,
    completionCurrency: completionRewards.totalCurrency,
  }
}
