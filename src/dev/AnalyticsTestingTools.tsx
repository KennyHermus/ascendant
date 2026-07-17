import { useMemo, useState } from 'react'

import {
  getFullAnalytics,
  selectAnalyticsInput,
  useAnalyticsDiagnostics,
  useChartSeries,
} from '@/features/analytics/analyticsSelectors'
import { getCurrentGameTime } from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'

/**
 * Developer-only Analytics Engine + series inspector.
 * Read-only — never mutates game state. Buttons always show inline results
 * (not console-only placeholders).
 */
export function AnalyticsTestingTools() {
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)

  const { snapshotCount, eventCount } = useAnalyticsDiagnostics()
  const chartSeries = useChartSeries()
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
        Series: <span className="text-stone-200">{chartSeries.length}</span>
        {' · '}
        Level:{' '}
        <span className="text-stone-200">
          {analytics.lifetime.hero.currentLevel}
        </span>
        {' · '}
        XP today:{' '}
        <span className="text-stone-200">
          {analytics.today.progress.xpEarned}
        </span>
      </p>
      <p className="mb-3 text-[11px] text-stone-500">
        Verify: complete quests → advance simulated day → generate snapshot →
        refresh analytics / check Dashboard period filters.
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
              `Recomputed at ${getCurrentGameTime().toLocaleTimeString()} · ${snapshotCount} snapshots · ${eventCount} events · ${chartSeries.length} series`,
            )
          }}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          Refresh Analytics
        </button>
      </div>

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
            chartSeries.map((series) => ({
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
