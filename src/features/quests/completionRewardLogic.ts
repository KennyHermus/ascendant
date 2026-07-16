import {
  COMPLETION_REWARD_KEYS,
  COMPLETION_REWARDS,
  DAILY_RESET_REWARD_KEYS,
  WEEKLY_RESET_REWARD_KEYS,
  type CompletionRewardKey,
} from '@/data/completionRewards'
import { getCurrentGameTime } from '@/lib/gameTime'
import { getGroupCompletionStatus } from '@/features/quests/questLogic'
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
    morningRoutine: false,
    nutrition: false,
    eveningRoutine: false,
    weekly: false,
    weeklyBonus: false,
    special: false,
  }
}

export function resetCompletionClaims(
  claims: CompletionRewardClaims,
  options: { resetDaily: boolean; resetWeekly: boolean },
): CompletionRewardClaims {
  const next = { ...claims }

  if (options.resetDaily) {
    for (const key of DAILY_RESET_REWARD_KEYS) next[key] = false
  }
  if (options.resetWeekly) {
    for (const key of WEEKLY_RESET_REWARD_KEYS) next[key] = false
  }

  return next
}

/**
 * Evaluates group completion and grants rewards for newly completed
 * groups that have not yet been claimed this period.
 */
export function resolveCompletionRewards(
  quests: QuestState[],
  definitions: QuestDefinition[],
  claims: CompletionRewardClaims,
  now: Date = getCurrentGameTime(),
): CompletionRewardResult {
  const nextClaims = { ...claims }
  let totalXp = 0
  let totalCurrency = 0
  const granted: CompletionRewardKey[] = []

  for (const group of COMPLETION_REWARD_KEYS) {
    if (nextClaims[group]) continue

    const status = getGroupCompletionStatus(quests, definitions, group, now)
    if (!status.allComplete) continue

    const reward = COMPLETION_REWARDS[group]
    nextClaims[group] = true
    totalXp += reward.xpReward
    totalCurrency += reward.currencyReward
    granted.push(group)
  }

  return {
    claims: nextClaims,
    totalXp,
    totalCurrency,
    granted,
  }
}
