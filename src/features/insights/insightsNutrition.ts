import { confidenceFromSampleSize } from '@/features/insights/insightsHelpers'
import type { NutritionAnalyticsInput } from '@/features/nutrition/nutritionAnalyticsInput'
import { getNutritionAnalytics } from '@/features/nutrition/nutritionAnalyticsLogic'
import { formatClockMinutes, MEAL_TYPE_LABELS } from '@/features/nutrition/nutritionPresentation'
import { REQUIRED_MEAL_TYPES } from '@/types/nutrition'
import type { MealType } from '@/types/nutrition'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { Insight } from '@/types/insights'

const STREAK_CALLOUT_THRESHOLD = 3
const MISSED_MEAL_RATE_THRESHOLD = 0.5
const MIN_DAYS_FOR_PATTERN = 3

/** A meal logged consistently later than this (minutes after midnight) reads as "delayed". */
const LATE_MEAL_THRESHOLD_MINUTES: Partial<Record<MealType, number>> = {
  breakfast: 9 * 60,
  lunch: 14 * 60,
  dinner: 20 * 60,
}

/**
 * Nutrition insights — interprets `getNutritionAnalytics` patterns into
 * informational (never coaching) cards: streaks, missed-meal patterns, and
 * meal-timing drift. Empty evidence yields an empty array, same convention
 * as `generateWorkoutInsights`.
 */
export function generateNutritionInsights(
  input: NutritionAnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const stats = getNutritionAnalytics(input, period)
  if (stats.mealsLogged === 0) return []

  const insights: Insight[] = []

  if (stats.currentProteinTargetStreak >= STREAK_CALLOUT_THRESHOLD) {
    const days = stats.currentProteinTargetStreak
    insights.push({
      id: `nutrition:proteinStreak:${period}`,
      type: 'nutritionProteinStreak',
      category: 'quest',
      title: 'Protein Target Streak',
      explanation: `Your protein target has been achieved ${days} day${days === 1 ? '' : 's'} in a row.`,
      metric: { label: 'Streak', value: `${days} days` },
      confidence: confidenceFromSampleSize(stats.daysTracked),
      severity: 'positive',
    })
  }

  if (stats.currentMealConsistencyStreak >= STREAK_CALLOUT_THRESHOLD) {
    const days = stats.currentMealConsistencyStreak
    insights.push({
      id: `nutrition:mealConsistencyStreak:${period}`,
      type: 'nutritionMealConsistency',
      category: 'quest',
      title: 'Meal Consistency Streak',
      explanation: `Breakfast, lunch, and dinner have all been logged ${days} day${days === 1 ? '' : 's'} in a row.`,
      metric: { label: 'Streak', value: `${days} days` },
      confidence: confidenceFromSampleSize(stats.daysTracked),
      severity: 'positive',
    })
  } else if (
    stats.daysTracked >= MIN_DAYS_FOR_PATTERN &&
    stats.mealConsistencyRate !== null &&
    stats.mealConsistencyRate < MISSED_MEAL_RATE_THRESHOLD
  ) {
    insights.push({
      id: `nutrition:mealConsistencyLow:${period}`,
      type: 'nutritionMealConsistency',
      category: 'quest',
      title: 'Meal Consistency',
      explanation: 'Breakfast, lunch, and dinner are rarely all logged on the same day this period.',
      metric: {
        label: 'Full-meal days',
        value: `${Math.round(stats.mealConsistencyRate * 100)}%`,
      },
      confidence: confidenceFromSampleSize(stats.daysTracked),
      severity: 'attention',
    })
  }

  if (stats.daysTracked >= MIN_DAYS_FOR_PATTERN) {
    for (const mealType of REQUIRED_MEAL_TYPES) {
      const missed = stats.missedMealCounts[mealType]
      const rate = missed / stats.daysTracked
      if (rate < MISSED_MEAL_RATE_THRESHOLD) continue

      const label = MEAL_TYPE_LABELS[mealType]
      insights.push({
        id: `nutrition:missedMeal:${mealType}:${period}`,
        type: 'nutritionMissedMeal',
        category: 'quest',
        title: `${label} Consistency`,
        explanation: `You consistently miss ${label.toLowerCase()} — logged on only ${stats.daysTracked - missed} of ${stats.daysTracked} tracked days.`,
        metric: {
          label: 'Missed',
          value: `${missed}/${stats.daysTracked} days`,
        },
        subject: label,
        confidence: confidenceFromSampleSize(stats.daysTracked),
        severity: 'attention',
      })
    }
  }

  for (const [mealType, threshold] of Object.entries(LATE_MEAL_THRESHOLD_MINUTES) as [
    MealType,
    number,
  ][]) {
    const averageMinutes = stats.averageMealTimeMinutes[mealType]
    if (averageMinutes == null || averageMinutes <= threshold) continue

    const label = MEAL_TYPE_LABELS[mealType]
    insights.push({
      id: `nutrition:mealTiming:${mealType}:${period}`,
      type: 'nutritionMealTiming',
      category: 'quest',
      title: `${label} Timing`,
      explanation: `${label} is frequently delayed — averaging ${formatClockMinutes(averageMinutes)}.`,
      metric: { label: 'Average time', value: formatClockMinutes(averageMinutes) },
      subject: label,
      confidence: confidenceFromSampleSize(stats.daysTracked),
      severity: 'attention',
    })
  }

  return insights
}
