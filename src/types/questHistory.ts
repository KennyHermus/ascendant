import type { CompletionGrade } from '@/types/completion'

export const QUEST_HISTORY_SCHEMA_VERSION = 1

/** One persisted quest completion with timestamp and grade. */
export interface QuestCompletionRecord {
  id: string
  questId: string
  /** Hero Day key (`YYYY-MM-DD`) this completion belongs to. */
  heroDayKey: string
  /** ISO timestamp from the game-time provider. */
  completedAt: string
  grade: Exclude<CompletionGrade, 'missed'>
  /**
   * Minutes relative to target time for timed quests (negative = early).
   * `0` for untimed quests.
   */
  minutesOffset: number
}

/** Recorded when a quest ends a Hero Day without completion. */
export interface QuestMissRecord {
  id: string
  questId: string
  heroDayKey: string
  /** ISO timestamp when the miss was finalized (Hero Day advance). */
  missedAt: string
}

/**
 * Append-only per-quest performance log for Quest Explorer and punctuality analytics.
 * Distinct from the capped `GameEvent` buffer and from `DailySnapshot` rollups.
 */
export interface QuestHistory {
  schemaVersion: number
  completions: QuestCompletionRecord[]
  misses: QuestMissRecord[]
}
