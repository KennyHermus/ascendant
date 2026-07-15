import {
  COMPLETION_REWARD_CATEGORIES,
  COMPLETION_REWARDS,
  type CompletionRewardKey,
} from '@/data/completionRewards'
import { getCategoryCompletionStatus } from '@/features/quests/questLogic'
import type { QuestDefinition, QuestState } from '@/types/quest'

export type CompletionRewardClaims = Record<CompletionRewardKey, boolean>

export interface CompletionRewardResult {
  claims: CompletionRewardClaims
  totalXp: number
  totalCurrency: number
  granted: CompletionRewardKey[]
}

export function createInitialCompletionClaims(): CompletionRewardClaims {
  return {
    dailyCore: false,
    weekly: false,
    weeklyBonus: false,
    special: false,
  }
}

export function resetCompletionClaims(
  claims: CompletionRewardClaims,
  options: { resetDaily: boolean; resetWeekly: boolean },
): CompletionRewardClaims {
  return {
    ...claims,
    dailyCore: options.resetDaily ? false : claims.dailyCore,
    weekly: options.resetWeekly ? false : claims.weekly,
    weeklyBonus: options.resetWeekly ? false : claims.weeklyBonus,
  }
}

/**
 * Evaluates category completion and grants rewards for newly completed
 * categories that have not yet been claimed this period.
 */
export function resolveCompletionRewards(
  quests: QuestState[],
  definitions: QuestDefinition[],
  claims: CompletionRewardClaims,
): CompletionRewardResult {
  const nextClaims = { ...claims }
  let totalXp = 0
  let totalCurrency = 0
  const granted: CompletionRewardKey[] = []

  for (const category of COMPLETION_REWARD_CATEGORIES) {
    if (nextClaims[category]) continue

    const status = getCategoryCompletionStatus(quests, definitions, category)
    if (!status.allComplete) continue

    const reward = COMPLETION_REWARDS[category]
    nextClaims[category] = true
    totalXp += reward.xpReward
    totalCurrency += reward.currencyReward
    granted.push(category)
  }

  return {
    claims: nextClaims,
    totalXp,
    totalCurrency,
    granted,
  }
}
