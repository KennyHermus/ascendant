import type { QuestDefinition } from '@/types/quest'
import type { StatKey } from '@/types/hero'
import { STAT_LABELS } from '@/features/hero/heroLogic'

interface QuestCardProps {
  quest: QuestDefinition
  completed: boolean
  onComplete: (questId: string) => void
}

function formatStatRewards(statRewards: QuestDefinition['statRewards']): string {
  const parts = Object.entries(statRewards)
    .filter(([, value]) => value !== undefined && value > 0)
    .map(([key, value]) => `${STAT_LABELS[key as StatKey]} +${value}`)

  return parts.join(', ')
}

export function QuestCard({ quest, completed, onComplete }: QuestCardProps) {
  const statRewardText = formatStatRewards(quest.statRewards)

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        completed
          ? 'border-emerald-800/50 bg-emerald-950/30'
          : 'border-stone-700/50 bg-stone-950/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-left">
          <h3
            className={`font-medium ${completed ? 'text-emerald-300/80 line-through' : 'text-stone-100'}`}
          >
            {quest.name}
          </h3>
          <p className="mt-1 text-sm text-stone-400">{quest.description}</p>
          <p className="mt-2 text-xs text-stone-500">
            +{quest.xpReward} XP
            {quest.currencyReward > 0 && ` · +${quest.currencyReward} Gold`}
            {statRewardText && ` · ${statRewardText}`}
          </p>
        </div>

        <button
          type="button"
          disabled={completed}
          onClick={() => onComplete(quest.id)}
          className="shrink-0 rounded-md border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-sm font-medium text-amber-100 transition hover:bg-amber-800/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500"
          aria-label={
            completed ? `${quest.name} completed` : `Complete ${quest.name}`
          }
        >
          {completed ? 'Done' : 'Complete'}
        </button>
      </div>
    </article>
  )
}
