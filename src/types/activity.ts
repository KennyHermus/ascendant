import type { CompletionGrade } from '@/types/completion'

/**
 * Activity kinds — extensible registry for future Nutrition, Combat, Story, etc.
 * v0.0.4 implements `workout` only.
 */
export const ACTIVITY_KINDS = ['workout'] as const

export type ActivityKind = (typeof ACTIVITY_KINDS)[number]

/** Shared fields every persisted activity record carries. */
export interface ActivityBase {
  id: string
  kind: ActivityKind
  /** Quest that this activity satisfies, when applicable. */
  questId: string | null
  heroDayKey: string
  startedAt: string
  completedAt: string
  completionGrade: Exclude<CompletionGrade, 'missed'>
  /** Optional extension bag — keep JSON-serializable. */
  metadata?: Record<string, string | number | boolean | null>
}
