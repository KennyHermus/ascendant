import { completionRate } from '@/features/analytics/analyticsHelpers'
import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import {
  filterSnapshotsForPeriod,
  resolvePeriodRange,
} from '@/features/analytics/analyticsPeriods'
import { confidenceFromSampleSize } from '@/features/insights/insightsHelpers'
import { getWeekKey, parseDateKey } from '@/lib/storage'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { Insight } from '@/types/insights'
import type { DailySnapshot } from '@/types/history'

const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/**
 * Behavior-trend insights from History snapshots.
 * Prefers durable snapshot series over the capped event buffer.
 */
export function generateTrendInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)

  if (snapshots.length < 2) return []

  const insights: Insight[] = []
  insights.push(...detectCompletionTrend(snapshots))
  insights.push(...detectMissTrend(snapshots))
  insights.push(...detectWeekdayProductivity(snapshots))
  insights.push(...detectBestWeek(snapshots))

  return insights
}

function dayRate(snapshot: DailySnapshot): number | null {
  return completionRate(snapshot.questsCompleted, snapshot.questsMissed)
}

function detectCompletionTrend(snapshots: DailySnapshot[]): Insight[] {
  const mid = Math.floor(snapshots.length / 2)
  if (mid < 1 || snapshots.length - mid < 1) return []

  const earlier = snapshots.slice(0, mid)
  const later = snapshots.slice(mid)

  const earlyAvg = averageRates(earlier)
  const lateAvg = averageRates(later)
  if (earlyAvg === null || lateAvg === null) return []

  const delta = lateAvg - earlyAvg
  if (Math.abs(delta) < 0.05) return []

  if (delta > 0) {
    return [
      {
        id: 'trend:completionImproving',
        type: 'completionImproving',
        category: 'trend',
        title: 'Completion Improving',
        explanation:
          'Your daily quest completion rate is higher in the recent half of this period than the earlier half.',
        metric: {
          label: 'Rate change',
          value: `+${Math.round(delta * 100)} pts (${Math.round(lateAvg * 100)}% recent)`,
        },
        confidence: confidenceFromSampleSize(snapshots.length),
        severity: 'positive',
      },
    ]
  }

  return [
    {
      id: 'trend:completionDeclining',
      type: 'completionDeclining',
      category: 'trend',
      title: 'Completion Declining',
      explanation:
        'Your daily quest completion rate is lower in the recent half of this period than the earlier half.',
      metric: {
        label: 'Rate change',
        value: `${Math.round(delta * 100)} pts (${Math.round(lateAvg * 100)}% recent)`,
      },
      confidence: confidenceFromSampleSize(snapshots.length),
      severity: 'attention',
    },
  ]
}

function detectMissTrend(snapshots: DailySnapshot[]): Insight[] {
  const mid = Math.floor(snapshots.length / 2)
  if (mid < 1) return []

  const earlier = snapshots.slice(0, mid)
  const later = snapshots.slice(mid)

  const earlyMisses = averageField(earlier, (s) => s.questsMissed)
  const lateMisses = averageField(later, (s) => s.questsMissed)
  if (earlyMisses === null || lateMisses === null) return []

  const delta = lateMisses - earlyMisses
  if (Math.abs(delta) < 0.4) return []

  if (delta > 0) {
    return [
      {
        id: 'trend:missIncreasing',
        type: 'missFrequencyIncreasing',
        category: 'trend',
        title: 'Miss Frequency Increasing',
        explanation:
          'You are missing more quests per day recently compared to the earlier part of this period.',
        metric: {
          label: 'Avg misses / day',
          value: `${lateMisses.toFixed(1)} (was ${earlyMisses.toFixed(1)})`,
        },
        confidence: confidenceFromSampleSize(snapshots.length),
        severity: 'attention',
      },
    ]
  }

  return [
    {
      id: 'trend:missDecreasing',
      type: 'missFrequencyDecreasing',
      category: 'trend',
      title: 'Miss Frequency Decreasing',
      explanation:
        'You are missing fewer quests per day recently — consistency is tightening.',
      metric: {
        label: 'Avg misses / day',
        value: `${lateMisses.toFixed(1)} (was ${earlyMisses.toFixed(1)})`,
      },
      confidence: confidenceFromSampleSize(snapshots.length),
      severity: 'positive',
    },
  ]
}

function detectWeekdayProductivity(snapshots: DailySnapshot[]): Insight[] {
  const byWeekday = new Map<
    number,
    { rates: number[]; label: string }
  >()

  for (const snapshot of snapshots) {
    const rate = dayRate(snapshot)
    if (rate === null) continue
    const weekday = parseDateKey(snapshot.date).getDay()
    const entry = byWeekday.get(weekday) ?? {
      rates: [],
      label: WEEKDAY_LABELS[weekday],
    }
    entry.rates.push(rate)
    byWeekday.set(weekday, entry)
  }

  const ranked = [...byWeekday.entries()]
    .map(([day, { rates, label }]) => ({
      day,
      label,
      avg: rates.reduce((a, b) => a + b, 0) / rates.length,
      samples: rates.length,
    }))
    .filter((row) => row.samples >= 1)
    .sort((a, b) => b.avg - a.avg)

  if (ranked.length < 2) return []

  const best = ranked[0]
  const worst = ranked[ranked.length - 1]
  const insights: Insight[] = []

  insights.push({
    id: `trend:bestWeekday:${best.day}`,
    type: 'mostProductiveWeekday',
    category: 'trend',
    title: 'Most Productive Weekday',
    explanation: `${best.label} shows your highest average daily completion across tracked days.`,
    metric: {
      label: 'Avg completion',
      value: `${Math.round(best.avg * 100)}%`,
    },
    subject: best.label,
    confidence: confidenceFromSampleSize(best.samples),
    severity: 'positive',
  })

  if (worst.day !== best.day) {
    insights.push({
      id: `trend:worstWeekday:${worst.day}`,
      type: 'leastProductiveWeekday',
      category: 'trend',
      title: 'Least Productive Weekday',
      explanation: `${worst.label} is where completion tends to dip the most.`,
      metric: {
        label: 'Avg completion',
        value: `${Math.round(worst.avg * 100)}%`,
      },
      subject: worst.label,
      confidence: confidenceFromSampleSize(worst.samples),
      severity: 'attention',
    })
  }

  return insights
}

function detectBestWeek(snapshots: DailySnapshot[]): Insight[] {
  const byWeek = new Map<string, DailySnapshot[]>()

  for (const snapshot of snapshots) {
    const week = getWeekKey(parseDateKey(snapshot.date))
    const list = byWeek.get(week) ?? []
    list.push(snapshot)
    byWeek.set(week, list)
  }

  let bestWeek: { key: string; avg: number; days: number } | null = null

  for (const [key, days] of byWeek) {
    if (days.length < 2) continue
    const avg = averageRates(days)
    if (avg === null) continue
    if (!bestWeek || avg > bestWeek.avg) {
      bestWeek = { key, avg, days: days.length }
    }
  }

  if (!bestWeek) return []

  return [
    {
      id: `trend:bestWeek:${bestWeek.key}`,
      type: 'bestPerformingWeek',
      category: 'trend',
      title: 'Best Performing Week',
      explanation: `Week ${bestWeek.key} had your strongest average daily completion in this period.`,
      metric: {
        label: 'Avg completion',
        value: `${Math.round(bestWeek.avg * 100)}% over ${bestWeek.days} days`,
      },
      subject: bestWeek.key,
      confidence: confidenceFromSampleSize(bestWeek.days),
      severity: 'positive',
    },
  ]
}

function averageRates(snapshots: DailySnapshot[]): number | null {
  const rates = snapshots
    .map(dayRate)
    .filter((rate): rate is number => rate !== null)
  if (rates.length === 0) return null
  return rates.reduce((a, b) => a + b, 0) / rates.length
}

function averageField(
  snapshots: DailySnapshot[],
  field: (s: DailySnapshot) => number,
): number | null {
  if (snapshots.length === 0) return null
  return sum(snapshots.map(field)) / snapshots.length
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
