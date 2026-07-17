import { useState } from 'react'

import { useHeroHistoryNavigation } from '@/features/history/heroHistoryNavigation'
import {
  getLatestSnapshot,
  getSnapshot,
  getSnapshotCount,
} from '@/features/history/historyLogic'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { getCurrentGameTime } from '@/lib/gameTime'
import { useGameStore } from '@/store/gameStore'

/**
 * Developer-only controls for the History Foundation and Hero History UI.
 * Mutates only `GameState.history` — never quests, hero, or events.
 */
export function HistoryTestingTools() {
  const history = useGameStore((s) => s.history)
  const devRecordTodaySnapshot = useGameStore((s) => s.devRecordTodaySnapshot)
  const devDeleteLatestSnapshot = useGameStore((s) => s.devDeleteLatestSnapshot)
  const devResetHistory = useGameStore((s) => s.devResetHistory)
  const devGenerateSampleHistory = useGameStore((s) => s.devGenerateSampleHistory)
  const navigation = useHeroHistoryNavigation()

  const [inspectDate, setInspectDate] = useState('')
  const [jumpDate, setJumpDate] = useState('')
  const [inspectJson, setInspectJson] = useState<string | null>(null)
  const [sampleDays, setSampleDays] = useState('90')

  const count = getSnapshotCount(history)
  const latest = getLatestSnapshot(history)
  const todayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, getCurrentGameTime())

  function handleInspect() {
    const date = inspectDate || latest?.date || todayKey
    const snapshot = getSnapshot(history, date)
    setInspectJson(snapshot ? JSON.stringify(snapshot, null, 2) : `No snapshot for ${date}`)
  }

  function handleJump() {
    const date = jumpDate || latest?.date
    if (date) navigation?.openDay(date)
  }

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        History
      </p>
      <p className="mb-3 text-sm text-stone-400">
        Snapshots: <span className="text-stone-200">{count}</span>
        {latest && (
          <>
            {' '}
            · Latest: <span className="text-stone-200">{latest.date}</span>
          </>
        )}
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const created = devRecordTodaySnapshot()
            if (!created) {
              console.info('[ascendant] Snapshot already exists for today')
            }
          }}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          Generate Today&apos;s Snapshot
        </button>
        <button
          type="button"
          onClick={() => {
            const added = devGenerateSampleHistory(Number(sampleDays) || 90)
            console.info(`[ascendant] Added ${added} sample snapshot(s)`)
          }}
          className="rounded-md border border-violet-700/50 bg-violet-900/30 px-2.5 py-1 text-xs text-violet-200 transition hover:bg-violet-900/50"
        >
          Generate Sample History
        </button>
        <label className="flex items-center gap-1 text-xs text-stone-500">
          Days
          <input
            type="number"
            min={1}
            max={365}
            value={sampleDays}
            onChange={(e) => setSampleDays(e.target.value)}
            className="w-14 rounded border border-stone-700/50 bg-stone-950/60 px-1 py-0.5 text-stone-200"
          />
        </label>
        <button
          type="button"
          onClick={() => devDeleteLatestSnapshot()}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          Delete Latest Snapshot
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Reset history only? This deletes all daily snapshots and does not affect quests, hero, or events.',
              )
            ) {
              devResetHistory()
              setInspectJson(null)
            }
          }}
          className="rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50"
        >
          Reset History Only
        </button>
      </div>

      <div className="space-y-2 border-t border-stone-800/40 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          Hero History UI
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-stone-400">
            Inspect date
            <input
              type="date"
              value={inspectDate}
              onChange={(e) => setInspectDate(e.target.value)}
              className="mt-1 block rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-sm text-stone-200"
            />
          </label>
          <button
            type="button"
            onClick={handleInspect}
            className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
          >
            Inspect Snapshot
          </button>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-stone-400">
            Jump to date
            <input
              type="date"
              value={jumpDate}
              onChange={(e) => setJumpDate(e.target.value)}
              className="mt-1 block rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-sm text-stone-200"
            />
          </label>
          <button
            type="button"
            onClick={handleJump}
            className="rounded-md border border-violet-700/50 bg-violet-900/30 px-2.5 py-1 text-xs text-violet-200 transition hover:bg-violet-900/50"
          >
            Open Daily History
          </button>
        </div>
        {inspectJson && (
          <pre className="max-h-48 overflow-auto rounded-md border border-stone-800/60 bg-stone-950/80 p-2 text-[10px] text-stone-300">
            {inspectJson}
          </pre>
        )}
      </div>
    </div>
  )
}
