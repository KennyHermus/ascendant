import {
  getLatestSnapshot,
  getSnapshotCount,
} from '@/features/history/historyLogic'
import { useGameStore } from '@/store/gameStore'

/**
 * Developer-only controls for the History Foundation.
 * Mutates only `GameState.history` — never quests, hero, or events.
 */
export function HistoryTestingTools() {
  const history = useGameStore((s) => s.history)
  const devRecordTodaySnapshot = useGameStore((s) => s.devRecordTodaySnapshot)
  const devDeleteLatestSnapshot = useGameStore((s) => s.devDeleteLatestSnapshot)
  const devResetHistory = useGameStore((s) => s.devResetHistory)

  const count = getSnapshotCount(history)
  const latest = getLatestSnapshot(history)

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

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const created = devRecordTodaySnapshot()
            if (!created) {
              // Idempotent: already exists for today's quest day.
              console.info('[ascendant] Snapshot already exists for today')
            }
          }}
          className="rounded-md border border-stone-700/50 bg-stone-900/40 px-2.5 py-1 text-xs text-stone-300 transition hover:bg-stone-800/60"
        >
          Generate Today&apos;s Snapshot
        </button>
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
            }
          }}
          className="rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50"
        >
          Reset History Only
        </button>
      </div>
    </div>
  )
}
