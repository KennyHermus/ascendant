import { useState } from 'react'

import { Accordion } from '@/components/Accordion'
import { usePeriodChartBundle } from '@/features/analytics/analyticsSelectors'
import { TimeSeriesBarChart } from '@/features/analytics/components/TimeSeriesBarChart'
import { TimeSeriesLineChart } from '@/features/analytics/components/TimeSeriesLineChart'
import { STAT_LABELS } from '@/features/hero/heroLogic'
import type { AnalyticsPeriod } from '@/types/analytics'
import { STAT_KEYS, type StatKey } from '@/types/hero'

interface AnalyticsChartsProps {
  period: AnalyticsPeriod
}

/**
 * Visualizations — consumes period-filtered ChartSeries only.
 * No snapshot reads or analytics math in this file.
 */
export function AnalyticsCharts({ period }: AnalyticsChartsProps) {
  const bundle = usePeriodChartBundle(period)
  const [selectedStat, setSelectedStat] = useState<StatKey>('strength')
  const statSeries = bundle.statSeries(selectedStat)

  return (
    <div className="mt-4 space-y-4 border-t border-stone-700/40 pt-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-violet-400/90">
        Visualizations
      </p>

      <Accordion
        title="Hero Progress"
        defaultExpanded={false}
        persistKey="analytics:charts:hero"
        variant="subcategory"
      >
        <div className="space-y-3">
          <TimeSeriesLineChart
            title="Level Over Time"
            series={bundle.level}
            color="amber"
          />
          <TimeSeriesBarChart title="XP Earned per Day" series={bundle.xp} color="amber" />
          <TimeSeriesBarChart title="Gold Earned per Day" series={bundle.gold} color="violet" />
        </div>
      </Accordion>

      <Accordion
        title="Quest Progress"
        defaultExpanded={false}
        persistKey="analytics:charts:quests"
        variant="subcategory"
      >
        <div className="space-y-3">
          <TimeSeriesLineChart
            title="Daily Completion"
            series={bundle.questCompletion}
            color="emerald"
            valueMode="percent"
            yDomain={[0, 100]}
          />
          <TimeSeriesBarChart
            title="Quests Completed per Day"
            series={bundle.questsCompleted}
            color="emerald"
          />
          <TimeSeriesBarChart
            title="Quests Missed per Day"
            series={bundle.questsMissed}
            color="rose"
          />
        </div>
      </Accordion>

      <Accordion
        title="Attribute Growth"
        defaultExpanded={false}
        persistKey="analytics:charts:stats"
        variant="subcategory"
      >
        <div className="mb-3">
          <label
            htmlFor="analytics-stat-select"
            className="mb-1 block text-[10px] uppercase tracking-wider text-stone-500"
          >
            Attribute
          </label>
          <select
            id="analytics-stat-select"
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value as StatKey)}
            className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-2 py-1.5 text-sm text-stone-200"
          >
            {STAT_KEYS.map((key) => (
              <option key={key} value={key}>
                {STAT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <TimeSeriesLineChart
          title={`${STAT_LABELS[selectedStat]} Over Time`}
          series={statSeries}
          color="sky"
        />
      </Accordion>
    </div>
  )
}
