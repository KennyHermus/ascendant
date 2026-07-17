import type { StatKey } from '@/types/hero'

/**
 * Schema version for the history document itself (independent of
 * `GameState.saveVersion`). Bump when `DailySnapshot` / `HeroHistory`
 * shapes change in a non-additive way; additive optional fields can land
 * without a bump.
 */
export const HISTORY_SCHEMA_VERSION = 1

/**
 * End-of-day immutable record for long-term History & Analytics.
 *
 * Kept deliberately small: counts, end-of-day hero state, and id lists —
 * not full event payloads or quest checklists. Fine-grained "what happened"
 * lives in `GameEvent`; this is the compact day rollup analytics will chart.
 */
export interface DailySnapshot {
  schemaVersion: number
  /** Quest-day key (`YYYY-MM-DD`) this snapshot covers. */
  date: string
  /** ISO timestamp from the game-time provider when the snapshot was finalized. */
  finalizedAt: string

  /** Hero level at end of day. */
  level: number
  /** XP progress within the current level at end of day. */
  currentXp: number
  /** Wallet gold at end of day. */
  gold: number

  currentStreak: number
  longestStreak: number

  /** Quests that ended the day `completed` (all categories). */
  questsCompleted: number
  /** Timed (or otherwise) quests that ended the day `missed`. */
  questsMissed: number

  /** XP earned during this day (delta off day-start lifetime XP). */
  xpEarned: number
  /** Gold earned during this day (delta off day-start lifetime gold). */
  goldEarned: number

  /** Absolute stat values at end of day (for growth / trend charts). */
  stats: Record<StatKey, number>

  /** Achievement definition ids unlocked during this day. */
  achievementIds: string[]
  /** Unlock definition ids earned during this day. */
  unlockIds: string[]

  /** Lifetime totals at end of day — absolute series without rescanning events. */
  totalQuestsCompleted: number
  totalXpEarned: number
  totalGoldEarned: number
}

/**
 * Persisted long-term history document. Append-only daily snapshots;
 * never overwrite an existing date.
 */
export interface HeroHistory {
  schemaVersion: number
  /** Chronological by `date` ascending. */
  dailySnapshots: DailySnapshot[]
}
