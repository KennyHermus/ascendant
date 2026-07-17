import { formatRatePercent } from '@/features/analytics/analyticsPresentationFormat'
import { questSupportsPlayerMiss } from '@/features/quests/questMissPolicy'
import type { QuestDefinition } from '@/types/quest'
import type { QuestPerformanceStats } from '@/features/questExplorer/questAnalyticsLogic'
import { formatHeroDayLabel } from '@/features/questExplorer/questChartSelectors'

export interface QuestStatRow {
  id: string
  label: string
  value: string
  hint?: string
}

function formatMinutes(value: number | null): string {
  if (value === null) return '—'
  if (value === 0) return 'On time'
  const rounded = Math.round(value)
  return rounded > 0 ? `${rounded}m late` : `${Math.abs(rounded)}m early`
}

function formatTimestamp(iso: string | null, heroDay: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const time = d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
  if (heroDay) {
    return `${formatHeroDayLabel(heroDay)} · ${time}`
  }
  return time
}

export function buildQuestStatRows(
  stats: QuestPerformanceStats,
  definition?: QuestDefinition,
): QuestStatRow[] {
  const showMisses = definition ? questSupportsPlayerMiss(definition) : true

  const rows: QuestStatRow[] = [
    { id: 'completed', label: 'Completions', value: String(stats.completed) },
  ]

  if (showMisses) {
    rows.push({ id: 'missed', label: 'Misses', value: String(stats.missed) })
    rows.push({
      id: 'rate',
      label: 'Completion Rate',
      value: formatRatePercent(stats.completionRate),
    })
  } else if (stats.completed > 0) {
    rows.push({
      id: 'rate',
      label: 'Completions in Period',
      value: String(stats.completed),
    })
  }

  rows.push(
    {
      id: 'currentStreak',
      label: 'Current Streak',
      value: `${stats.currentStreak} day${stats.currentStreak === 1 ? '' : 's'}`,
    },
    {
      id: 'longestStreak',
      label: 'Longest Streak',
      value: `${stats.longestStreak} day${stats.longestStreak === 1 ? '' : 's'}`,
    },
    { id: 'perfect', label: 'Perfect', value: String(stats.perfectCount) },
    { id: 'onTime', label: 'On Time', value: String(stats.onTimeCount) },
    {
      id: 'completedLate',
      label: 'Completed (Late)',
      value: String(stats.completedLateCount),
    },
    {
      id: 'avgTime',
      label: 'Avg Completion Time',
      value: stats.avgCompletionTime ?? '—',
    },
    {
      id: 'avgLate',
      label: 'Avg Lateness',
      value: formatMinutes(stats.avgLatenessMinutes),
    },
    {
      id: 'weekday',
      label: 'Most Common Weekday',
      value: stats.mostCommonWeekday ?? '—',
    },
    {
      id: 'lastCompleted',
      label: 'Last Completed',
      value: formatTimestamp(stats.lastCompletedAt, stats.lastCompletedHeroDay),
    },
  )

  if (showMisses) {
    rows.push({
      id: 'lastMissed',
      label: 'Last Missed',
      value: formatTimestamp(stats.lastMissedAt, stats.lastMissedHeroDay),
    })
  }

  return rows
}
