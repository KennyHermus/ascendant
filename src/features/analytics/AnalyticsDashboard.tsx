import { useMemo, useState } from 'react'

import { Accordion } from '@/components/Accordion'
import { AnalyticsCharts } from '@/features/analytics/AnalyticsCharts'
import { AnalyticsPeriodFilter } from '@/features/analytics/AnalyticsPeriodFilter'
import {
  ANALYTICS_CHART_COUNT,
  countStatisticsMetrics,
} from '@/features/analytics/analyticsDashboardPresentation'
import { useAnalyticsDashboardModel } from '@/features/analytics/analyticsSelectors'
import { CompletionBar } from '@/features/analytics/components/CompletionBar'
import { MetricGrid } from '@/features/analytics/components/MetricGrid'
import { ProgressCard } from '@/features/analytics/components/ProgressCard'
import { SectionPanel } from '@/features/analytics/components/SectionPanel'
import { StatisticCard } from '@/features/analytics/components/StatisticCard'
import type { AnalyticsPeriod } from '@/types/analytics'

interface AnalyticsDashboardProps {
  onDaySelect?: (date: string) => void
}

/**
 * Presentation-only Analytics Dashboard.
 * Section membership and period visibility come from the metric registry
 * via `useAnalyticsDashboardModel` — components only render the model.
 */
export function AnalyticsDashboard({ onDaySelect }: AnalyticsDashboardProps = {}) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('week')
  const model = useAnalyticsDashboardModel(period)
  const statisticsCount = useMemo(() => countStatisticsMetrics(model), [model])

  return (
    <SectionPanel
      title="Analytics"
      titleAside={
        <span className="text-[10px] font-normal tracking-normal text-stone-500">
          {model.periodLabel}
        </span>
      }
    >
      <div className="mb-4">
        <AnalyticsPeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="space-y-4">
        <Accordion
          title="Statistics"
          meta={`${statisticsCount} metric${statisticsCount === 1 ? '' : 's'}`}
          defaultExpanded
          persistKey="analytics:statistics"
          variant="subcategory"
        >
          <div className="space-y-4">
            {model.sections.map((section) => (
              <Accordion
                key={section.id}
                title={section.title}
                defaultExpanded={
                  section.id === 'hero' || section.id === 'questPerformance'
                }
                persistKey={`analytics:${section.id}`}
                variant="subcategory"
              >
                {section.metrics.length > 0 && (
                  <MetricGrid columns={section.id === 'achievements' ? 3 : 2}>
                    {section.metrics.map((metric) => (
                      <StatisticCard
                        key={metric.id}
                        label={metric.label}
                        value={metric.value}
                        hint={metric.hint}
                      />
                    ))}
                  </MetricGrid>
                )}

                {section.attemptRows.length > 0 && (
                  <div className="space-y-2">
                    {section.attemptRows.map((row) => (
                      <ProgressCard
                        key={row.id}
                        row={row}
                        color={
                          section.id === 'subcategories' ? 'emerald' : 'sky'
                        }
                      />
                    ))}
                  </div>
                )}

                {section.achievementPercent !== undefined && (
                  <div
                    className={section.metrics.length > 0 ? 'mt-3' : undefined}
                  >
                    <CompletionBar
                      percent={section.achievementPercent}
                      label="Achievement completion"
                      color="amber"
                    />
                  </div>
                )}
              </Accordion>
            ))}
          </div>
        </Accordion>

        <Accordion
          title="Visualizations"
          meta={`${ANALYTICS_CHART_COUNT} charts`}
          defaultExpanded
          persistKey="analytics:visualizations"
          variant="subcategory"
        >
          <AnalyticsCharts period={period} onDaySelect={onDaySelect} />
        </Accordion>
      </div>
    </SectionPanel>
  )
}
