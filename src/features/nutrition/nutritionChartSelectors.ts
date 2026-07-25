import { isDateInRange, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import type { ChartSeries } from '@/features/analytics/analyticsSeries'
import type { NutritionAnalyticsInput } from '@/features/nutrition/nutritionAnalyticsInput'
import { computeDailyTotals } from '@/features/nutrition/nutritionStatistics'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { MealActivity } from '@/types/nutrition'

/** Chart-ready trend series consumed by `TimeSeriesLineChart` / `TimeSeriesBarChart`. */
export interface NutritionChartBundle {
  proteinTrend: ChartSeries
  calorieTrend: ChartSeries
}

function filterActivitiesForPeriod(
  activities: MealActivity[],
  period: AnalyticsPeriod,
  input: NutritionAnalyticsInput,
): MealActivity[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  return activities.filter((activity) => isDateInRange(activity.heroDayKey, range))
}

export function buildNutritionChartBundle(
  input: NutritionAnalyticsInput,
  period: AnalyticsPeriod,
): NutritionChartBundle {
  const activities = filterActivitiesForPeriod(input.nutrition.activities, period, input)
  const dailyTotals = computeDailyTotals(activities)

  return {
    proteinTrend: {
      id: 'nutrition:proteinTrend',
      label: 'Protein (g)',
      points: dailyTotals.map((day) => ({
        date: day.heroDayKey,
        value: Math.round(day.totals.proteinGrams),
      })),
    },
    calorieTrend: {
      id: 'nutrition:calorieTrend',
      label: 'Calories',
      points: dailyTotals.map((day) => ({
        date: day.heroDayKey,
        value: Math.round(day.totals.calories),
      })),
    },
  }
}
