import type { QuestDefinition, QuestStatus } from '@/types/quest'
import type { StatKey } from '@/types/hero'
import { STAT_LABELS } from '@/features/hero/heroLogic'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { isActivityDrivenQuest } from '@/features/activities/activityRegistry'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import {
  evaluateQuestTimingForDay,
  formatGraceLabel,
  formatTargetTime,
  formatTimingStatusLabel,
  getEffectiveQuestStatus,
} from '@/features/quests/questTiming'
import { useGameTime } from '@/lib/useGameTime'

interface QuestCardProps {
  quest: QuestDefinition
  status: QuestStatus
  onComplete: (questId: string) => void
}

function formatStatRewards(statRewards: QuestDefinition['statRewards']): string {
  const parts = Object.entries(statRewards)
    .filter(([, value]) => value !== undefined && value > 0)
    .map(([key, value]) => `${STAT_LABELS[key as StatKey]} +${value}`)

  return parts.join(', ')
}

function TimingBadge({
  quest,
  status,
  dayKey,
  now,
}: {
  quest: QuestDefinition
  status: QuestStatus
  dayKey: string
  now: Date
}) {
  if (!quest.timing) return null

  const targetLabel = formatTargetTime(quest.timing.targetTime)
  const graceLabel = formatGraceLabel(quest.timing.graceMinutes)

  if (status === 'missed') {
    return (
      <span className="inline-flex items-center rounded-full border border-red-800/50 bg-red-950/40 px-2 py-0.5 text-xs font-medium text-red-300">
        Missed · Due {targetLabel}
      </span>
    )
  }

  if (status === 'completed') {
    return (
      <span className="inline-flex items-center rounded-full border border-stone-700/50 bg-stone-900/40 px-2 py-0.5 text-xs text-stone-500">
        Due {targetLabel} ({graceLabel})
      </span>
    )
  }

  const timing = evaluateQuestTimingForDay(quest.timing, dayKey, now)
  const label = formatTimingStatusLabel(
    timing.phase,
    timing.minutesUntilTarget,
    timing.minutesUntilDeadline,
  )

  const phaseStyles: Record<typeof timing.phase, string> = {
    onTime: 'border-sky-800/50 bg-sky-950/40 text-sky-300',
    inGracePeriod: 'border-amber-700/50 bg-amber-950/40 text-amber-300',
    expired: 'border-red-800/50 bg-red-950/40 text-red-300',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${phaseStyles[timing.phase]}`}
      title={`Due ${targetLabel} · ${graceLabel}`}
    >
      {label}
    </span>
  )
}

export function QuestCard({ quest, status, onComplete }: QuestCardProps) {
  // Re-render when simulated time changes so countdown labels stay in sync
  // even if persisted quest status did not change.
  const now = useGameTime()
  const dayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)
  // Availability is derived from definition + clock + completion — never
  // from QUEST_FAILED history or a sticky persisted `missed`.
  const effectiveStatus = getEffectiveQuestStatus(status, quest, now, dayKey)

  const statRewardText = formatStatRewards(quest.statRewards)
  const completed = effectiveStatus === 'completed'
  const missed = effectiveStatus === 'missed'
  const activityDriven = isActivityDrivenQuest(quest.id)
  const disabled = completed || missed || activityDriven

  return (
    <article
      className={`rounded-lg border p-4 transition-colors ${
        completed
          ? 'border-emerald-800/50 bg-emerald-950/30'
          : missed
            ? 'border-red-900/40 bg-red-950/20'
            : 'border-stone-700/50 bg-stone-950/40'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-medium ${
                completed
                  ? 'text-emerald-300/80 line-through'
                  : missed
                    ? 'text-red-300/70 line-through'
                    : 'text-stone-100'
              }`}
            >
              {quest.name}
            </h3>
            {quest.optional && (
              <span className="inline-flex items-center rounded-full border border-stone-700/50 bg-stone-900/40 px-2 py-0.5 text-xs text-stone-500">
                Optional
              </span>
            )}
            <TimingBadge
              quest={quest}
              status={effectiveStatus}
              dayKey={dayKey}
              now={now}
            />
          </div>
          <p className="mt-1 text-sm text-stone-400">{quest.description}</p>
          <p className="mt-2 text-xs text-stone-500">
            +{quest.xpReward} XP
            {quest.currencyReward > 0 && ` · +${quest.currencyReward} Gold`}
            {statRewardText && ` · ${statRewardText}`}
          </p>
        </div>

        {activityDriven && !completed && !missed ? (
          <span className="shrink-0 rounded-md border border-stone-700/50 bg-stone-900/40 px-3 py-1.5 text-xs text-stone-400">
            Use Workout panel
          </span>
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onComplete(quest.id)}
            className="shrink-0 rounded-md border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-sm font-medium text-amber-100 transition hover:bg-amber-800/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500"
            aria-label={
              completed
                ? `${quest.name} completed`
                : missed
                  ? `${quest.name} missed`
                  : `Complete ${quest.name}`
            }
          >
            {completed ? 'Done' : missed ? 'Missed' : 'Complete'}
          </button>
        )}
      </div>
    </article>
  )
}
