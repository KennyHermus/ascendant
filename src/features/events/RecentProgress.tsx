import { Panel } from '@/components/Panel'
import { formatEventLabel, formatRelativeTime, getEventIcon } from '@/features/events/eventLogic'
import type { GameEvent } from '@/types/event'

interface RecentProgressProps {
  events: GameEvent[]
}

/** Recent accomplishments, backed by the lightweight internal GameEvent history. */
export function RecentProgress({ events }: RecentProgressProps) {
  return (
    <Panel title="Recent Progress">
      {events.length === 0 ? (
        <p className="text-sm text-stone-400">
          Nothing recorded yet — complete a quest to get started.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li
              key={event.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-stone-700/40 bg-stone-950/40 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-stone-200">
                <span aria-hidden="true">{getEventIcon(event)}</span>
                {formatEventLabel(event)}
              </span>
              <span className="shrink-0 text-xs text-stone-500">
                {formatRelativeTime(event.timestamp)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
