import { Panel } from '@/components/Panel'
import type { ActiveObjective } from '@/features/dashboard/activeObjectivesLogic'

interface ActiveObjectivesProps {
  objectives: ActiveObjective[]
}

function describeObjective(objective: ActiveObjective): { icon: string; text: string } {
  switch (objective.kind) {
    case 'timedQuest':
      return {
        icon: objective.urgent ? '⏰' : '🕒',
        text: `${objective.questName} — ${objective.remainingLabel} left`,
      }
    case 'unlock':
      return {
        icon: '🔓',
        text: `Earn ${objective.unlockName} — ${objective.requirementLabel}`,
      }
    case 'weeklyQuest':
      return {
        icon: '📅',
        text: `${objective.questName} still needs doing this week`,
      }
  }
}

/** Highlights what's most worth doing right now. Simple fixed-priority rules for now — see activeObjectives.ts. */
export function ActiveObjectives({ objectives }: ActiveObjectivesProps) {
  return (
    <Panel title="Active Objectives">
      {objectives.length === 0 ? (
        <p className="text-sm text-stone-400">All caught up! Nothing urgent right now. 🎉</p>
      ) : (
        <ul className="space-y-2.5">
          {objectives.map((objective, index) => {
            const { icon, text } = describeObjective(objective)
            return (
              <li
                key={index}
                className="flex items-start gap-2.5 rounded-lg border border-stone-700/40 bg-stone-950/40 px-3 py-2.5 text-sm text-stone-200"
              >
                <span aria-hidden="true">{icon}</span>
                <span>{text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
