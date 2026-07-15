import {
  resolveCompletionRewards,
  type CompletionRewardClaims,
} from '@/features/quests/completionRewardLogic'
import type { QuestCategory, QuestDefinition, QuestState } from '@/types/quest'
import { getYesterdayDateString } from '@/lib/storage'

export interface CategoryCompletionStatus {
  completed: number
  total: number
  allComplete: boolean
}

export interface DailyCompletionStatus {
  dailyCore: CategoryCompletionStatus
  dailyBonus: CategoryCompletionStatus
}

export interface StreakState {
  currentStreak: number
  lastDailyCoreCompleteDate: string | null
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
    completed: persistedMap.get(definition.id)?.completed ?? false,
  }))
}

export function createQuestStates(
  definitions: QuestDefinition[],
): QuestState[] {
  return definitions.map((quest) => ({
    id: quest.id,
    completed: false,
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
        (definition.category === 'dailyCore' ||
          definition.category === 'dailyBonus')) ||
      (options.resetWeekly &&
        (definition.category === 'weekly' ||
          definition.category === 'weeklyBonus'))

    if (shouldReset && quest.completed) {
      return { ...quest, completed: false }
    }

    return quest
  })
}

export function getQuestsByCategory(
  definitions: QuestDefinition[],
  category: QuestCategory,
): QuestDefinition[] {
  return definitions.filter((quest) => quest.category === category)
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

export function getCategoryCompletionStatus(
  quests: QuestState[],
  definitions: QuestDefinition[],
  category: QuestCategory,
): CategoryCompletionStatus {
  const categoryQuests = getQuestsByCategory(definitions, category)
  const stateMap = new Map(quests.map((q) => [q.id, q.completed]))

  const total = categoryQuests.length
  const completed = categoryQuests.filter((q) => stateMap.get(q.id)).length

  return {
    completed,
    total,
    allComplete: total > 0 && completed === total,
  }
}

export function getDailyCompletionStatus(
  quests: QuestState[],
  definitions: QuestDefinition[],
): DailyCompletionStatus {
  return {
    dailyCore: getCategoryCompletionStatus(quests, definitions, 'dailyCore'),
    dailyBonus: getCategoryCompletionStatus(quests, definitions, 'dailyBonus'),
  }
}

/**
 * Resolves streak state from current quest completion.
 * Called after every quest completion and on persistence rehydrate.
 *
 * Streak advances only when all daily core quests are complete for the day.
 * Daily bonus, weekly, and special quests do not affect streak.
 */
export function resolveStreakState(
  quests: QuestState[],
  definitions: QuestDefinition[],
  streak: StreakState,
  today: string,
): StreakState {
  const { dailyCore } = getDailyCompletionStatus(quests, definitions)

  if (!dailyCore.allComplete) {
    // Clear a stale "completed today" marker left by legacy data or partial resets.
    if (streak.lastDailyCoreCompleteDate === today) {
      return {
        currentStreak: streak.currentStreak,
        lastDailyCoreCompleteDate: null,
      }
    }
    return streak
  }

  if (streak.lastDailyCoreCompleteDate === today) {
    return streak
  }

  const yesterday = getYesterdayDateString()
  const newStreak =
    streak.lastDailyCoreCompleteDate === yesterday
      ? streak.currentStreak + 1
      : 1

  return {
    currentStreak: newStreak,
    lastDailyCoreCompleteDate: today,
  }
}

/**
 * Processes a quest completion: marks quest done and resolves streak.
 * Returns null if the quest cannot be completed.
 */
export function processQuestCompletion(
  questId: string,
  quests: QuestState[],
  definitions: QuestDefinition[],
  streak: StreakState,
  completionClaims: CompletionRewardClaims,
  today: string,
): QuestCompletionResult | null {
  const questState = findQuestState(quests, questId)
  const definition = findQuestDefinition(definitions, questId)

  if (!questState || !definition || questState.completed) {
    return null
  }

  const updatedQuests = quests.map((quest) =>
    quest.id === questId ? { ...quest, completed: true } : quest,
  )

  const completionRewards = resolveCompletionRewards(
    updatedQuests,
    definitions,
    completionClaims,
  )

  const updatedStreak = resolveStreakState(
    updatedQuests,
    definitions,
    streak,
    today,
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
