import { ProgressBar } from '@/components/ProgressBar'
import {
  ACHIEVEMENT_RARITY_LABELS,
  ACHIEVEMENT_RARITY_STYLES,
  formatAchievementRewards,
  type AchievementProgress,
} from '@/features/achievements/achievementLogic'
import type { AchievementDefinition, AchievementState } from '@/types/achievement'

interface AchievementCardProps {
  definition: AchievementDefinition
  state: AchievementState
  progress: AchievementProgress | null
}

/**
 * Single achievement entry. `hidden` achievements that aren't unlocked yet
 * render as "???" (name, description, icon, and progress all withheld) so
 * they stay a genuine surprise — everything else about the card (rarity
 * badge, layout) still shows, since knowing "a hidden Epic achievement
 * exists in Special" isn't itself a spoiler.
 */
export function AchievementCard({ definition, state, progress }: AchievementCardProps) {
  const locked = !state.unlocked
  const hiddenLocked = locked && definition.hidden === true
  const style = ACHIEVEMENT_RARITY_STYLES[definition.rarity]

  const name = hiddenLocked ? '???' : definition.name
  const description = hiddenLocked
    ? 'A hidden achievement — keep playing to discover it.'
    : definition.description
  const icon = hiddenLocked ? '❔' : definition.icon
  const rewardLabel = formatAchievementRewards(definition.reward)

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        locked ? 'border-stone-700/50 bg-stone-950/40' : `${style.border} bg-stone-900/40`
      }`}
    >
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-lg leading-none">
          {icon}
        </span>
        <h3 className={`font-medium ${locked ? 'text-stone-100' : style.text}`}>{name}</h3>
        <span
          className={`ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${style.badge}`}
        >
          {ACHIEVEMENT_RARITY_LABELS[definition.rarity]}
        </span>
      </div>

      <p className="mt-1 text-sm text-stone-400">{description}</p>

      {!hiddenLocked && rewardLabel && (
        <p className={`mt-2 text-xs ${locked ? 'text-stone-500' : 'text-emerald-400/80'}`}>
          {rewardLabel}
        </p>
      )}

      {locked && !hiddenLocked && progress && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-stone-500">
            <span>Progress</span>
            <span>
              {progress.current} / {progress.target}
            </span>
          </div>
          <ProgressBar
            completed={progress.current}
            total={progress.target}
            color="sky"
            label={`${name} progress`}
          />
        </div>
      )}

      {!locked && state.unlockedAt && (
        <p className="mt-2 text-[11px] text-stone-500">
          Unlocked {new Date(state.unlockedAt).toLocaleDateString()}
        </p>
      )}
    </article>
  )
}
