import type { DailySnapshot } from '@/types/history'
import type { StatKey } from '@/types/hero'
import { STAT_KEYS } from '@/types/hero'
import { completionRate } from '@/features/analytics/analyticsHelpers'

/**
 * Chart-ready point. Future chart libraries map `date` → x and `value` → y.
 * No chart rendering lives here — builders only.
 */
export interface ChartSeriesPoint {
  date: string
  value: number
}

export interface ChartSeries {
  id: string
  label: string
  points: ChartSeriesPoint[]
}

function mapSnapshots(
  snapshots: readonly DailySnapshot[],
  value: (snapshot: DailySnapshot) => number,
): ChartSeriesPoint[] {
  return snapshots.map((snapshot) => ({
    date: snapshot.date,
    value: value(snapshot),
  }))
}

export function buildXpSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries {
  return {
    id: 'xpEarned',
    label: 'XP Earned',
    points: mapSnapshots(snapshots, (s) => s.xpEarned),
  }
}

export function buildGoldSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries {
  return {
    id: 'goldEarned',
    label: 'Gold Earned',
    points: mapSnapshots(snapshots, (s) => s.goldEarned),
  }
}

export function buildLevelSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries {
  return {
    id: 'level',
    label: 'Level',
    points: mapSnapshots(snapshots, (s) => s.level),
  }
}

export function buildStatSeries(
  snapshots: readonly DailySnapshot[],
  stat: StatKey,
): ChartSeries {
  return {
    id: `stat:${stat}`,
    label: stat,
    points: mapSnapshots(snapshots, (s) => s.stats[stat] ?? 0),
  }
}

/** All eight hero stats as separate series (same date axis). */
export function buildAllStatSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries[] {
  return STAT_KEYS.map((stat) => buildStatSeries(snapshots, stat))
}

export function buildQuestCompletedSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries {
  return {
    id: 'questsCompleted',
    label: 'Quests Completed',
    points: mapSnapshots(snapshots, (s) => s.questsCompleted),
  }
}

export function buildQuestMissedSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries {
  return {
    id: 'questsMissed',
    label: 'Quests Missed',
    points: mapSnapshots(snapshots, (s) => s.questsMissed),
  }
}

/** Daily completion rate in [0, 1]; days with no attempts are omitted. */
export function buildQuestCompletionSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries {
  return {
    id: 'questCompletionRate',
    label: 'Completion Rate',
    points: snapshots.flatMap((snapshot) => {
      const rate = completionRate(snapshot.questsCompleted, snapshot.questsMissed)
      if (rate === null) return []
      return [{ date: snapshot.date, value: rate }]
    }),
  }
}

/**
 * Bundle of series future Charts UI can log or plot.
 * Derived only from History snapshots — never from Daily Summary.
 */
export function buildAllChartSeries(
  snapshots: readonly DailySnapshot[],
): ChartSeries[] {
  return [
    buildXpSeries(snapshots),
    buildGoldSeries(snapshots),
    buildLevelSeries(snapshots),
    buildQuestCompletedSeries(snapshots),
    buildQuestMissedSeries(snapshots),
    buildQuestCompletionSeries(snapshots),
    ...buildAllStatSeries(snapshots),
  ]
}
