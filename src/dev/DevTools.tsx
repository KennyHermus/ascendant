import { useState, useSyncExternalStore } from 'react'

import { UNLOCK_DEFINITIONS } from '@/data/unlocks'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { AchievementTestingTools } from '@/dev/AchievementTestingTools'
import { AnalyticsTestingTools } from '@/dev/AnalyticsTestingTools'
import { DEV_XP_TEST_AMOUNT } from '@/dev/devConstants'
import { HistoryTestingTools } from '@/dev/HistoryTestingTools'
import { QuestTestingTools } from '@/dev/QuestTestingTools'
import { generateDailySummary } from '@/features/summary/dailySummaryLogic'
import { DailySummaryModal } from '@/features/summary/DailySummaryModal'
import { getXpProgress } from '@/features/progression/progressionLogic'
import {
  getGameTimeSnapshot,
  isGameTimeSimulated,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'
import { getTodayDateString } from '@/lib/storage'
import { useGameStore } from '@/store/gameStore'
import type { SummarySnapshot } from '@/types/summary'

const QUICK_ADVANCE_OPTIONS = [
  { label: '+15m', ms: 15 * 60 * 1000 },
  { label: '+30m', ms: 30 * 60 * 1000 },
  { label: '+1h', ms: 60 * 60 * 1000 },
  { label: '+6h', ms: 6 * 60 * 60 * 1000 },
  { label: '+1d', ms: 24 * 60 * 60 * 1000 },
]

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatDisplayTime(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Developer-only time simulation controls. Every action re-runs the same
 * evaluation pipeline used for real load/resume events (period resets,
 * timed quest sweep, unlock recompute) so quest/unlock state reflects the
 * new time immediately — no background timers involved.
 *
 * Mutations go through the store's `dev*SimulatedTime` actions (not
 * `lib/gameTime.ts`'s setters directly) so the override is persisted and
 * survives a refresh — see `GameState.devSimulatedTime`.
 */
function TimeSimulationTools() {
  const applyPeriodResets = useGameStore((s) => s.applyPeriodResets)
  const evaluateTimedQuests = useGameStore((s) => s.evaluateTimedQuests)
  const evaluateUnlocks = useGameStore((s) => s.evaluateUnlocks)
  const devSetSimulatedTime = useGameStore((s) => s.devSetSimulatedTime)
  const devAdvanceSimulatedTime = useGameStore((s) => s.devAdvanceSimulatedTime)
  const devClearSimulatedTime = useGameStore((s) => s.devClearSimulatedTime)

  const now = useSyncExternalStore(
    subscribeToGameTimeChanges,
    getGameTimeSnapshot,
  )
  const simulated = useSyncExternalStore(
    subscribeToGameTimeChanges,
    isGameTimeSimulated,
  )

  function reEvaluate() {
    applyPeriodResets()
    evaluateTimedQuests()
    evaluateUnlocks()
  }

  function handleAdvance(ms: number) {
    devAdvanceSimulatedTime(ms)
    reEvaluate()
  }

  function handleSetCustomTime(value: string) {
    if (!value) return
    devSetSimulatedTime(new Date(value))
    reEvaluate()
  }

  function handleToggle() {
    if (simulated) {
      devClearSimulatedTime()
    } else {
      devSetSimulatedTime(new Date())
    }
    reEvaluate()
  }

  function handleResetToRealTime() {
    devClearSimulatedTime()
    reEvaluate()
  }

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-red-300/80">
          Time Simulation
        </p>
        <button
          type="button"
          onClick={handleToggle}
          className={`rounded-full border px-2 py-0.5 text-xs font-medium transition ${
            simulated
              ? 'border-amber-700/50 bg-amber-900/40 text-amber-200'
              : 'border-stone-700/50 bg-stone-900/40 text-stone-400'
          }`}
        >
          {simulated ? 'Simulated' : 'Real Time'}
        </button>
      </div>

      <p className="mb-3 text-sm text-stone-300">{formatDisplayTime(now)}</p>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="datetime-local"
          value={toDatetimeLocalValue(now)}
          onChange={(e) => handleSetCustomTime(e.target.value)}
          className="rounded-md border border-stone-700/50 bg-stone-900/60 px-2 py-1 text-sm text-stone-200"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {QUICK_ADVANCE_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleAdvance(option.ms)}
            className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleResetToRealTime}
          className="rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50"
        >
          Reset to Real Time
        </button>
      </div>
    </div>
  )
}

/**
 * Development-only tools panel.
 * Remove this entire `src/dev/` folder before production.
 */
export function DevTools() {
  const hero = useGameStore((s) => s.hero)
  const quests = useGameStore((s) => s.quests)
  const events = useGameStore((s) => s.events)
  const currentStreak = useGameStore((s) => s.currentStreak)
  const dayStartHeroSnapshot = useGameStore((s) => s.dayStartHeroSnapshot)
  const grantXp = useGameStore((s) => s.grantXp)
  const resetProgress = useGameStore((s) => s.resetProgress)

  const [previewSummary, setPreviewSummary] = useState<SummarySnapshot | null>(null)

  const xp = getXpProgress(hero)

  // A pure, on-demand preview — deliberately bypasses `isDailySummaryAvailable`
  // and never touches the store's persisted `dailySummary`/`dailySummaryViewed`,
  // so testing this can't corrupt (or prematurely "view") the real pending
  // summary the player would otherwise see.
  function handlePreviewDailySummary() {
    setPreviewSummary(
      generateDailySummary({
        hero,
        quests,
        questDefinitions: QUEST_DEFINITIONS,
        unlockDefinitions: UNLOCK_DEFINITIONS,
        events,
        streak: currentStreak,
        dayStartSnapshot: dayStartHeroSnapshot,
        periodKey: getTodayDateString(),
        now: getGameTimeSnapshot(),
      }),
    )
  }

  return (
    <div className="rounded-lg border border-dashed border-red-800/40 bg-red-950/20 p-4">
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Developer Tools
      </p>
      <p className="mb-4 text-xs text-red-400/60">
        Testing only — not included in production builds
      </p>

      <dl className="mb-4 grid grid-cols-2 gap-3 text-left text-sm">
        <div>
          <dt className="text-xs text-stone-500">Level</dt>
          <dd className="font-semibold text-stone-200">{hero.level}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Current XP</dt>
          <dd className="font-semibold text-stone-200">
            {xp.current} / {xp.required}
          </dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => grantXp(DEV_XP_TEST_AMOUNT)}
          className="rounded-md border border-amber-700/50 bg-amber-900/30 px-3 py-1.5 text-sm text-amber-100 transition hover:bg-amber-900/50"
        >
          +{DEV_XP_TEST_AMOUNT} XP Test
        </button>
        <button
          type="button"
          onClick={handlePreviewDailySummary}
          className="rounded-md border border-sky-700/50 bg-sky-900/30 px-3 py-1.5 text-sm text-sky-100 transition hover:bg-sky-900/50"
        >
          Open Today's Summary
        </button>
        <button
          type="button"
          onClick={resetProgress}
          className="rounded-md border border-red-700/50 bg-red-900/30 px-3 py-1.5 text-sm text-red-200 transition hover:bg-red-900/50"
        >
          Reset Progress
        </button>
      </div>

      <TimeSimulationTools />
      <QuestTestingTools />
      <AchievementTestingTools />
      <HistoryTestingTools />
      <AnalyticsTestingTools />

      {previewSummary && (
        <DailySummaryModal summary={previewSummary} onClose={() => setPreviewSummary(null)} />
      )}
    </div>
  )
}
