import {
  formatEventLabel,
  formatRelativeTime,
  getEventIcon,
} from '@/features/events/eventLogic'
import { getSnapshotDaySummary } from '@/features/history/historyTimeline'
import type { TimelineDayGroup } from '@/types/historyUi'

interface HeroTimelineProps {
  groups: TimelineDayGroup[]
  onSelectDay: (date: string) => void
  onSelectEvent: (date: string) => void
}

export function HeroTimeline({ groups, onSelectDay, onSelectEvent }: HeroTimelineProps) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        No timeline entries yet — complete quests and advance days to build history.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <section key={group.date}>
          <button
            type="button"
            onClick={() => onSelectDay(group.date)}
            className="mb-2 flex w-full items-center justify-between rounded-md px-1 py-0.5 text-left transition hover:bg-stone-800/40"
          >
            <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
              {group.dateLabel}
            </h3>
            {group.snapshot && (
              <span className="text-[10px] text-stone-500">
                {getSnapshotDaySummary(group.snapshot)}
              </span>
            )}
          </button>

          {group.events.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-700/40 px-3 py-2 text-xs text-stone-500">
              Snapshot recorded — open day for details.
            </p>
          ) : (
            <ul className="space-y-2">
              {group.events.map((event) => (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => onSelectEvent(group.date)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-stone-700/40 bg-stone-950/40 px-3 py-2 text-left text-sm transition hover:border-stone-600/60 hover:bg-stone-900/60"
                  >
                    <span className="flex items-center gap-2 text-stone-200">
                      <span aria-hidden="true">{getEventIcon(event)}</span>
                      {formatEventLabel(event)}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
