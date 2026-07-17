import { useMemo } from 'react'

import { Accordion } from '@/components/Accordion'
import { AnalyticsPeriodFilter } from '@/features/analytics/AnalyticsPeriodFilter'
import { MetricGrid } from '@/features/analytics/components/MetricGrid'
import { SectionPanel } from '@/features/analytics/components/SectionPanel'
import { StatisticCard } from '@/features/analytics/components/StatisticCard'
import { QuestExplorerCharts } from '@/features/questExplorer/QuestExplorerCharts'
import { countQuestExplorerCharts } from '@/features/questExplorer/questExplorerChartsPresentation'
import { buildQuestStatRows } from '@/features/questExplorer/questExplorerPresentation'
import {
  useQuestChartBundle,
  useQuestExplorerState,
  useQuestPerformanceStats,
} from '@/features/questExplorer/questExplorerSelectors'

interface QuestExplorerPanelProps {
  onDaySelect?: (date: string) => void
}

/**
 * Dedicated Quest Explorer — per-quest historical performance and charts.
 * Separate from the Hero Timeline; reads from `questHistory` via analytics input.
 */
export function QuestExplorerPanel({ onDaySelect }: QuestExplorerPanelProps = {}) {
  const {
    period,
    setPeriod,
    query,
    setQuery,
    selectedQuestId,
    selectQuest,
    selectedDefinition,
    allEntries,
    filteredEntries,
  } = useQuestExplorerState()

  const stats = useQuestPerformanceStats(selectedQuestId, period)
  const chartBundle = useQuestChartBundle(selectedQuestId, period)
  const statRows = useMemo(
    () => (stats ? buildQuestStatRows(stats, selectedDefinition) : []),
    [stats, selectedDefinition],
  )
  const chartCount = useMemo(() => countQuestExplorerCharts(chartBundle), [chartBundle])

  const showSearchResults = query.trim().length > 0

  return (
    <SectionPanel title="Quest Explorer">
      <div className="mb-4 space-y-3">
        <AnalyticsPeriodFilter value={period} onChange={setPeriod} />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search quests…"
          className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600"
        />

        {showSearchResults && (
          <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-stone-700/50 bg-stone-950/60 p-1">
            {filteredEntries.length === 0 ? (
              <li className="px-2 py-1.5 text-sm text-stone-500">No matches</li>
            ) : (
              filteredEntries.map((entry) => (
                <li key={entry.definition.id}>
                  <button
                    type="button"
                    onClick={() => selectQuest(entry.definition.id)}
                    className={`w-full rounded px-2 py-1.5 text-left text-sm transition ${
                      entry.definition.id === selectedQuestId
                        ? 'bg-violet-900/40 text-violet-200'
                        : 'text-stone-200 hover:bg-stone-800/60'
                    }`}
                  >
                    {entry.definition.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        <select
          value={selectedQuestId ?? ''}
          onChange={(e) => selectQuest(e.target.value)}
          className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-2 py-2 text-sm text-stone-200"
        >
          {allEntries.map((entry) => (
            <option key={entry.definition.id} value={entry.definition.id}>
              {entry.definition.name}
            </option>
          ))}
        </select>
      </div>

      {selectedDefinition && stats && selectedQuestId && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-stone-200">
              {selectedDefinition.name}
            </h3>
            <p className="text-xs text-stone-500">
              {selectedDefinition.timing
                ? `Timed · target ${selectedDefinition.timing.targetTime}`
                : 'Untimed quest'}
            </p>
          </div>

          <Accordion
            title="Statistics"
            meta={`${statRows.length} metric${statRows.length === 1 ? '' : 's'}`}
            defaultExpanded
            persistKey="questExplorer:statistics"
            variant="subcategory"
          >
            <MetricGrid columns={2}>
              {statRows.map((row) => (
                <StatisticCard
                  key={row.id}
                  label={row.label}
                  value={row.value}
                  hint={row.hint}
                />
              ))}
            </MetricGrid>
          </Accordion>

          <Accordion
            title="Visualizations"
            meta={
              chartCount > 0
                ? `${chartCount} chart${chartCount === 1 ? '' : 's'}`
                : 'No charts'
            }
            defaultExpanded
            persistKey="questExplorer:visualizations"
            variant="subcategory"
          >
            <QuestExplorerCharts
              questId={selectedQuestId}
              period={period}
              onDaySelect={onDaySelect}
            />
          </Accordion>
        </div>
      )}

      {showSearchResults && filteredEntries.length === 0 && !selectedDefinition && (
        <p className="text-sm text-stone-500">No quests match your search.</p>
      )}
    </SectionPanel>
  )
}
