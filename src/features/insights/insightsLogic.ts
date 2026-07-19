import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
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
    ],
    routine: generateRoutineInsights(input, period),
    trends: generateTrendInsights(input, period),
  }
}

export function generateFullInsights(input: AnalyticsInput): {
  today: PeriodInsights
  week: PeriodInsights
  month: PeriodInsights
  lifetime: PeriodInsights
} {
  return {
    today: generateInsightsForPeriod(input, 'today'),
    week: generateInsightsForPeriod(input, 'week'),
    month: generateInsightsForPeriod(input, 'month'),
    lifetime: generateInsightsForPeriod(input, 'lifetime'),
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
