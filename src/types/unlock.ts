import type { CompletionRewardKey } from '@/data/completionRewards'

/**
 * Discriminated union so future requirement kinds (achievements, level
 * thresholds, currency cost, story flags, equipment) are additive — existing
 * requirement types and their evaluation never need to change.
 */
export type UnlockRequirement =
  | { type: 'questCompletion'; questId: string }
  | { type: 'groupCompletion'; group: CompletionRewardKey }

export interface UnlockDefinition {
  id: string
  name: string
  description: string
  /** Display name of the real-world activity/app this unlock gates. */
  target: string
  /** All requirements must be met (AND). */
  requirements: UnlockRequirement[]
}

export interface UnlockState {
  id: string
  unlocked: boolean
}
