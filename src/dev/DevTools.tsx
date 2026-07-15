import { getXpProgress } from '@/features/progression/progressionLogic'
import { DEV_XP_TEST_AMOUNT } from '@/dev/devConstants'
import { useGameStore } from '@/store/gameStore'

/**
 * Development-only tools panel.
 * Remove this entire `src/dev/` folder before production.
 */
export function DevTools() {
  const hero = useGameStore((s) => s.hero)
  const grantXp = useGameStore((s) => s.grantXp)
  const resetProgress = useGameStore((s) => s.resetProgress)

  const xp = getXpProgress(hero)

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
          onClick={resetProgress}
          className="rounded-md border border-red-700/50 bg-red-900/30 px-3 py-1.5 text-sm text-red-200 transition hover:bg-red-900/50"
        >
          Reset Progress
        </button>
      </div>
    </div>
  )
}
