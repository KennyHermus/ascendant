import type { LifetimeStats } from '@/types/hero'

export function createInitialLifetimeStats(): LifetimeStats {
  return {
    longestStreak: 0,
    totalQuestsCompleted: 0,
    totalXpEarned: 0,
    totalGoldEarned: 0,
    questCompletionCounts: {},
  }
}

/**
 * Incremental update applied once per quest completion — never recomputed
 * by scanning `GameEvent` history, so it stays cheap regardless of how
 * large that history grows (or is trimmed). Extend this the same way for
 * future per-completion counters: always additive, one line per new stat.
 */
export function recordQuestCompletionStats(
  stats: LifetimeStats,
  {
    questId,
    xpEarned,
    goldEarned,
  }: { questId: string; xpEarned: number; goldEarned: number },
): LifetimeStats {
  return {
    ...stats,
    totalQuestsCompleted: stats.totalQuestsCompleted + 1,
    totalXpEarned: stats.totalXpEarned + Math.max(0, xpEarned),
    totalGoldEarned: stats.totalGoldEarned + Math.max(0, goldEarned),
    questCompletionCounts: {
      ...stats.questCompletionCounts,
      [questId]: (stats.questCompletionCounts[questId] ?? 0) + 1,
    },
  }
}

/**
 * Adds to the XP/Gold lifetime totals without touching
 * `totalQuestsCompleted`/`questCompletionCounts` — for earnings that don't
 * come from completing a quest (currently just Achievement rewards). Kept
 * separate from `recordQuestCompletionStats` so "how many quests have I
 * ever completed" can never be inflated by a non-quest source.
 */
export function recordBonusEarnings(
  stats: LifetimeStats,
  { xpEarned, goldEarned }: { xpEarned: number; goldEarned: number },
): LifetimeStats {
  if (xpEarned <= 0 && goldEarned <= 0) return stats
  return {
    ...stats,
    totalXpEarned: stats.totalXpEarned + Math.max(0, xpEarned),
    totalGoldEarned: stats.totalGoldEarned + Math.max(0, goldEarned),
  }
}

/** Raises `longestStreak` to match a new high — a no-op (same reference) once the record isn't beaten. */
export function recordStreakForLifetimeStats(
  stats: LifetimeStats,
  currentStreak: number,
): LifetimeStats {
  return currentStreak > stats.longestStreak
    ? { ...stats, longestStreak: currentStreak }
    : stats
}
