import type { AnalyticsPeriod } from '@/types/analytics'

/**
 * Insight kinds — interpretations of Analytics / History patterns.
 * Additive: new kinds get a union member + a generator branch.
 */
export const INSIGHT_TYPES = [
  // Quest
  'mostCompletedQuest',
  'mostMissedQuest',
  'highestCompletionRate',
  'lowestCompletionRate',
  'mostImprovedQuest',
  'mostDecliningQuest',
  'mostCommonStreakBreaker',
  'mostMissedTimedQuest',
  'averageTimedCompletionOffset',
  'lateButSuccessful',
  'mostFrequentlyLate',
  'improvingPunctuality',
  'decliningPunctuality',
  'consistentlyEarly',
  'consistentlyInGrace',
  'workoutVolume',
  // Routine
  'strongestRoutine',
  'weakestRoutine',
  'routineCompletion',
  'weeklyCategoryCompletion',
  // Trends
  'completionImproving',
  'completionDeclining',
  'missFrequencyIncreasing',
  'missFrequencyDecreasing',
  'mostProductiveWeekday',
  'leastProductiveWeekday',
  'bestPerformingWeek',
] as const

export type InsightType = (typeof INSIGHT_TYPES)[number]

export const INSIGHT_CATEGORIES = ['quest', 'routine', 'trend'] as const
export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number]

export const INSIGHT_SEVERITIES = ['positive', 'neutral', 'attention'] as const
export type InsightSeverity = (typeof INSIGHT_SEVERITIES)[number]

export const INSIGHT_CONFIDENCE_LEVELS = ['low', 'medium', 'high'] as const
export type InsightConfidence = (typeof INSIGHT_CONFIDENCE_LEVELS)[number]

export interface InsightMetric {
  label: string
  value: string
}

/**
 * A single behavioral insight — interpretation, not a raw statistic.
 * Analytics compute numbers; Insights narrate patterns.
 */
export interface Insight {
  id: string
  type: InsightType
  category: InsightCategory
  title: string
  explanation: string
  metric: InsightMetric
  confidence?: InsightConfidence
  severity?: InsightSeverity
  /** Quest name, routine name, weekday, etc. */
  subject?: string
}

/**
 * Full insights bundle for one analytics period.
 * Empty arrays when there is insufficient evidence — never invent coaching.
 */
export interface PeriodInsights {
  period: AnalyticsPeriod
  generatedAt: string
  quest: Insight[]
  routine: Insight[]
  trends: Insight[]
}

export function flattenPeriodInsights(bundle: PeriodInsights): Insight[] {
  return [...bundle.quest, ...bundle.routine, ...bundle.trends]
}
