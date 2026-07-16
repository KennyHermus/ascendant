export const GAME_EVENT_TYPES = [
  'QUEST_COMPLETED',
  'QUEST_FAILED',
  'LEVEL_UP',
  'STREAK_INCREASED',
  'STREAK_BROKEN',
  'UNLOCK_EARNED',
  'ACHIEVEMENT_UNLOCKED',
] as const

export type GameEventType = (typeof GAME_EVENT_TYPES)[number]

interface BaseGameEvent {
  id: string
  /** ISO timestamp, taken from the game time provider (respects dev time simulation). */
  timestamp: string
}

/**
 * Lightweight internal history entry for a meaningful gameplay moment.
 * This is the foundation for a future History/Analytics feature (v0.0.3) —
 * for now it only backs the Dashboard's "Recent Progress" section. New
 * event kinds are additive: add one union member here and one branch in
 * `eventLogic.ts`'s formatters; nothing else needs to change.
 */
export type GameEvent =
  | (BaseGameEvent & { type: 'QUEST_COMPLETED'; questId: string; questName: string })
  | (BaseGameEvent & {
      type: 'QUEST_FAILED'
      questId: string
      questName: string
      /**
       * Quest-day key the miss belongs to (e.g. Sleep missed at 00:20 Fri
       * still carries Thursday's key). Used to dedupe re-entries into the
       * same missed window after a simulated-time rewind — never to decide
       * current availability.
       */
      periodKey?: string
    })
  | (BaseGameEvent & { type: 'LEVEL_UP'; level: number })
  | (BaseGameEvent & { type: 'STREAK_INCREASED'; streak: number })
  | (BaseGameEvent & { type: 'STREAK_BROKEN'; previousStreak: number })
  | (BaseGameEvent & { type: 'UNLOCK_EARNED'; unlockId: string; unlockName: string })
  | (BaseGameEvent & {
      type: 'ACHIEVEMENT_UNLOCKED'
      achievementId: string
      achievementName: string
    })
