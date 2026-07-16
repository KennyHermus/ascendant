/**
 * Groups that grant a bonus when all of their required quests are completed.
 * The three nonNegotiable subcategories replace the old single `dailyCore`
 * group so rewards can reflect each routine's relative importance.
 */
export type CompletionRewardKey =
  | 'morningRoutine'
  | 'nutrition'
  | 'eveningRoutine'
  | 'weekly'
  | 'weeklyBonus'
  | 'special'

export interface CategoryCompletionReward {
  xpReward: number
  currencyReward: number
}

/**
 * Centralized completion reward configuration.
 * dailyBonus has no completion reward (TBD, not yet implemented).
 */
export const COMPLETION_REWARDS: Record<
  CompletionRewardKey,
  CategoryCompletionReward
> = {
  morningRoutine: { xpReward: 2, currencyReward: 1 },
  nutrition: { xpReward: 2, currencyReward: 1 },
  // Weighted slightly higher: caps the day and includes the Sleep deadline.
  eveningRoutine: { xpReward: 3, currencyReward: 1 },
  weekly: { xpReward: 3, currencyReward: 1 },
  weeklyBonus: { xpReward: 5, currencyReward: 2 },
  special: { xpReward: 7, currencyReward: 3 },
}

export const COMPLETION_REWARD_KEYS: CompletionRewardKey[] = [
  'morningRoutine',
  'nutrition',
  'eveningRoutine',
  'weekly',
  'weeklyBonus',
  'special',
]

export const DAILY_RESET_REWARD_KEYS: CompletionRewardKey[] = [
  'morningRoutine',
  'nutrition',
  'eveningRoutine',
]

export const WEEKLY_RESET_REWARD_KEYS: CompletionRewardKey[] = [
  'weekly',
  'weeklyBonus',
]
