import { useMemo, useState } from 'react'

import { ANALYTICS_PERIOD_LABELS } from '@/features/analytics/analyticsMetricRegistry'
import {
  flattenPeriodChartBundle,
  getFullAnalytics,
  selectAnalyticsInput,
  useAnalyticsDiagnostics,
  usePeriodChartBundle,
} from '@/features/analytics/analyticsSelectors'
import { getCurrentGameTime } from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/types/analytics'

/**
 * Developer-only Analytics Engine + series inspector.
 * Read-only — never mutates game state.
 */
export function AnalyticsTestingTools() {
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)

  const { snapshotCount, eventCount } = useAnalyticsDiagnostics()
  const [seriesPeriod, setSeriesPeriod] = useState<AnalyticsPeriod>('week')
  const chartBundle = usePeriodChartBundle(seriesPeriod)
  const periodSeries = useMemo(
    () => flattenPeriodChartBundle(chartBundle),
    [chartBundle],
  )

  const [refreshToken, setRefreshToken] = useState(0)
  const [refreshNote, setRefreshNote] = useState<string | null>(null)
  const [panel, setPanel] = useState<'none' | 'analytics' | 'series'>('none')

  const analytics = useMemo(() => {
    void refreshToken
    const input = selectAnalyticsInput(
      {
        hero,
        currentStreak,
        history,
        events,
        quests,
        achievements,
        dayStartHeroSnapshot,
        questHistory,
        workout,
      },
      getCurrentGameTime(),
    )
    return getFullAnalytics(input)
  }, [
    refreshToken,
    hero,
    currentStreak,
    history,
    events,
    quests,
    achievements,
    dayStartHeroSnapshot,
    questHistory,
    workout,
  ])

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Analytics Engine
      </p>
      <p className="mb-3 text-sm text-stone-400">
        Snapshots: <span className="text-stone-200">{snapshotCount}</span>
        {' · '}
        Events: <span className="text-stone-200">{eventCount}</span>
        {' · '}
        Series ({ANALYTICS_PERIOD_LABELS[seriesPeriod]}):{' '}
        <span className="text-stone-200">{periodSeries.length}</span>
        {' · '}
        Level:{' '}
        <span className="text-stone-200">
          {analytics.lifetime.hero.currentLevel}
        </span>
      </p>
      <p className="mb-3 text-[11px] text-stone-500">
        Verify: complete quests → advance simulated day → generate snapshot →
        refresh → check charts / period-filtered series below.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            setPanel((current) =>
              current === 'analytics' ? 'none' : 'analytics',
            )
          }
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          {panel === 'analytics' ? 'Hide Analytics Object' : 'View Analytics Object'}
        </button>
        <button
          type="button"
          onClick={() =>
            setPanel((current) => (current === 'series' ? 'none' : 'series'))
          }
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          {panel === 'series' ? 'Hide Chart Series' : 'View Chart Series'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRefreshToken((n) => n + 1)
            setRefreshNote(
              `Recomputed at ${getCurrentGameTime().toLocaleTimeString()} · ${snapshotCount} snapshots · ${periodSeries.reduce((n, s) => n + s.points.length, 0)} points in ${ANALYTICS_PERIOD_LABELS[seriesPeriod]}`,
            )
          }}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          Refresh Analytics
        </button>
      </div>

      {panel === 'series' && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {ANALYTICS_PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSeriesPeriod(period)}
              className={`rounded-md border px-2 py-0.5 text-[10px] ${
                seriesPeriod === period
                  ? 'border-sky-600/60 bg-sky-950/50 text-sky-200'
                  : 'border-stone-700/50 text-stone-500'
              }`}
            >
              {ANALYTICS_PERIOD_LABELS[period]}
            </button>
          ))}
        </div>
      )}

      {refreshNote && (
        <p className="mb-2 text-[11px] text-emerald-400/90">{refreshNote}</p>
      )}

      {panel === 'analytics' && (
        <pre className="mb-2 max-h-64 overflow-auto rounded-md border border-stone-800/60 bg-stone-950/60 p-2 text-[10px] leading-relaxed text-stone-400">
          {JSON.stringify(analytics, null, 2)}
        </pre>
      )}

      {panel === 'series' && (
        <pre className="max-h-64 overflow-auto rounded-md border border-stone-800/60 bg-stone-950/60 p-2 text-[10px] leading-relaxed text-stone-400">
          {JSON.stringify(
            periodSeries.map((series) => ({
              id: series.id,
              label: series.label,
              pointCount: series.points.length,
              points: series.points,
            })),
            null,
            2,
          )}
        </pre>
      )}
    </div>
  )
}
