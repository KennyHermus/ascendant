import {
  ANALYTICS_PERIOD_LABELS,
  METRIC_SECTION_LABELS,
  attemptStatsToRow,
  getAttemptMetricsForPeriod,
  getMetricsForPeriod,
  type MetricSectionId,
} from '@/features/analytics/analyticsMetricRegistry'
import type { AnalyticsPeriod, PeriodAnalytics } from '@/types/analytics'

/** Presentation DTO — numbers already computed by the Engine; UI only renders. */
export interface DashboardMetric {
  id: string
  label: string
  value: string
  hint?: string
}

export interface DashboardAttemptRow {
  id: string
  label: string
  completed: number
  missed: number
  /** 0–100 for bars; null when no attempts. */
  percent: number | null
  percentLabel: string
}

export interface DashboardSection {
  id: MetricSectionId
  title: string
  metrics: DashboardMetric[]
  attemptRows: DashboardAttemptRow[]
  /** Achievements bar — only when achievements section is visible. */
  achievementPercent?: number
}

export interface AnalyticsDashboardModel {
  period: AnalyticsPeriod
  periodLabel: string
  sections: DashboardSection[]
}

const SECTION_ORDER: MetricSectionId[] = [
  'hero',
  'questPerformance',
  'punctuality',
  'categories',
  'subcategories',
  'achievements',
  'history',
]

/**
 * Maps Engine `PeriodAnalytics` into display sections via the metric registry.
 * Period visibility is decided by each metric's `supportedPeriods` — not by JSX.
 */
export function buildAnalyticsDashboardModel(
  analytics: PeriodAnalytics,
): AnalyticsDashboardModel {
  const { period } = analytics
  const sections: DashboardSection[] = []

  for (const sectionId of SECTION_ORDER) {
    if (sectionId === 'categories' || sectionId === 'subcategories') {
      const attemptDefs = getAttemptMetricsForPeriod(period, sectionId)
      if (attemptDefs.length === 0) continue
      sections.push({
        id: sectionId,
        title: METRIC_SECTION_LABELS[sectionId],
        metrics: [],
        attemptRows: attemptDefs.map((def) =>
          attemptStatsToRow(def.id, def.title, def.resolve(analytics)),
        ),
      })
      continue
    }

    const metricDefs = getMetricsForPeriod(period, sectionId)
    if (metricDefs.length === 0) continue

    const metrics: DashboardMetric[] = metricDefs.map((def) => {
      const resolved = def.resolve(analytics)
      return {
        id: def.id,
        label: def.title,
        value: resolved.value,
        hint: resolved.hint,
      }
    })

    sections.push({
      id: sectionId,
      title: METRIC_SECTION_LABELS[sectionId],
      metrics,
      attemptRows: [],
      achievementPercent:
        sectionId === 'achievements'
          ? analytics.achievements.unlockPercentage
          : undefined,
    })
  }

  return {
    period,
    periodLabel: ANALYTICS_PERIOD_LABELS[period],
    sections,
  }
}

export { ANALYTICS_PERIOD_LABELS } from '@/features/analytics/analyticsMetricRegistry'
export {
  formatRatePercent,
  rateToPercent,
} from '@/features/analytics/analyticsPresentationFormat'
