import { formatRatePercent } from '@/features/analytics/analyticsPresentationFormat'
import { formatPrTypeLabel } from '@/features/performance/prPresentation'
import {
  CONFIDENCE_LABELS,
  formatRecommendationHeadline,
  formatRecommendationKind,
  formatRecommendationSummary,
} from '@/features/progression/progressionPresentation'
import type { ExerciseAnalyticsStats, ExerciseTrend } from '@/features/workoutAnalytics/exerciseAnalyticsLogic'
import type { TrainingDistribution } from '@/features/workoutAnalytics/trainingDistributionLogic'
import type { WorkoutCoachingSummary } from '@/features/workoutAnalytics/workoutCoachingSummaryLogic'
import type { WorkoutDashboardOverview } from '@/features/workoutAnalytics/workoutDashboardLogic'
import type { WorkoutPrAnalytics } from '@/features/workoutAnalytics/prAnalyticsLogic'
import type { WorkoutTemplateAnalyticsStats } from '@/features/workoutAnalytics/workoutTemplateAnalyticsLogic'
import type { CoachingRecommendation } from '@/types/progression'
import type {
  AnalyticsDomainInsight,
  AnalyticsDomainOverviewMetric,
  AnalyticsDomainRecommendationSummary,
} from '@/types/analyticsDomain'

export interface StatRow {
  id: string
  label: string
  value: string
  hint?: string
}

export function formatMinutes(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value)} min`
}

export function formatCount(value: number): string {
  return String(Math.round(value))
}

export function formatWeightValue(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 10) / 10} lb`
}

export function formatRepsValue(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 10) / 10} reps`
}

export function formatDurationSeconds(value: number | null): string {
  if (value == null) return '—'
  const minutes = Math.floor(value / 60)
  const seconds = Math.round(value % 60)
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatVolumeValue(value: number | null): string {
  if (value == null) return '—'
  return String(Math.round(value))
}

export function formatFrequency(value: number | null): string {
  if (value == null) return '—'
  return `${value}/wk`
}

export const TREND_LABELS: Record<ExerciseTrend, string> = {
  improving: 'Improving ↑',
  declining: 'Declining ↓',
  stable: 'Stable',
  insufficient_data: 'Not enough data',
}

export function formatDaysAgo(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

// ── Overview (Workout Dashboard) ────────────────────────────────────────

export function buildWorkoutDashboardOverviewMetrics(
  overview: WorkoutDashboardOverview,
): AnalyticsDomainOverviewMetric[] {
  return [
    {
      id: 'trainingStreak',
      label: 'Training Streak',
      value: `${overview.currentTrainingStreak} day${overview.currentTrainingStreak === 1 ? '' : 's'}`,
    },
    { id: 'workoutsCompleted', label: 'Workouts Completed', value: formatCount(overview.workoutsCompleted) },
    { id: 'avgDuration', label: 'Avg Duration', value: formatMinutes(overview.averageDurationMinutes) },
    { id: 'totalDuration', label: 'Total Time', value: formatMinutes(overview.totalDurationMinutes) },
    { id: 'totalExercises', label: 'Exercises Completed', value: formatCount(overview.totalExercises) },
    { id: 'totalSets', label: 'Sets Completed', value: formatCount(overview.totalSets) },
    { id: 'frequency', label: 'Training Frequency', value: formatFrequency(overview.workoutFrequencyPerWeek) },
    { id: 'completionRate', label: 'Completion Rate', value: formatRatePercent(overview.completionRate) },
  ]
}

// ── Exercise Analytics ───────────────────────────────────────────────────

export function buildExerciseStatRows(stats: ExerciseAnalyticsStats): StatRow[] {
  const rows: StatRow[] = [
    { id: 'timesPerformed', label: 'Times Performed', value: formatCount(stats.timesPerformed) },
    { id: 'totalSets', label: 'Total Sets', value: formatCount(stats.totalSets) },
    { id: 'totalReps', label: 'Total Reps', value: formatCount(stats.totalReps) },
    { id: 'avgWeight', label: 'Average Weight', value: formatWeightValue(stats.averageWeight) },
    { id: 'avgReps', label: 'Average Reps', value: formatRepsValue(stats.averageReps) },
    { id: 'avgDuration', label: 'Average Duration', value: formatDurationSeconds(stats.averageDurationSeconds) },
    { id: 'avgVolume', label: 'Average Volume', value: formatVolumeValue(stats.averageVolume) },
    { id: 'trend', label: 'Recent Trend', value: TREND_LABELS[stats.recentTrend] },
    {
      id: 'bestSession',
      label: 'Best Session',
      value: stats.bestSession?.display ?? '—',
      hint: stats.bestSession ? stats.bestSession.heroDayKey : undefined,
    },
    {
      id: 'officialPr',
      label: 'Official PR',
      value: stats.officialPr
        ? `${stats.officialPr.displayValue} (${formatPrTypeLabel(stats.officialPr.prType)})`
        : 'Not yet established',
    },
    { id: 'frequency', label: 'Training Frequency', value: formatFrequency(stats.trainingFrequencyPerWeek) },
  ]

  if (stats.currentRecommendation) {
    rows.push({
      id: 'recommendation',
      label: 'Current Recommendation',
      value: formatRecommendationHeadline(stats.currentRecommendation),
      hint: stats.currentRecommendation.message,
    })
  }

  return rows
}

// ── Workout Template Analytics ──────────────────────────────────────────

export function buildWorkoutTemplateStatRows(
  stats: WorkoutTemplateAnalyticsStats,
): StatRow[] {
  const rows: StatRow[] = [
    { id: 'timesCompleted', label: 'Times Completed', value: formatCount(stats.timesCompleted) },
    { id: 'completionRate', label: 'Completion Rate', value: formatRatePercent(stats.completionRate) },
    { id: 'avgDuration', label: 'Average Duration', value: formatMinutes(stats.averageDurationMinutes) },
    { id: 'avgVolume', label: 'Average Volume', value: formatVolumeValue(stats.averageVolume) },
    { id: 'frequency', label: 'Training Frequency', value: formatFrequency(stats.trainingFrequencyPerWeek) },
    {
      id: 'mostDifficultSection',
      label: 'Most Difficult Section',
      value: stats.mostDifficultSection
        ? `${stats.mostDifficultSection.sectionName} (${formatRatePercent(stats.mostDifficultSection.completionRate)})`
        : '—',
    },
    {
      id: 'mostSkippedExercise',
      label: 'Most Skipped Exercise',
      value: stats.mostSkippedExercise
        ? `${stats.mostSkippedExercise.exerciseName} (${formatRatePercent(stats.mostSkippedExercise.skipRate)} skipped)`
        : '—',
    },
  ]

  if (stats.currentRecommendation) {
    rows.push({
      id: 'recommendation',
      label: 'Current Recommendation',
      value: formatRecommendationHeadline(stats.currentRecommendation),
      hint: stats.currentRecommendation.message,
    })
  }

  return rows
}

// ── PR Analytics ─────────────────────────────────────────────────────────

export function buildPrStatRows(pr: WorkoutPrAnalytics): StatRow[] {
  return [
    { id: 'currentPrs', label: 'Current Official PRs', value: formatCount(pr.currentOfficialPrs.length) },
    { id: 'totalEarned', label: 'PRs Earned (Period)', value: formatCount(pr.totalPrsEarned) },
    { id: 'frequency', label: 'PR Frequency', value: pr.prFrequencyPerMonth != null ? `${pr.prFrequencyPerMonth}/mo` : '—' },
    {
      id: 'longestStanding',
      label: 'Longest Standing PR',
      value: pr.longestStandingPr
        ? `${pr.longestStandingPr.exerciseName} (${formatDaysAgo(pr.longestStandingPr.daysStanding)})`
        : '—',
    },
    {
      id: 'mostImproved',
      label: 'Most Improved Exercise',
      value: pr.mostImprovedExercises[0]
        ? `${pr.mostImprovedExercises[0].exerciseName} (+${pr.mostImprovedExercises[0].improvement})`
        : '—',
    },
  ]
}

// ── Distribution ─────────────────────────────────────────────────────────

export function distributionToPercentRows(
  buckets: TrainingDistribution['byFamily'],
): { id: string; label: string; percent: number }[] {
  return buckets.map((b) => ({ id: b.id, label: b.label, percent: b.percent }))
}

// ── Insights ───────────────────────────────────────────────────────────

export function buildWorkoutAnalyticsInsights(input: {
  prAnalytics: WorkoutPrAnalytics
  distribution: TrainingDistribution
  coachingSummary: WorkoutCoachingSummary
}): AnalyticsDomainInsight[] {
  const insights: AnalyticsDomainInsight[] = []
  const { prAnalytics, distribution, coachingSummary } = input

  const mostImproved = prAnalytics.mostImprovedExercises[0]
  if (mostImproved) {
    insights.push({
      id: 'most-improved',
      label: 'Most improved exercise',
      detail: `${mostImproved.exerciseName} improved by ${mostImproved.improvement} (${formatPrTypeLabel(mostImproved.prType)}).`,
    })
  }

  if (prAnalytics.longestStandingPr) {
    insights.push({
      id: 'longest-standing-pr',
      label: 'Longest standing PR',
      detail: `${prAnalytics.longestStandingPr.exerciseName} has held its record for ${prAnalytics.longestStandingPr.daysStanding} days.`,
    })
  }

  const topFamily = distribution.byFamily[0]
  if (topFamily) {
    insights.push({
      id: 'top-family',
      label: 'Most trained exercise family',
      detail: `${topFamily.label} accounts for ${topFamily.percent}% of completed sets.`,
    })
  }

  const topCategory = distribution.byWorkoutCategory[0]
  if (topCategory) {
    insights.push({
      id: 'top-category',
      label: 'Most trained workout',
      detail: `${topCategory.label} accounts for ${topCategory.percent}% of workouts in this period.`,
    })
  }

  const topKind = coachingSummary.mostFrequentKinds[0]
  if (topKind) {
    insights.push({
      id: 'top-recommendation-kind',
      label: 'Most common recommendation',
      detail: `${formatRecommendationKind(topKind.kind)} appeared ${topKind.count} time${topKind.count === 1 ? '' : 's'} in your coaching history.`,
    })
  }

  return insights
}

// ── Recommendations (Coaching Integration) ───────────────────────────────

function recommendationToSummary(
  rec: CoachingRecommendation,
): AnalyticsDomainRecommendationSummary {
  return {
    id: rec.id,
    title: formatRecommendationHeadline(rec),
    message: formatRecommendationSummary(rec),
    confidenceLabel: CONFIDENCE_LABELS[rec.confidence],
  }
}

export function buildWorkoutAnalyticsRecommendations(
  coachingSummary: WorkoutCoachingSummary,
): AnalyticsDomainRecommendationSummary[] {
  const byId = new Map<string, AnalyticsDomainRecommendationSummary>()

  for (const rec of coachingSummary.highConfidenceRecommendations) {
    byId.set(rec.id, recommendationToSummary(rec))
  }
  for (const rec of coachingSummary.readyForAssessment) {
    byId.set(rec.id, recommendationToSummary(rec))
  }
  for (const suggestion of coachingSummary.trainingImbalanceSuggestions) {
    byId.set(suggestion.id, {
      id: suggestion.id,
      title: suggestion.label,
      message: suggestion.detail,
    })
  }

  return [...byId.values()]
}
