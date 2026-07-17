import type { AnalyticsInput } from '@/features/analytics/analyticsLogic'
import {
  filterSnapshotsForPeriod,
  isDateInRange,
  resolvePeriodRange,
} from '@/features/analytics/analyticsPeriods'
import {
  buildQuestAttemptProfiles,
  confidenceFromSampleSize,
  eventPeriodKey,
  filterEventsInRange,
  formatPercent,
  formatSignedMinutes,
  splitRangeInHalf,
} from '@/features/insights/insightsHelpers'
import { evaluateQuestTimingForDay } from '@/features/quests/questTiming'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { Insight } from '@/types/insights'

/**
 * Quest-level behavioral insights.
 * Interprets per-quest attempt profiles and timed-quest event timing —
 * does not recompute Analytics category aggregates.
 */
export function generateQuestInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const insights: Insight[] = []
  const profiles = buildQuestAttemptProfiles(input, period)
  const withAttempts = profiles.filter(
    (p) => p.stats.completed + p.stats.missed > 0,
  )

  if (withAttempts.length === 0) return insights

  // Most completed
  const mostCompleted = [...withAttempts].sort(
    (a, b) => b.stats.completed - a.stats.completed,
  )[0]
  if (mostCompleted && mostCompleted.stats.completed > 0) {
    insights.push({
      id: `quest:mostCompleted:${mostCompleted.questId}`,
      type: 'mostCompletedQuest',
      category: 'quest',
      title: 'Most Completed Quest',
      explanation: `"${mostCompleted.name}" leads your completion count in this period.`,
      metric: {
        label: 'Completions',
        value: String(mostCompleted.stats.completed),
      },
      subject: mostCompleted.name,
      confidence: confidenceFromSampleSize(
        mostCompleted.stats.completed + mostCompleted.stats.missed,
      ),
      severity: 'positive',
    })
  }

  // Most missed
  const mostMissed = [...withAttempts].sort(
    (a, b) => b.stats.missed - a.stats.missed,
  )[0]
  if (mostMissed && mostMissed.stats.missed > 0) {
    insights.push({
      id: `quest:mostMissed:${mostMissed.questId}`,
      type: 'mostMissedQuest',
      category: 'quest',
      title: 'Most Missed Quest',
      explanation: `"${mostMissed.name}" accounts for the most misses recorded in this period.`,
      metric: {
        label: 'Misses',
        value: String(mostMissed.stats.missed),
      },
      subject: mostMissed.name,
      confidence: confidenceFromSampleSize(
        mostMissed.stats.completed + mostMissed.stats.missed,
      ),
      severity: 'attention',
    })
  }

  // Highest / lowest completion rate (min 2 attempts)
  const rated = withAttempts.filter((p) => p.stats.completed + p.stats.missed >= 2)
  if (rated.length > 0) {
    const highest = [...rated].sort(
      (a, b) => (b.stats.rate ?? -1) - (a.stats.rate ?? -1),
    )[0]
    const lowest = [...rated].sort(
      (a, b) => (a.stats.rate ?? 2) - (b.stats.rate ?? 2),
    )[0]

    if (highest?.stats.rate !== null) {
      insights.push({
        id: `quest:highestRate:${highest.questId}`,
        type: 'highestCompletionRate',
        category: 'quest',
        title: 'Highest Completion Rate',
        explanation: `"${highest.name}" has the strongest finish rate among quests with enough attempts.`,
        metric: {
          label: 'Rate',
          value: formatPercent(highest.stats.rate),
        },
        subject: highest.name,
        confidence: confidenceFromSampleSize(
          highest.stats.completed + highest.stats.missed,
        ),
        severity: 'positive',
      })
    }

    if (
      lowest &&
      lowest.questId !== highest?.questId &&
      lowest.stats.rate !== null
    ) {
      insights.push({
        id: `quest:lowestRate:${lowest.questId}`,
        type: 'lowestCompletionRate',
        category: 'quest',
        title: 'Lowest Completion Rate',
        explanation: `"${lowest.name}" finishes less often than your other tracked quests.`,
        metric: {
          label: 'Rate',
          value: formatPercent(lowest.stats.rate),
        },
        subject: lowest.name,
        confidence: confidenceFromSampleSize(
          lowest.stats.completed + lowest.stats.missed,
        ),
        severity: 'attention',
      })
    }
  }

  insights.push(...generateImprovementInsights(input, period))
  insights.push(...generateStreakBreakerInsights(input, period))
  insights.push(...generateTimedQuestInsights(input, period))
  insights.push(...generatePunctualityInsights(input, period))

  return insights
}

function generateImprovementInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshotDates = filterSnapshotsForPeriod(
    input.history.dailySnapshots,
    range,
  ).map((s) => s.date)
  const { earlier, later } = splitRangeInHalf(range, snapshotDates)

  if (!earlier || !later) return []

  const earlierProfiles = profilesForRange(input, earlier)
  const laterProfiles = profilesForRange(input, later)

  let bestImprove: {
    name: string
    id: string
    delta: number
    laterRate: number
  } | null = null
  let worstDecline: {
    name: string
    id: string
    delta: number
    laterRate: number
  } | null = null

  for (const definition of input.questDefinitions) {
    const early = earlierProfiles.get(definition.id)
    const late = laterProfiles.get(definition.id)
    if (!early || !late) continue
    if (early.attempts < 2 || late.attempts < 2) continue
    if (early.rate === null || late.rate === null) continue

    const delta = late.rate - early.rate
    if (delta > 0.05 && (!bestImprove || delta > bestImprove.delta)) {
      bestImprove = {
        name: definition.name,
        id: definition.id,
        delta,
        laterRate: late.rate,
      }
    }
    if (delta < -0.05 && (!worstDecline || delta < worstDecline.delta)) {
      worstDecline = {
        name: definition.name,
        id: definition.id,
        delta,
        laterRate: late.rate,
      }
    }
  }

  const insights: Insight[] = []

  if (bestImprove) {
    insights.push({
      id: `quest:improved:${bestImprove.id}`,
      type: 'mostImprovedQuest',
      category: 'quest',
      title: 'Most Improved Quest',
      explanation: `"${bestImprove.name}" completion rate rose in the later half of this period.`,
      metric: {
        label: 'Rate change',
        value: `+${Math.round(bestImprove.delta * 100)} pts → ${formatPercent(bestImprove.laterRate)}`,
      },
      subject: bestImprove.name,
      confidence: 'medium',
      severity: 'positive',
    })
  }

  if (worstDecline) {
    insights.push({
      id: `quest:declining:${worstDecline.id}`,
      type: 'mostDecliningQuest',
      category: 'quest',
      title: 'Most Declining Quest',
      explanation: `"${worstDecline.name}" completion rate fell in the later half of this period.`,
      metric: {
        label: 'Rate change',
        value: `${Math.round(worstDecline.delta * 100)} pts → ${formatPercent(worstDecline.laterRate)}`,
      },
      subject: worstDecline.name,
      confidence: 'medium',
      severity: 'attention',
    })
  }

  return insights
}

function profilesForRange(
  input: AnalyticsInput,
  range: { start: string; end: string },
): Map<string, { attempts: number; rate: number | null }> {
  const map = new Map<string, { completed: number; missed: number }>()
  for (const d of input.questDefinitions) {
    map.set(d.id, { completed: 0, missed: 0 })
  }

  for (const event of filterEventsInRange(input.events, range)) {
    if (event.type !== 'QUEST_COMPLETED' && event.type !== 'QUEST_FAILED') {
      continue
    }
    const entry = map.get(event.questId)
    if (!entry) continue
    if (event.type === 'QUEST_COMPLETED') entry.completed += 1
    else entry.missed += 1
  }

  const result = new Map<string, { attempts: number; rate: number | null }>()
  for (const [id, raw] of map) {
    const attempts = raw.completed + raw.missed
    result.set(id, {
      attempts,
      rate: attempts > 0 ? raw.completed / attempts : null,
    })
  }
  return result
}

function generateStreakBreakerInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const breakDays = new Set<string>()

  for (const event of input.events) {
    if (event.type !== 'STREAK_BROKEN') continue
    const day = eventPeriodKey(event)
    if (!isDateInRange(day, range)) continue
    breakDays.add(day)
  }

  // Also detect streak drops via snapshots (more durable than the event buffer).
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)
  for (let i = 1; i < snapshots.length; i += 1) {
    const prev = snapshots[i - 1]
    const curr = snapshots[i]
    if (prev.currentStreak > 0 && curr.currentStreak === 0) {
      breakDays.add(curr.date)
    }
  }

  if (breakDays.size === 0) return []

  const breakerCounts = new Map<string, { name: string; count: number }>()
  const streakQuestIds = new Set(
    input.questDefinitions
      .filter((d) => d.contributesToStreak)
      .map((d) => d.id),
  )

  for (const event of input.events) {
    if (event.type !== 'QUEST_FAILED') continue
    if (!streakQuestIds.has(event.questId)) continue
    const day = eventPeriodKey(event)
    if (!breakDays.has(day)) continue

    const existing = breakerCounts.get(event.questId)
    if (existing) existing.count += 1
    else breakerCounts.set(event.questId, { name: event.questName, count: 1 })
  }

  if (breakerCounts.size === 0) return []

  const top = [...breakerCounts.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  )[0]
  if (!top) return []

  const [questId, { name, count }] = top
  return [
    {
      id: `quest:streakBreaker:${questId}`,
      type: 'mostCommonStreakBreaker',
      category: 'quest',
      title: 'Most Common Streak Breaker',
      explanation: `"${name}" was missed on days when your streak reset — a recurring weak link.`,
      metric: {
        label: 'Misses on break days',
        value: String(count),
      },
      subject: name,
      confidence: confidenceFromSampleSize(breakDays.size),
      severity: 'attention',
    },
  ]
}

function generateTimedQuestInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const timedDefs = input.questDefinitions.filter((d) => d.timing)
  if (timedDefs.length === 0) return []

  const insights: Insight[] = []
  const profiles = buildQuestAttemptProfiles(input, period)
  const timedMissed = profiles
    .filter((p) => p.definition.timing && p.stats.missed > 0)
    .sort((a, b) => b.stats.missed - a.stats.missed)

  if (timedMissed[0]) {
    const top = timedMissed[0]
    insights.push({
      id: `quest:timedMissed:${top.questId}`,
      type: 'mostMissedTimedQuest',
      category: 'quest',
      title: 'Most Frequently Missed Timed Quest',
      explanation: `"${top.name}" is the timed quest you miss most often in this period.`,
      metric: {
        label: 'Misses',
        value: String(top.stats.missed),
      },
      subject: top.name,
      confidence: confidenceFromSampleSize(top.stats.completed + top.stats.missed),
      severity: 'attention',
    })
  }

  // Timing offsets from recent completion events.
  const offsets: number[] = []
  let lateSuccessCount = 0
  let timedCompleteCount = 0

  for (const event of input.events) {
    if (event.type !== 'QUEST_COMPLETED') continue
    const definition = timedDefs.find((d) => d.id === event.questId)
    if (!definition?.timing) continue

    const day = eventPeriodKey(event)
    if (!isDateInRange(day, range)) continue

    const completedAt = new Date(event.timestamp)
    const evaluation = evaluateQuestTimingForDay(
      definition.timing,
      day,
      completedAt,
    )

    // Minutes after target (negative = early).
    const [h, m] = definition.timing.targetTime.split(':').map(Number)
    const target = new Date(completedAt)
    // Reconstruct target on quest-day (handle 00:00 end-of-day).
    const dayParts = day.split('-').map(Number)
    target.setFullYear(dayParts[0], dayParts[1] - 1, dayParts[2])
    target.setHours(h, m, 0, 0)
    if (h === 0 && m === 0) target.setDate(target.getDate() + 1)

    const offsetMinutes =
      (completedAt.getTime() - target.getTime()) / 60_000
    offsets.push(offsetMinutes)
    timedCompleteCount += 1

    if (evaluation.phase === 'inGracePeriod') {
      lateSuccessCount += 1
    }
  }

  if (offsets.length > 0) {
    const avg = offsets.reduce((a, b) => a + b, 0) / offsets.length
    insights.push({
      id: 'quest:avgTimedOffset',
      type: 'averageTimedCompletionOffset',
      category: 'quest',
      title: 'Average Timed Completion',
      explanation:
        'Based on recent timed-quest completions still in the event buffer — how you land relative to each target time.',
      metric: {
        label: 'Average vs target',
        value: formatSignedMinutes(avg),
      },
      confidence: confidenceFromSampleSize(offsets.length),
      severity: Math.abs(avg) <= 15 ? 'positive' : avg > 15 ? 'attention' : 'neutral',
    })
  }

  if (lateSuccessCount > 0) {
    insights.push({
      id: 'quest:lateSuccess',
      type: 'lateButSuccessful',
      category: 'quest',
      title: 'Late-but-Successful Completions',
      explanation:
        'Timed quests finished after the target but still inside the grace window — close calls that still count.',
      metric: {
        label: 'Grace completions',
        value: `${lateSuccessCount} of ${timedCompleteCount}`,
      },
      confidence: confidenceFromSampleSize(timedCompleteCount),
      severity: 'neutral',
    })
  }

  return insights
}

function generatePunctualityInsights(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): Insight[] {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const timedDefs = input.questDefinitions.filter((d) => d.timing)
  if (timedDefs.length === 0) return []

  const insights: Insight[] = []
  const byQuest = new Map<
    string,
    {
      name: string
      lateCount: number
      earlyCount: number
      graceCount: number
      total: number
    }
  >()

  for (const def of timedDefs) {
    byQuest.set(def.id, {
      name: def.name,
      lateCount: 0,
      earlyCount: 0,
      graceCount: 0,
      total: 0,
    })
  }

  for (const c of input.questHistory.completions) {
    if (!timedDefs.some((d) => d.id === c.questId)) continue
    if (!isDateInRange(c.heroDayKey, range)) continue
    const entry = byQuest.get(c.questId)
    if (!entry) continue
    entry.total += 1
    if (c.grade === 'completed') entry.lateCount += 1
    if (c.grade === 'onTime') entry.graceCount += 1
    if (c.grade === 'perfect') entry.earlyCount += 1
  }

  const withData = [...byQuest.entries()].filter(([, v]) => v.total >= 2)
  if (withData.length === 0) return insights

  const mostLate = [...withData].sort((a, b) => b[1].lateCount - a[1].lateCount)[0]
  if (mostLate && mostLate[1].lateCount > 0) {
    insights.push({
      id: `quest:mostLate:${mostLate[0]}`,
      type: 'mostFrequentlyLate',
      category: 'quest',
      title: 'Most Frequently Late',
      explanation: `"${mostLate[1].name}" is your most often late timed quest in this period.`,
      metric: {
        label: 'Late completions',
        value: String(mostLate[1].lateCount),
      },
      subject: mostLate[1].name,
      confidence: confidenceFromSampleSize(mostLate[1].total),
      severity: 'attention',
    })
  }

  const consistentlyEarly = withData.find(
    ([, v]) => v.total >= 3 && v.earlyCount / v.total >= 0.7,
  )
  if (consistentlyEarly) {
    const [, v] = consistentlyEarly
    insights.push({
      id: `quest:early:${consistentlyEarly[0]}`,
      type: 'consistentlyEarly',
      category: 'quest',
      title: 'Consistently Early',
      explanation: `"${v.name}" is usually completed before its target time.`,
      metric: {
        label: 'Perfect rate',
        value: formatPercent(v.earlyCount / v.total),
      },
      subject: v.name,
      confidence: confidenceFromSampleSize(v.total),
      severity: 'positive',
    })
  }

  const inGrace = withData.find(
    ([, v]) => v.total >= 3 && v.graceCount / v.total >= 0.6,
  )
  if (inGrace) {
    const [, v] = inGrace
    insights.push({
      id: `quest:grace:${inGrace[0]}`,
      type: 'consistentlyInGrace',
      category: 'quest',
      title: 'Consistently Just Inside Grace',
      explanation: `"${v.name}" often lands in the grace window rather than before target.`,
      metric: {
        label: 'On-time rate',
        value: formatPercent(v.graceCount / v.total),
      },
      subject: v.name,
      confidence: confidenceFromSampleSize(v.total),
      severity: 'neutral',
    })
  }

  const { earlier, later } = splitRangeInHalf(
    range,
    input.questHistory.completions
      .filter((c) => isDateInRange(c.heroDayKey, range))
      .map((c) => c.heroDayKey),
  )

  if (earlier && later) {
    let bestImprove: { id: string; name: string; delta: number } | null = null
    let worstDecline: { id: string; name: string; delta: number } | null = null

    for (const [id, v] of withData) {
      const earlyAvg = averageOffsets(input, id, earlier)
      const lateAvg = averageOffsets(input, id, later)
      if (earlyAvg === null || lateAvg === null) continue
      const delta = earlyAvg - lateAvg
      if (delta > 5 && (!bestImprove || delta > bestImprove.delta)) {
        bestImprove = { id, name: v.name, delta }
      }
      if (delta < -5 && (!worstDecline || delta < worstDecline.delta)) {
        worstDecline = { id, name: v.name, delta }
      }
    }

    if (bestImprove) {
      insights.push({
        id: `quest:punctImproved:${bestImprove.id}`,
        type: 'improvingPunctuality',
        category: 'quest',
        title: 'Improving Punctuality',
        explanation: `"${bestImprove.name}" is finishing closer to target in the later half of this period.`,
        metric: {
          label: 'Minutes closer',
          value: formatSignedMinutes(bestImprove.delta),
        },
        subject: bestImprove.name,
        confidence: 'medium',
        severity: 'positive',
      })
    }

    if (worstDecline) {
      insights.push({
        id: `quest:punctDeclining:${worstDecline.id}`,
        type: 'decliningPunctuality',
        category: 'quest',
        title: 'Declining Punctuality',
        explanation: `"${worstDecline.name}" is drifting later relative to target in this period.`,
        metric: {
          label: 'Minutes later',
          value: formatSignedMinutes(-worstDecline.delta),
        },
        subject: worstDecline.name,
        confidence: 'medium',
        severity: 'attention',
      })
    }
  }

  return insights
}

function averageOffsets(
  input: AnalyticsInput,
  questId: string,
  range: { start: string; end: string },
): number | null {
  const offsets = input.questHistory.completions
    .filter(
      (c) => c.questId === questId && isDateInRange(c.heroDayKey, range),
    )
    .map((c) => c.minutesOffset)
  if (offsets.length === 0) return null
  return offsets.reduce((a, b) => a + b, 0) / offsets.length
}
