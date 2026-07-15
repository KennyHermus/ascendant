/** Categories that grant a bonus when all quests in the group are completed. */
export type CompletionRewardKey =
  | 'dailyCore'
  | 'weekly'
  | 'weeklyBonus'
  | 'special'

export interface CategoryCompletionReward {
  xpReward: number
  currencyReward: number
}

/**
 * Centralized category completion reward configuration.
 * dailyBonus is intentionally omitted (TBD).
 */
export const COMPLETION_REWARDS: Record<
  CompletionRewardKey,
  CategoryCompletionReward
> = {
  dailyCore: {
    xpReward: 3,
    currencyReward: 1,
  },
  weekly: {
    xpReward: 3,
    currencyReward: 1,
  },
  weeklyBonus: {
    xpReward: 5,
    currencyReward: 2,
  },
  special: {
    xpReward: 7,
    currencyReward: 3,
  },
}

/** Quest categories that map directly to a completion reward key. */
export const COMPLETION_REWARD_CATEGORIES: CompletionRewardKey[] = [
  'dailyCore',
  'weekly',
  'weeklyBonus',
  'special',
]
