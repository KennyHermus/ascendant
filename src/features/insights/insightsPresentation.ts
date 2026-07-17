import type { AnalyticsPeriod } from '@/types/analytics'
import type {
  Insight,
  InsightCategory,
  InsightSeverity,
  PeriodInsights,
} from '@/types/insights'
import { flattenPeriodInsights } from '@/types/insights'

export const INSIGHT_CATEGORY_LABELS: Record<InsightCategory, string> = {
  quest: 'Quest Insights',
  routine: 'Routine Insights',
  trend: 'Behavior Trends',
}

export const INSIGHT_SEVERITY_STYLES: Record<
  InsightSeverity,
  { border: string; badge: string; label: string }
> = {
  positive: {
    border: 'border-emerald-800/40',
    badge: 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40',
    label: 'Strength',
  },
  neutral: {
    border: 'border-stone-700/40',
    badge: 'bg-stone-900/50 text-stone-400 border-stone-700/40',
    label: 'Pattern',
  },
  attention: {
    border: 'border-amber-800/40',
    badge: 'bg-amber-950/50 text-amber-300 border-amber-800/40',
    label: 'Watch',
  },
}

export interface InsightsSectionModel {
  id: InsightCategory
  title: string
  insights: Insight[]
}

export interface InsightsDashboardModel {
  period: AnalyticsPeriod
  generatedAt: string
  totalCount: number
  sections: InsightsSectionModel[]
  empty: boolean
}

/** Presentation DTO — UI renders this only; no Engine math in JSX. */
export function buildInsightsDashboardModel(
  bundle: PeriodInsights,
): InsightsDashboardModel {
  const sections: InsightsSectionModel[] = (
    ['quest', 'routine', 'trend'] as const
  )
    .map((id) => ({
      id,
      title: INSIGHT_CATEGORY_LABELS[id],
      insights: bundle[id === 'trend' ? 'trends' : id],
    }))
    .filter((section) => section.insights.length > 0)

  const all = flattenPeriodInsights(bundle)

  return {
    period: bundle.period,
    generatedAt: bundle.generatedAt,
    totalCount: all.length,
    sections,
    empty: all.length === 0,
  }
}
