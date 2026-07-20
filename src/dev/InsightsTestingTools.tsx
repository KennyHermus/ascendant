import { useMemo, useState } from 'react'

import { ANALYTICS_PERIOD_LABELS } from '@/features/analytics/analyticsMetricRegistry'
import {
  countInsights,
  selectInsightsBundle,
} from '@/features/insights/insightsSelectors'
import { getCurrentGameTime } from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'
import { ANALYTICS_PERIODS, type AnalyticsPeriod } from '@/types/analytics'

/**
 * Developer-only Insights Engine inspector.
 * Read-only compute + DEV sample data seeding (history + events).
 */
export function InsightsTestingTools() {
  const hero = useGameStore((s) => s.hero)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const history = useGameStore((s) => s.history)
  const events = useGameStore((s) => s.events)
  const quests = useGameStore((s) => s.quests)
  const achievements = useGameStore((s) => s.achievements)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const questHistory = useGameStore((s) => s.questHistory)
  const workout = useGameStore((s) => s.workout)
  const performance = useGameStore((s) => s.performance)
  const devGenerateSampleInsightData = useGameStore(
    (s) => s.devGenerateSampleInsightData,
  )

  const [period, setPeriod] = useState<AnalyticsPeriod>('week')
  const [refreshToken, setRefreshToken] = useState(0)
  const [showRaw, setShowRaw] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const insights = useMemo(() => {
    void refreshToken
    return selectInsightsBundle(
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
        performance,
      },
      period,
      getCurrentGameTime(),
    )
  }, [
    refreshToken,
    period,
    hero,
    currentStreak,
    history,
    events,
    quests,
    achievements,
    dayStartHeroSnapshot,
    questHistory,
    workout,
    performance,
  ])

  const total = countInsights(insights)

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Insights Engine
      </p>
      <p className="mb-3 text-sm text-stone-400">
        Period: <span className="text-stone-200">{ANALYTICS_PERIOD_LABELS[period]}</span>
        {' · '}
        Insights: <span className="text-stone-200">{total}</span>
        {' · '}
        Quest {insights.quest.length} · Routine {insights.routine.length} · Trends{' '}
        {insights.trends.length}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {ANALYTICS_PERIODS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`rounded-md border px-2 py-0.5 text-[10px] ${
              period === p
                ? 'border-teal-600/60 bg-teal-950/50 text-teal-200'
                : 'border-stone-700/50 text-stone-500'
            }`}
          >
            {ANALYTICS_PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const result = devGenerateSampleInsightData(60)
            setRefreshToken((n) => n + 1)
            setNote(
              `Sample insight data: +${result.snapshotsAdded} snapshots, +${result.eventsAdded} events`,
            )
          }}
          className="rounded-md border border-teal-700/50 bg-teal-900/30 px-2.5 py-1 text-xs text-teal-200 transition hover:bg-teal-900/50"
        >
          Generate Sample Insight Data
        </button>
        <button
          type="button"
          onClick={() => {
            setRefreshToken((n) => n + 1)
            setNote(`Insights refreshed at ${getCurrentGameTime().toLocaleTimeString()}`)
          }}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          Refresh Insights
        </button>
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          {showRaw ? 'Hide Raw Insights' : 'View Raw Insights Object'}
        </button>
      </div>

      {note && <p className="mb-2 text-[11px] text-emerald-400/90">{note}</p>}

      {showRaw && (
        <pre className="max-h-64 overflow-auto rounded-md border border-stone-800/60 bg-stone-950/60 p-2 text-[10px] leading-relaxed text-stone-400">
          {JSON.stringify(insights, null, 2)}
        </pre>
      )}
    </div>
  )
}
