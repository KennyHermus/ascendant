import type { ReactNode } from 'react'

import { Accordion } from '@/components/Accordion'
import { MetricGrid } from '@/features/analytics/components/MetricGrid'
import { SectionPanel } from '@/features/analytics/components/SectionPanel'
import { StatisticCard } from '@/features/analytics/components/StatisticCard'
import type {
  AnalyticsDomainInsight,
  AnalyticsDomainOverviewMetric,
  AnalyticsDomainRecommendationSummary,
} from '@/types/analyticsDomain'

interface AnalyticsDomainPanelProps {
  title: string
  periodLabel?: string
  /** Period filter / search / other controls rendered above Overview. */
  headerControls?: ReactNode
  overview: AnalyticsDomainOverviewMetric[]
  statistics: ReactNode
  statisticsMeta?: ReactNode
  visualizations: ReactNode
  visualizationsMeta?: ReactNode
  insights: AnalyticsDomainInsight[]
  recommendations: AnalyticsDomainRecommendationSummary[]
  /** Unique prefix for accordion expand/collapse persistence (e.g. `"workoutAnalytics"`). */
  persistKeyPrefix: string
}

/**
 * Shared UI chrome for an Analytics Domain (see `types/analyticsDomain.ts`).
 * Renders Overview → Statistics → Visualizations → Insights → Recommendations
 * consistently so future domains (Nutrition, Finance, Learning, Combat, ...)
 * get the same layout for free — domains only supply data + section content.
 */
export function AnalyticsDomainPanel({
  title,
  periodLabel,
  headerControls,
  overview,
  statistics,
  statisticsMeta,
  visualizations,
  visualizationsMeta,
  insights,
  recommendations,
  persistKeyPrefix,
}: AnalyticsDomainPanelProps) {
  return (
    <SectionPanel
      title={title}
      titleAside={
        periodLabel ? (
          <span className="text-[10px] font-normal tracking-normal text-stone-500">
            {periodLabel}
          </span>
        ) : undefined
      }
    >
      {headerControls && <div className="mb-4 space-y-3">{headerControls}</div>}

      <div className="space-y-4">
        {overview.length > 0 && (
          <MetricGrid columns={2}>
            {overview.map((metric) => (
              <StatisticCard
                key={metric.id}
                label={metric.label}
                value={metric.value}
                hint={metric.hint}
              />
            ))}
          </MetricGrid>
        )}

        <Accordion
          title="Statistics"
          meta={statisticsMeta}
          defaultExpanded
          persistKey={`${persistKeyPrefix}:statistics`}
          variant="subcategory"
        >
          {statistics}
        </Accordion>

        <Accordion
          title="Visualizations"
          meta={visualizationsMeta}
          defaultExpanded
          persistKey={`${persistKeyPrefix}:visualizations`}
          variant="subcategory"
        >
          {visualizations}
        </Accordion>

        <Accordion
          title="Insights"
          meta={`${insights.length} insight${insights.length === 1 ? '' : 's'}`}
          persistKey={`${persistKeyPrefix}:insights`}
          variant="subcategory"
        >
          {insights.length === 0 ? (
            <p className="text-xs text-stone-500">
              Not enough training history yet to surface insights.
            </p>
          ) : (
            <ul className="space-y-2">
              {insights.map((insight) => (
                <li
                  key={insight.id}
                  className="rounded-lg border border-stone-700/40 bg-stone-950/50 px-3 py-2.5"
                >
                  <p className="text-xs font-semibold text-stone-200">{insight.label}</p>
                  <p className="mt-0.5 text-xs text-stone-400">{insight.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </Accordion>

        <Accordion
          title="Recommendations"
          meta={`${recommendations.length} active`}
          persistKey={`${persistKeyPrefix}:recommendations`}
          variant="subcategory"
        >
          {recommendations.length === 0 ? (
            <p className="text-xs text-stone-500">
              No active coaching recommendations right now.
            </p>
          ) : (
            <ul className="space-y-2">
              {recommendations.map((rec) => (
                <li
                  key={rec.id}
                  className="rounded-lg border border-stone-700/40 bg-stone-950/50 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-200">{rec.title}</p>
                    {rec.confidenceLabel && (
                      <span className="shrink-0 text-[10px] text-stone-500">
                        {rec.confidenceLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-stone-400">{rec.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Accordion>
      </div>
    </SectionPanel>
  )
}
