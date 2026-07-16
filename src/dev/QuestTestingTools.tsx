import { QUEST_CATEGORY_LABELS, SUBCATEGORY_LABELS } from '@/data/questLabels'
import { useGameStore } from '@/store/gameStore'
import { NON_NEGOTIABLE_SUBCATEGORIES, QUEST_CATEGORIES } from '@/types/quest'

const completeButtonClass =
  'rounded-md border border-emerald-700/50 bg-emerald-900/30 px-2.5 py-1 text-xs text-emerald-200 transition hover:bg-emerald-900/50'

const resetButtonClass =
  'rounded-md border border-red-700/50 bg-red-900/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-900/50'

/**
 * Developer-only bulk quest actions. Bulk completion always routes through
 * the store's normal `completeQuest` pipeline (via `devCompleteGroup`), so
 * XP/gold/stats/streak/unlocks apply exactly as if each quest were
 * completed by hand — no quest state is written directly here.
 */
export function QuestTestingTools() {
  const devCompleteGroup = useGameStore((s) => s.devCompleteGroup)
  const devResetAllQuests = useGameStore((s) => s.devResetAllQuests)
  const devResetDailyQuests = useGameStore((s) => s.devResetDailyQuests)
  const devResetWeeklyQuests = useGameStore((s) => s.devResetWeeklyQuests)
  const devResetStreak = useGameStore((s) => s.devResetStreak)

  return (
    <div className="mt-4 border-t border-red-800/30 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-red-300/80">
        Quest Testing
      </p>

      <p className="mb-1 text-xs text-stone-500">Complete all in:</p>
      <div className="mb-3 flex flex-wrap gap-2">
        {QUEST_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => devCompleteGroup(category)}
            className={completeButtonClass}
          >
            {QUEST_CATEGORY_LABELS[category]}
          </button>
        ))}
        {NON_NEGOTIABLE_SUBCATEGORIES.map((subcategory) => (
          <button
            key={subcategory}
            type="button"
            onClick={() => devCompleteGroup('nonNegotiable', subcategory)}
            className={completeButtonClass}
          >
            {SUBCATEGORY_LABELS[subcategory]}
          </button>
        ))}
      </div>

      <p className="mb-1 text-xs text-stone-500">Reset:</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={devResetAllQuests} className={resetButtonClass}>
          All Quests
        </button>
        <button type="button" onClick={devResetDailyQuests} className={resetButtonClass}>
          Daily Quests
        </button>
        <button type="button" onClick={devResetWeeklyQuests} className={resetButtonClass}>
          Weekly Quests
        </button>
        <button type="button" onClick={devResetStreak} className={resetButtonClass}>
          Streak
        </button>
      </div>
    </div>
  )
}
