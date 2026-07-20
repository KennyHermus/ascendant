import type {
  NonNegotiableSubcategory,
  QuestCategory,
} from '@/types/quest'
import type {
  OfficialPersonalRecord,
  PersonalRecordHistoryEntry,
  PrType,
} from '@/types/performance'

/**
 * Reusable time windows for Analytics calculations.
 * Bounds are resolved against application/simulated time.
 */
export const ANALYTICS_PERIODS = ['today', 'week', 'month', 'lifetime'] as const

export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number]

/** Inclusive quest-day key range, or `null` for unbounded lifetime. */
export interface AnalyticsDateRange {
  start: string
  end: string
}

/**
 * Completed / missed attempts and derived rate.
 * `rate` is null when there are no attempts (avoids 0/0 → 0 lying as “0%”).
 */
export interface AttemptStats {
  completed: number
  missed: number
  /** `completed / (completed + missed)` in [0, 1], or null if none. */
  rate: number | null
}

export interface HeroAnalytics {
  currentLevel: number
  /** Max of current level and any finalized daily snapshot level. */
  highestLevelReached: number
  totalXpEarned: number
  totalGoldEarned: number
  currentStreak: number
  /** Peak streak for the analytics period (lifetime = all-time record). */
  longestStreak: number
}

export interface QuestAnalytics {
  totalCompleted: number
  totalMissed: number
  completionRate: number | null
  /** Days with ≥1 completion and zero misses (snapshots + live day). */
  perfectDays: number
  byCategory: Record<QuestCategory, AttemptStats>
  bySubcategory: Record<NonNegotiableSubcategory, AttemptStats>
}

export interface TimedQuestAnalytics {
  completed: number
  missed: number
  successRate: number | null
}

/** Punctuality rollups from `questHistory` completion records. */
export interface PunctualityAnalytics {
  timedCompletions: number
  perfectPercent: number | null
  onTimePercent: number | null
  /** Share of timed completions graded `onTime` or `perfect`. */
  punctualPercent: number | null
  avgMinutesLate: number | null
  avgMinutesEarly: number | null
  avgCompletionTimeMinutes: number | null
}

export interface ProgressAnalytics {
  xpEarned: number
  goldEarned: number
}

export interface HistoryAnalytics {
  totalSnapshots: number
  daysTracked: number
  averageXpPerDay: number | null
  averageGoldPerDay: number | null
  /** Mean of each day's completion rate in the period; null if no attempts. */
  averageCompletionRate: number | null
}

export interface AchievementAnalytics {
  totalUnlocked: number
  totalDefined: number
  unlockPercentage: number
}

/** Workout activity rollups for a period — sourced from `WorkoutActivity` records. */
export interface WorkoutAnalytics {
  workoutsCompleted: number
  totalExercises: number
  totalSets: number
  totalReps: number
  totalVolume: number
  totalDurationMinutes: number
  averageDurationMinutes: number | null
  workoutFrequencyPerWeek: number | null
}

/** Official PR analytics — sourced from `PerformanceState`, not workouts. */
export interface PerformanceAnalytics {
  totalPrsEarned: number
  baselineCompleted: boolean
  assessmentsCompleted: number
  currentOfficialPrs: OfficialPersonalRecord[]
  recentPrs: PersonalRecordHistoryEntry[]
  mostImprovedExercises: {
    exerciseId: string
    exerciseName: string
    prType: PrType
    improvement: number
  }[]
}

/**
 * Full read-only analytics bundle for one resolved period.
 * Hero identity fields (level, streaks) and achievements are lifetime;
 * progress, quests, timed quests, and history rollups respect `period`.
 */
export interface PeriodAnalytics {
  period: AnalyticsPeriod
  range: AnalyticsDateRange | null
  hero: HeroAnalytics
  quests: QuestAnalytics
  timedQuests: TimedQuestAnalytics
  punctuality: PunctualityAnalytics
  progress: ProgressAnalytics
  history: HistoryAnalytics
  achievements: AchievementAnalytics
  workouts: WorkoutAnalytics
  performance: PerformanceAnalytics
}
