import { useGameStore } from '@/store/gameStore'

const buttonClass =
  'rounded-md border border-violet-700/50 bg-violet-900/30 px-2.5 py-1 text-xs text-violet-200 transition hover:bg-violet-900/50'

const resetButtonClass =
  'rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50'

/**
 * Developer-only achievement testing controls.
 * "Evaluate Achievements" and "Unlock All" both apply rewards, events, and
 * persistence through the same pipeline as production unlocks. Unlock All
 * only skips condition checks.
 */
export function AchievementTestingTools() {
  const syncAchievements = useGameStore((s) => s.syncAchievements)
  const devUnlockAllAchievements = useGameStore((s) => s.devUnlockAllAchievements)
  const devResetAchievements = useGameStore((s) => s.devResetAchievements)

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Achievement Testing
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={syncAchievements} className={buttonClass}>
          Evaluate Achievements
        </button>
        <button type="button" onClick={devUnlockAllAchievements} className={buttonClass}>
          Unlock All Achievements
        </button>
        <button type="button" onClick={devResetAchievements} className={resetButtonClass}>
          Reset Achievements
        </button>
      </div>
    </div>
  )
}
