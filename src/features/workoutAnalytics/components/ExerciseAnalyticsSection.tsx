import { useMemo } from 'react'

import { MetricGrid } from '@/features/analytics/components/MetricGrid'
import { StatisticCard } from '@/features/analytics/components/StatisticCard'
import { getExerciseRoles } from '@/data/exerciseRoles'
import { useExerciseAnalyticsDetail } from '@/features/workoutAnalytics/workoutAnalyticsSelectors'
import { buildExerciseStatRows } from '@/features/workoutAnalytics/workoutAnalyticsPresentation'
import type { ExerciseAnalyticsEntry } from '@/features/workoutAnalytics/exerciseAnalyticsLogic'
import type { AnalyticsPeriod } from '@/types/analytics'

interface ExerciseAnalyticsSectionProps {
  period: AnalyticsPeriod
  entries: ExerciseAnalyticsEntry[]
  filteredEntries: ExerciseAnalyticsEntry[]
  query: string
  onQueryChange: (query: string) => void
  selectedExerciseId: string | null
  onSelectExercise: (exerciseId: string) => void
}

const ROLE_BADGE_CLASSES = 'rounded border border-stone-700/50 bg-stone-900/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-stone-400'

export function ExerciseAnalyticsSection({
  period,
  entries,
  filteredEntries,
  query,
  onQueryChange,
  selectedExerciseId,
  onSelectExercise,
}: ExerciseAnalyticsSectionProps) {
  const selectedEntry = useMemo(
    () => entries.find((e) => e.exercise.id === selectedExerciseId) ?? null,
    [entries, selectedExerciseId],
  )
  const stats = useExerciseAnalyticsDetail(selectedExerciseId, period)
  const statRows = useMemo(() => (stats ? buildExerciseStatRows(stats) : []), [stats])
  const roles = selectedExerciseId ? getExerciseRoles(selectedExerciseId) : []
  const showSearchResults = query.trim().length > 0

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search exercises…"
        className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200 placeholder:text-stone-600"
      />

      {showSearchResults && (
        <ul className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-stone-700/50 bg-stone-950/60 p-1">
          {filteredEntries.length === 0 ? (
            <li className="px-2 py-1.5 text-sm text-stone-500">No matches</li>
          ) : (
            filteredEntries.map((entry) => (
              <li key={entry.exercise.id}>
                <button
                  type="button"
                  onClick={() => onSelectExercise(entry.exercise.id)}
                  className={`w-full rounded px-2 py-1.5 text-left text-sm transition ${
                    entry.exercise.id === selectedExerciseId
                      ? 'bg-violet-900/40 text-violet-200'
                      : 'text-stone-200 hover:bg-stone-800/60'
                  }`}
                >
                  {entry.exercise.name}
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <select
        value={selectedExerciseId ?? ''}
        onChange={(e) => onSelectExercise(e.target.value)}
        className="w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-2 py-2 text-sm text-stone-200"
      >
        {entries.map((entry) => (
          <option key={entry.exercise.id} value={entry.exercise.id}>
            {entry.exercise.name}
            {entry.stats.timesPerformed > 0 ? ` (${entry.stats.timesPerformed})` : ''}
          </option>
        ))}
      </select>

      {selectedEntry && stats && (
        <div className="space-y-3">
          <div>
            <h4 className="text-sm font-semibold text-stone-200">{selectedEntry.exercise.name}</h4>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {selectedEntry.familyName && (
                <span className={ROLE_BADGE_CLASSES}>{selectedEntry.familyName}</span>
              )}
              {roles.map((role) => (
                <span key={role} className={ROLE_BADGE_CLASSES}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          {stats.timesPerformed === 0 ? (
            <p className="text-xs text-stone-500">
              No training history for this exercise in the selected period.
            </p>
          ) : (
            <MetricGrid columns={2}>
              {statRows.map((row) => (
                <StatisticCard key={row.id} label={row.label} value={row.value} hint={row.hint} />
              ))}
            </MetricGrid>
          )}
        </div>
      )}
    </div>
  )
}
