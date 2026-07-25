import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import { generateNutritionInsights } from '@/features/insights/insightsNutrition'
import { generateQuestInsights } from '@/features/insights/insightsQuest'
import { generateRoutineInsights } from '@/features/insights/insightsRoutine'
import { generateTrendInsights } from '@/features/insights/insightsTrends'
import { generateWorkoutInsights } from '@/features/insights/insightsWorkout'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { PeriodInsights } from '@/types/insights'

/**
 * Insights Engine — interprets Analytics / History patterns into
 * behavioral Insight cards. Never mutates state. Never coaches or recommends.
 *
 * Architecture:
 *   Events → History → Snapshots → Analytics Engine → Insights Engine → UI
 *
 * Routine insights call `getQuestAnalytics` (Analytics Engine).
 * Trend insights prefer History snapshots. Quest insights enrich with
 * per-quest event profiles that Analytics does not expose as scalars.
 */
export function generateInsightsForPeriod(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): PeriodInsights {
  return {
    period,
    generatedAt: input.now.toISOString(),
    quest: [
      ...generateQuestInsights(input, period),
      ...generateWorkoutInsights(input, period),
      ...generateNutritionInsights(input, period),
    ],
    routine: generateRoutineInsights(input, period),
    trends: generateTrendInsights(input, period),
  }
}

export function generateFullInsights(input: AnalyticsInput): {
  today: PeriodInsights
  last7: PeriodInsights
  last30: PeriodInsights
  last90: PeriodInsights
  last180: PeriodInsights
  last365: PeriodInsights
} {
  return {
    today: generateInsightsForPeriod(input, 'today'),
    last7: generateInsightsForPeriod(input, 'last7'),
    last30: generateInsightsForPeriod(input, 'last30'),
    last90: generateInsightsForPeriod(input, 'last90'),
    last180: generateInsightsForPeriod(input, 'last180'),
    last365: generateInsightsForPeriod(input, 'last365'),
  }
}

export function countInsights(bundle: PeriodInsights): number {
  return bundle.quest.length + bundle.routine.length + bundle.trends.length
}

export {
  generateQuestInsights,
  generateRoutineInsights,
  generateTrendInsights,
}
