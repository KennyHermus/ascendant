import { useState } from 'react'

import { Accordion } from '@/components/Accordion'
import { AnalyticsPeriodFilter } from '@/features/analytics/AnalyticsPeriodFilter'
import { SectionPanel } from '@/features/analytics/components/SectionPanel'
import { InsightCard } from '@/features/insights/components/InsightCard'
import { useInsightsDashboardModel } from '@/features/insights/insightsSelectors'
import type { AnalyticsPeriod } from '@/types/analytics'

/**
 * Presentation-only Insights Dashboard.
 * Renders interpretation cards from the Insights Engine — no Engine math here.
 */
export function InsightsDashboard() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('week')
  const model = useInsightsDashboardModel(period)

  return (
    <SectionPanel
      title="Insights"
      titleClassName="text-teal-400/90"
      titleAside={
        <span className="text-[10px] font-normal tracking-normal text-stone-500">
          {model.totalCount} pattern{model.totalCount === 1 ? '' : 's'}
        </span>
      }
    >
      <div className="mb-4">
        <AnalyticsPeriodFilter value={period} onChange={setPeriod} />
      </div>

      {model.empty ? (
        <p className="text-sm text-stone-400">
          Not enough history yet to surface behavioral patterns. Complete quests
          and advance days — Insights interpret Analytics and History, they do
          not invent advice.
        </p>
      ) : (
        <div className="space-y-4">
          {model.sections.map((section) => (
            <Accordion
              key={section.id}
              title={section.title}
              meta={`${section.insights.length}`}
              defaultExpanded={section.id === 'trend' || section.id === 'routine'}
              persistKey={`insights:${section.id}`}
              variant="subcategory"
            >
              <div className="space-y-3">
                {section.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </Accordion>
          ))}
        </div>
      )}
    </SectionPanel>
  )
}
