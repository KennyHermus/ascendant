import { filterSnapshotsForPeriod, resolvePeriodRange } from '@/features/analytics/analyticsPeriods'
import {
  buildGoldSeries,
  buildLevelSeries,
  buildQuestCompletedSeries,
  buildQuestCompletionSeries,
  buildQuestMissedSeries,
  buildStatSeries,
  buildXpSeries,
  type ChartSeries,
} from '@/features/analytics/analyticsSeries'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import type { AnalyticsPeriod } from '@/types/analytics'
import { STAT_KEYS, type StatKey } from '@/types/hero'

/** Named chart series for one analytics period — built from filtered snapshots only. */
export interface PeriodChartBundle {
  period: AnalyticsPeriod
  level: ChartSeries
  xp: ChartSeries
  gold: ChartSeries
  questCompletion: ChartSeries
  questsCompleted: ChartSeries
  questsMissed: ChartSeries
  statSeries: (stat: StatKey) => ChartSeries
}

/**
 * filterSnapshotsForPeriod → series builders → ChartSeries bundle.
 * Pure — no React, no snapshot reads from components.
 */
export function buildPeriodChartBundle(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): PeriodChartBundle {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)

  return {
    period,
    level: buildLevelSeries(snapshots),
    xp: buildXpSeries(snapshots),
    gold: buildGoldSeries(snapshots),
    questCompletion: buildQuestCompletionSeries(snapshots),
    questsCompleted: buildQuestCompletedSeries(snapshots),
    questsMissed: buildQuestMissedSeries(snapshots),
    statSeries: (stat: StatKey) => buildStatSeries(snapshots, stat),
  }
}

/** Flat list of all series in a bundle (DevTools / debugging). */
export function flattenPeriodChartBundle(
  bundle: PeriodChartBundle,
): ChartSeries[] {
  return [
    bundle.level,
    bundle.xp,
    bundle.gold,
    bundle.questCompletion,
    bundle.questsCompleted,
    bundle.questsMissed,
    ...STAT_KEYS.map((stat) => bundle.statSeries(stat)),
  ]
}
