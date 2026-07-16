export const STAT_KEYS = [
  'strength',
  'hp',
  'defense',
  'stamina',
  'speed',
  'intellect',
  'willpower',
  'specialTechnique',
] as const

export type StatKey = (typeof STAT_KEYS)[number]

/** Per-stat state. `value` is used in v0.0.1; future stat XP fields can extend this. */
export interface StatState {
  value: number
}

export type HeroStats = Record<StatKey, StatState>

export type StatRewards = Partial<Record<StatKey, number>>

/**
 * Persistent, long-term progression counters — distinct from today's
 * quest/streak state, which resets. Updated incrementally as gameplay
 * events occur (never recomputed by scanning history), so it stays cheap
 * regardless of history size. Extensible: add a field here (and a matching
 * update call in `lifetimeStats.ts`) for future counters — enemies
 * defeated, bosses defeated, total workouts, distance walked, weight
 * lifted, achievements unlocked, transformations unlocked, etc.
 */
export interface LifetimeStats {
  longestStreak: number
  totalQuestsCompleted: number
  totalXpEarned: number
  totalGoldEarned: number
  /**
   * Lifetime completion count per quest id — powers count-based
   * Achievements (e.g. "100 Workouts", "100 Walks" summed across Morning
   * + Evening Walk) without ever rescanning `GameEvent` history. Keyed by
   * `QuestDefinition.id`; ids that no longer exist in `data/quests.ts`
   * simply become inert dead entries, same as any other quest-id rename.
   */
  questCompletionCounts: Record<string, number>
}

export interface Hero {
  name: string
  level: number
  currentXp: number
  currency: number
  stats: HeroStats
  lifetimeStats: LifetimeStats
}
