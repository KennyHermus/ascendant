import {
  ACHIEVEMENT_RARITY_STYLES,
  formatAchievementRewards,
} from '@/features/achievements/achievementLogic'
import type { AchievementDefinition } from '@/types/achievement'

interface AchievementUnlockedPopupProps {
  achievement: AchievementDefinition
  onDismiss: () => void
}

/** Transient toast shown the moment an achievement unlocks. Tap to dismiss early; otherwise auto-dismisses (see `useAchievementUnlockPopups`). */
export function AchievementUnlockedPopup({ achievement, onDismiss }: AchievementUnlockedPopupProps) {
  const style = ACHIEVEMENT_RARITY_STYLES[achievement.rarity]
  const rewardLabel = formatAchievementRewards(achievement.reward)

  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4" role="status">
      <button
        type="button"
        onClick={onDismiss}
        className={`flex w-full max-w-sm items-center gap-3 rounded-xl border ${style.border} animate-[achievement-pop_0.35s_ease-out] bg-stone-900/95 p-3.5 text-left shadow-lg shadow-black/40 backdrop-blur`}
      >
        <span aria-hidden="true" className="text-2xl leading-none">
          {achievement.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/90">
            Achievement Unlocked!
          </p>
          <p className={`truncate text-sm font-semibold ${style.text}`}>{achievement.name}</p>
          {rewardLabel && <p className="mt-0.5 text-xs text-stone-400">{rewardLabel}</p>}
        </div>
      </button>
    </div>
  )
}
