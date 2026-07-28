/**
 * Hero Identity (v0.0.5) — accomplishment titles, lifetime milestones, and
 * persisted identity state. Distinct from level-based ranks (`heroTitle.ts`)
 * and collectible Achievements.
 */

export const HERO_IDENTITY_SCHEMA_VERSION = 1

/** Condition evaluated against live game state — never persisted. */
export type AccomplishmentCondition =
  | { kind: 'total_quests'; min: number }
  | { kind: 'level'; min: number }
  | { kind: 'workouts_completed'; min: number }
  | { kind: 'push_up_reps'; min: number }
  | { kind: 'days_active'; min: number }
  | { kind: 'longest_streak'; min: number }
  | { kind: 'personal_records'; min: number }
  | { kind: 'learning_quest_completions'; min: number }

export interface LifetimeAccomplishmentDefinition {
  id: string
  name: string
  description: string
  /** Timeline / biography headline when earned. */
  timelineLabel: string
  condition: AccomplishmentCondition
  /** Lower = earlier in lists. */
  sortOrder: number
  /**
   * When false, unlock persists but no timeline event is emitted — use when
   * another event type already covers the moment (e.g. LEVEL_UP for levels).
   */
  emitTimelineEvent?: boolean
}

export interface HeroIdentityTitleDefinition {
  id: string
  name: string
  description: string
  /** Unlocks when this accomplishment is earned. */
  requiredAccomplishmentId: string
  /** Higher priority wins when multiple titles are unlocked (auto-select). */
  priority: number
}

/**
 * Persisted Hero Identity progress. Biography and profile percentages are
 * derived at read time — not stored here.
 *
 * Future extension points (not implemented in v0.0.5):
 * - `classId` — Hero Classes
 * - `reputation` — faction standing
 * - `guildId` — Guild membership
 * - `companionIds` — Companions roster
 * - `alignment` — moral / story alignment
 * - `storyFlags` — narrative choice record
 */
export interface HeroIdentityState {
  schemaVersion: typeof HERO_IDENTITY_SCHEMA_VERSION
  /** Earned accomplishment ids — append-only, never revoked. */
  unlockedAccomplishmentIds: string[]
  /** Earned title ids — append-only. */
  unlockedTitleIds: string[]
  /**
   * Display title. `null` = auto-select highest-priority unlocked title.
   * Future versions may allow manual selection.
   */
  activeTitleId: string | null
}

export interface HeroIdentityMetrics {
  totalQuestsCompleted: number
  level: number
  workoutsCompleted: number
  pushUpReps: number
  daysActive: number
  longestStreak: number
  personalRecords: number
  learningQuestCompletions: number
  currentStreak: number
}

export interface HeroProfileViewModel {
  name: string
  initials: string
  /** Accomplishment-based display title, or null when none unlocked. */
  heroTitle: string | null
  /** Level-based rank ladder (Novice, Apprentice, …). */
  currentRank: string
  level: number
  currentXp: number
  xpRequired: number
  xpPercent: number
  lifetimeGold: number
  daysActive: number
  currentStreak: number
  longestStreak: number
  overallCompletionPercent: number | null
  overallTrainingPercent: number | null
  overallNutritionPercent: number | null
  biographyLines: string[]
  unlockedAccomplishments: LifetimeAccomplishmentDefinition[]
  unlockedTitles: HeroIdentityTitleDefinition[]
  nextAccomplishments: Array<{
    definition: LifetimeAccomplishmentDefinition
    progress: number
    target: number
  }>
}
