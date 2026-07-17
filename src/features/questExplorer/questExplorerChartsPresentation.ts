import type { QuestChartBundle } from '@/features/questExplorer/questChartSelectors'

/** Counts charts that would render for the current bundle (presentation only). */
export function countQuestExplorerCharts(bundle: QuestChartBundle | null): number {
  if (!bundle) return 0

  const hasAttempts =
    bundle.completionTimeline.points.length > 0 ||
    bundle.completionVsMiss.missed.points.some((p) => p.value > 0)

  if (!hasAttempts) return 0

  let count = 1
  if (bundle.completionVsMiss.missed.points.some((p) => p.value > 0)) count += 1
  if (bundle.completionTimeline.points.length > 0) count += 1
  if (bundle.completionRateTrend.points.length >= 2) count += 1
  if (bundle.completionTimeTrend.points.length > 0) count += 1
  if (
    bundle.isTimed &&
    bundle.punctualityDistribution.points.some((p) => p.value > 0)
  ) {
    count += 1
  }

  return count
}
