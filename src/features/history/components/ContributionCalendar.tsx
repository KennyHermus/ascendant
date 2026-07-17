import {
  HEAT_LEVEL_CLASSES,
  completionHeatLevel,
} from '@/features/history/historyPresentation'
import type { CalendarWeekColumn } from '@/types/historyUi'

interface ContributionCalendarProps {
  columns: CalendarWeekColumn[]
  monthLabels: string[]
  selectedDate: string | null
  onSelectDay: (date: string) => void
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function ContributionCalendar({
  columns,
  monthLabels,
  selectedDate,
  onSelectDay,
}: ContributionCalendarProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="min-w-max">
        <div
          className="mb-1 grid gap-1 text-[10px] text-stone-500"
          style={{ gridTemplateColumns: `16px repeat(${columns.length}, 12px)` }}
        >
          <span />
          {monthLabels.map((label, index) => (
            <span key={`${label}-${index}`} className="truncate">
              {label}
            </span>
          ))}
        </div>

        <div className="flex gap-1">
          <div className="flex flex-col gap-1 pt-0.5 text-[10px] leading-none text-stone-500">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={label + index}
                className="flex h-3 w-4 items-center justify-end"
                aria-hidden={index % 2 === 1}
              >
                {index % 2 === 0 ? label : ''}
              </span>
            ))}
          </div>

          <div className="flex gap-1">
            {columns.map((column) => (
              <div key={column.weekKey} className="flex flex-col gap-1">
                {column.days.map((day) => {
                  const level = completionHeatLevel(day.completionRate, day.hasSnapshot)
                  const isSelected = selectedDate === day.date
                  const title = day.isFuture
                    ? `${day.date} — future`
                    : day.hasSnapshot && day.completionRate !== null
                      ? `${day.date} — ${Math.round(day.completionRate * 100)}% complete`
                      : day.hasSnapshot
                        ? `${day.date} — recorded`
                        : `${day.date} — no activity`

                  return (
                    <button
                      key={day.date}
                      type="button"
                      title={title}
                      disabled={day.isFuture}
                      onClick={() => !day.isFuture && onSelectDay(day.date)}
                      aria-label={title}
                      aria-pressed={isSelected}
                      className={`h-3 w-3 rounded-sm border transition ${HEAT_LEVEL_CLASSES[level]} ${
                        day.isFuture
                          ? 'cursor-not-allowed opacity-30'
                          : 'cursor-pointer hover:ring-1 hover:ring-amber-400/50'
                      } ${isSelected ? 'ring-2 ring-amber-400' : ''} ${
                        day.isToday ? 'outline outline-1 outline-amber-500/60' : ''
                      }`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-stone-500">
          <span>Less</span>
          {([0, 1, 2, 3, 4] as const).map((level) => (
            <span
              key={level}
              className={`h-3 w-3 rounded-sm border ${HEAT_LEVEL_CLASSES[level]}`}
              aria-hidden
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
