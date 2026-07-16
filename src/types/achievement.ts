/**
 * Long-term milestones layered on top of existing gameplay state — never a
 * gameplay mechanic themselves. Every condition below reads from data that
 * already exists (hero level/streak/lifetime stats, quest completion,
 * quest definitions) rather than introducing new gameplay rules; adding a
 * new achievement is a data-only change in `achievementDefinitions.ts`.
 */
export const ACHIEVEMENT_CATEGORIES = [
  'progression',
  'consistency',
  'quests',
  'exploration',
  'fitness',
  'learning',
  'special',
] as const

export type AchievementCategory = (typeof ACHIEVEMENT_CATEGORIES)[number]

export const ACHIEVEMENT_RARITIES = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
] as const

export type AchievementRarity = (typeof ACHIEVEMENT_RARITIES)[number]

/**
 * Discriminated union so new reward kinds are additive. Only `xp`/`gold`
 * are actually applied today (`achievementLogic.ts`'s
 * `applyAchievementRewards`) — `title`/`cosmeticBadge`/`item`/`skillPoint`
 * exist in the model per spec but intentionally have no effect yet; wiring
 * one up later is a matter of handling its case there, not a shape change
 * here.
 */
export type AchievementReward =
  | { type: 'xp'; amount: number }
  | { type: 'gold'; amount: number }
  | { type: 'title'; value: string }
  | { type: 'cosmeticBadge'; value: string }
  | { type: 'item'; value: string }
  | { type: 'skillPoint'; amount: number }

/**
 * Discriminated union so new condition kinds are additive. Every variant
 * is deliberately expressed in terms of data that already exists (hero
 * level, lifetime stats, quest completion) — none of them reference a
 * specific quest by name in this file; the *definitions* (in
 * `achievementDefinitions.ts`) supply concrete quest ids/categories, this
 * type just describes the shapes an evaluator needs to support.
 */
export type AchievementCondition =
  | { type: 'heroLevel'; level: number }
  | { type: 'longestStreak'; days: number }
  | { type: 'totalQuestsCompleted'; count: number }
  /** Sum of lifetime completions across one or more quest ids (e.g. Morning Walk + Evening Walk for "100 Walks"). */
  | { type: 'questCompletionCount'; questIds: string[]; count: number }
  /** At least one quest with a `timing` deadline has ever been completed. */
  | { type: 'timedQuestCompleted' }
  /** Every required quest in `category` was completed on the same calendar day, at least once. */
  | { type: 'categoryCompletedInDay'; category: 'nonNegotiable' | 'dailyBonus' }
  /** Every Non-Negotiable *and* every Daily Bonus quest completed on the same calendar day. */
  | { type: 'perfectDay' }

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  category: AchievementCategory
  /** Placeholder emoji — swap for real art later without touching the model. */
  icon: string
  /** Hidden achievements render as "???" until unlocked (a surprise, e.g. Perfect Day). */
  hidden?: boolean
  rarity: AchievementRarity
  /** One or more rewards granted exactly once, the moment the achievement unlocks. */
  reward: AchievementReward[]
  condition: AchievementCondition
}

/** Persisted per-achievement record. Never re-locks — see `evaluateAchievements`. */
export interface AchievementState {
  id: string
  unlocked: boolean
  unlockedAt: string | null
}
