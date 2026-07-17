import { completionRate } from '@/features/analytics/analyticsHelpers'
import { getSnapshot } from '@/features/history/historyLogic'
import { formatDateKey, parseDateKey } from '@/lib/storage'
import type { HeroHistory } from '@/types/history'
import type { CalendarDayCell, CalendarWeekColumn } from '@/types/historyUi'

const DEFAULT_WEEK_COUNT = 26

function startOfWeekSunday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(12, 0, 0, 0)
  return d
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function weekKeyFromSunday(sunday: Date): string {
  return formatDateKey(sunday)
}

export interface BuildCalendarInput {
  history: HeroHistory
  todayKey: string
  weekCount?: number
}

/**
 * GitHub-style contribution grid: columns are weeks (Sun–Sat), trailing `weekCount` weeks.
 * Empty days remain visible; future dates are marked disabled.
 */
export function buildContributionCalendar(input: BuildCalendarInput): CalendarWeekColumn[] {
  const { history, todayKey, weekCount = DEFAULT_WEEK_COUNT } = input
  const today = parseDateKey(todayKey)
  const endSunday = startOfWeekSunday(today)
  const startSunday = addDays(endSunday, -(weekCount - 1) * 7)

  const columns: CalendarWeekColumn[] = []

  for (let week = 0; week < weekCount; week += 1) {
    const sunday = addDays(startSunday, week * 7)
    const days: CalendarDayCell[] = []

    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const cellDate = addDays(sunday, dayOffset)
      const date = formatDateKey(cellDate)
      const isFuture = date > todayKey
      const isToday = date === todayKey
      const snapshot = getSnapshot(history, date)

      let completionRateValue: number | null = null
      if (snapshot) {
        completionRateValue = completionRate(
          snapshot.questsCompleted,
          snapshot.questsMissed,
        )
      }

      days.push({
        date,
        completionRate: completionRateValue,
        hasSnapshot: snapshot !== undefined,
        isFuture,
        isToday,
      })
    }

    columns.push({
      weekKey: weekKeyFromSunday(sunday),
      days,
    })
  }

  return columns
}

export function getCalendarMonthLabels(columns: CalendarWeekColumn[]): string[] {
  const labels: string[] = []
  let lastMonth = -1

  for (const column of columns) {
    const firstDay = column.days[0]
    if (!firstDay) continue
    const month = parseDateKey(firstDay.date).getMonth()
    if (month !== lastMonth) {
      labels.push(
        parseDateKey(firstDay.date).toLocaleDateString(undefined, { month: 'short' }),
      )
      lastMonth = month
    } else {
      labels.push('')
    }
  }

  return labels
}
