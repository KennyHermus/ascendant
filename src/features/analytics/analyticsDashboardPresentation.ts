import type { AnalyticsDashboardModel } from '@/features/analytics/analyticsPresentation'

/** Counts scalar + attempt metrics shown in Statistics (presentation only). */
export function countStatisticsMetrics(model: AnalyticsDashboardModel): number {
  let count = 0
  for (const section of model.sections) {
    count += section.metrics.length
    count += section.attemptRows.length
    if (section.achievementPercent !== undefined) count += 1
  }
  return count
}

/** Fixed chart count for Analytics Visualizations section. */
export const ANALYTICS_CHART_COUNT = 7
