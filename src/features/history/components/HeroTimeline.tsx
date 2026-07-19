import { Accordion } from '@/components/Accordion'
import {
  formatEventLabel,
  formatRelativeTime,
  getEventIcon,
} from '@/features/events/eventLogic'
import type { TimelineDayGroup } from '@/types/historyUi'

interface HeroTimelineProps {
  groups: TimelineDayGroup[]
  /** Active Hero Day key — this day defaults expanded on first visit. */
  todayKey: string
  onOpenDayOverview: (date: string) => void
  onOpenWorkoutDetail?: (activityId: string) => void
}

function eventCountLabel(count: number): string {
  return `${count} event${count === 1 ? '' : 's'}`
}

export function HeroTimeline({
  groups,
  todayKey,
  onOpenDayOverview,
  onOpenWorkoutDetail,
}: HeroTimelineProps) {
  if (groups.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        No timeline entries yet — complete quests and advance days to build history.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isToday = group.date === todayKey
        const eventCount = group.events.length

        return (
          <Accordion
            key={group.date}
            title={group.dateLabel}
            meta={eventCountLabel(eventCount)}
            defaultExpanded={isToday}
            persistKey={`history:timeline:day:${group.date}`}
            variant="subcategory"
            headerAction={
              <button
                type="button"
                onClick={() => onOpenDayOverview(group.date)}
                className="shrink-0 rounded border border-stone-700/50 bg-stone-900/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-stone-400 transition hover:border-violet-700/50 hover:bg-violet-950/30 hover:text-violet-300"
                aria-label={`Open overview for ${group.dateLabel}`}
              >
                Overview
              </button>
            }
          >
            {group.events.length === 0 ? (
              <p className="rounded-lg border border-dashed border-stone-700/40 px-3 py-2 text-xs text-stone-500">
                Snapshot recorded — use Overview for day details.
              </p>
            ) : (
              <ul className="space-y-2">
                {group.events.map((event) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          event.type === 'WORKOUT_COMPLETED' &&
                          onOpenWorkoutDetail
                        ) {
                          onOpenWorkoutDetail(event.activityId)
                          return
                        }
                        onOpenDayOverview(group.date)
                      }}
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
          </Accordion>
        )
      })}
    </div>
  )
}
