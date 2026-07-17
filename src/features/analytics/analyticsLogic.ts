import {
  average,
  emptyCategoryAttemptMap,
  emptySubcategoryAttemptMap,
  sumField,
  toAttemptStats,
} from '@/features/analytics/analyticsHelpers'
import {
  filterSnapshotsForPeriod,
  isDateInRange,
  resolvePeriodRange,
} from '@/features/analytics/analyticsPeriods'
import { getAchievementSummary } from '@/features/achievements/achievementLogic'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { questSupportsPlayerMiss } from '@/features/quests/questMissPolicy'
import { formatDateKey } from '@/lib/storage'
import type {
  AchievementAnalytics,
  AnalyticsPeriod,
  AttemptStats,
  HeroAnalytics,
  HistoryAnalytics,
  PeriodAnalytics,
  ProgressAnalytics,
  PunctualityAnalytics,
  QuestAnalytics,
  TimedQuestAnalytics,
} from '@/types/analytics'
import type { AchievementDefinition, AchievementState } from '@/types/achievement'
import type { GameEvent } from '@/types/event'
import type { Hero } from '@/types/hero'
import type { DailySnapshot, HeroHistory } from '@/types/history'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { DayStartHeroSnapshot } from '@/types/summary'
import type { QuestHistory } from '@/types/questHistory'

/**
 * Read-only inputs the Analytics Engine needs. Callers assemble this from
 * the store (+ static definitions); the engine never mutates anything.
 */
export interface AnalyticsInput {
  hero: Hero
  currentStreak: number
  history: HeroHistory
  events: GameEvent[]
  quests: QuestState[]
  questDefinitions: QuestDefinition[]
  achievementDefinitions: AchievementDefinition[]
  achievements: AchievementState[]
  dayStartHeroSnapshot: DayStartHeroSnapshot
  questHistory: QuestHistory
  /** Application / simulated clock. */
  now: Date
}

// ── Hero ───────────────────────────────────────────────────────────────

export function getHeroAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod = 'lifetime',
): HeroAnalytics {
  const { hero, currentStreak, history } = input
  let highestLevelReached = hero.level
  for (const snapshot of history.dailySnapshots) {
    if (snapshot.level > highestLevelReached) {
      highestLevelReached = snapshot.level
    }
  }

  return {
    currentLevel: hero.level,
    highestLevelReached,
    totalXpEarned: hero.lifetimeStats.totalXpEarned,
    totalGoldEarned: hero.lifetimeStats.totalGoldEarned,
    currentStreak,
    longestStreak: getLongestStreakForPeriod(input, period),
  }
}

/**
 * Peak streak within a period — max end-of-day `currentStreak` from snapshots
 * in range (plus live streak when today is in range but not yet snapshotted).
 * Lifetime uses the authoritative lifetime record on the hero.
 */
export function getLongestStreakForPeriod(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): number {
  if (period === 'lifetime') {
    return input.hero.lifetimeStats.longestStreak
  }

  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)

  let peak = 0
  for (const snapshot of snapshots) {
    if (snapshot.currentStreak > peak) {
      peak = snapshot.currentStreak
    }
  }

  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  if (isDateInRange(todayKey, range)) {
    const hasTodaySnapshot = snapshots.some((s) => s.date === todayKey)
    if (!hasTodaySnapshot) {
      peak = Math.max(peak, input.currentStreak)
    }
  }

  return peak
}

// ── History rollups ────────────────────────────────────────────────────

export function getHistoryAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod = 'lifetime',
): HistoryAnalytics {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)
  const totalSnapshots = snapshots.length
  const daysTracked = totalSnapshots
  const totalXp = sumField(snapshots, (s) => s.xpEarned)
  const totalGold = sumField(snapshots, (s) => s.goldEarned)

  let completionSum = 0
  let completionDays = 0
  for (const snapshot of snapshots) {
    const rate = toAttemptStats(snapshot.questsCompleted, snapshot.questsMissed).rate
    if (rate === null) continue
    completionSum += rate
    completionDays += 1
  }

  return {
    totalSnapshots,
    daysTracked,
    averageXpPerDay: average(totalXp, daysTracked),
    averageGoldPerDay: average(totalGold, daysTracked),
    averageCompletionRate: average(completionSum, completionDays),
  }
}

// ── Achievements ───────────────────────────────────────────────────────

export function getAchievementAnalytics(
  input: AnalyticsInput,
): AchievementAnalytics {
  const summary = getAchievementSummary(
    input.achievementDefinitions,
    input.achievements,
  )

  return {
    totalUnlocked: summary.unlockedCount,
    totalDefined: summary.totalCount,
    unlockPercentage: summary.completionPercent,
  }
}

// ── Progress (XP / gold by period) ─────────────────────────────────────

export function getProgressAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): ProgressAnalytics {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)
  const snapshottedDates = new Set(snapshots.map((s) => s.date))

  let xpEarned = sumField(snapshots, (s) => s.xpEarned)
  let goldEarned = sumField(snapshots, (s) => s.goldEarned)

  // In-progress active quest day is not in History until finalize — add live deltas.
  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  if (
    isDateInRange(todayKey, range) &&
    !snapshottedDates.has(todayKey)
  ) {
    const live = liveDayEarnings(input)
    xpEarned += live.xpEarned
    goldEarned += live.goldEarned
  }

  if (period === 'lifetime') {
    return {
      xpEarned: input.hero.lifetimeStats.totalXpEarned,
      goldEarned: input.hero.lifetimeStats.totalGoldEarned,
    }
  }

  return { xpEarned, goldEarned }
}

function liveDayEarnings(input: AnalyticsInput): ProgressAnalytics {
  const { hero, dayStartHeroSnapshot } = input
  return {
    xpEarned: Math.max(
      0,
      hero.lifetimeStats.totalXpEarned - dayStartHeroSnapshot.totalXpEarned,
    ),
    goldEarned: Math.max(
      0,
      hero.lifetimeStats.totalGoldEarned - dayStartHeroSnapshot.totalGoldEarned,
    ),
  }
}

// ── Quest statistics ───────────────────────────────────────────────────

export function getQuestAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): QuestAnalytics {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)
  const snapshottedDates = new Set(snapshots.map((s) => s.date))
  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)

  let totalCompleted = sumField(snapshots, (s) => s.questsCompleted)
  let totalMissed = sumField(snapshots, (s) => s.questsMissed)

  if (isDateInRange(todayKey, range) && !snapshottedDates.has(todayKey)) {
    const live = liveDayQuestTotals(input)
    totalCompleted += live.completed
    totalMissed += live.missed
  }

  // Lifetime completed counter is authoritative (incremental); prefer it when
  // it exceeds the snapshot sum (e.g. days before History existed).
  if (period === 'lifetime') {
    totalCompleted = Math.max(
      totalCompleted,
      input.hero.lifetimeStats.totalQuestsCompleted,
    )
  }

  const { byCategory, bySubcategory } = buildCategoryBreakdown(input, period, range)

  let perfectDays = snapshots.filter(isPerfectDaySnapshot).length
  if (isDateInRange(todayKey, range) && !snapshottedDates.has(todayKey)) {
    const live = liveDayQuestTotals(input)
    if (isPerfectDayTotals(live.completed, live.missed)) {
      perfectDays += 1
    }
  }

  return {
    totalCompleted,
    totalMissed,
    completionRate: toAttemptStats(totalCompleted, totalMissed).rate,
    perfectDays,
    byCategory,
    bySubcategory,
  }
}

function isPerfectDaySnapshot(snapshot: DailySnapshot): boolean {
  return isPerfectDayTotals(snapshot.questsCompleted, snapshot.questsMissed)
}

function isPerfectDayTotals(completed: number, missed: number): boolean {
  return missed === 0 && completed > 0
}

function liveDayQuestTotals(input: AnalyticsInput): {
  completed: number
  missed: number
} {
  const definitionById = new Map(
    input.questDefinitions.map((definition) => [definition.id, definition]),
  )
  let completed = 0
  let missed = 0
  for (const quest of input.quests) {
    const definition = definitionById.get(quest.id)
    if (!definition) continue
    if (quest.status === 'completed') completed += 1
    else if (
      quest.status === 'missed' &&
      questSupportsPlayerMiss(definition)
    ) {
      missed += 1
    }
  }
  return { completed, missed }
}

/**
 * Category / subcategory rates.
 *
 * - Lifetime completed: `questCompletionCounts` (authoritative).
 * - Misses + short periods: GameEvents in range (recent buffer — not complete
 *   long-term history). Snapshot aggregates do not yet store per-category
 *   breakdowns.
 */
function buildCategoryBreakdown(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
  range: ReturnType<typeof resolvePeriodRange>,
): Pick<QuestAnalytics, 'byCategory' | 'bySubcategory'> {
  const byCategory = emptyCategoryAttemptMap()
  const bySubcategory = emptySubcategoryAttemptMap()
  const definitionById = new Map(
    input.questDefinitions.map((definition) => [definition.id, definition]),
  )

  if (period === 'lifetime') {
    for (const [questId, count] of Object.entries(
      input.hero.lifetimeStats.questCompletionCounts,
    )) {
      const definition = definitionById.get(questId)
      if (!definition || count <= 0) continue
      byCategory[definition.category].completed += count
      if (definition.subcategory) {
        bySubcategory[definition.subcategory].completed += count
      }
    }
  }

  for (const event of input.events) {
    if (event.type !== 'QUEST_COMPLETED' && event.type !== 'QUEST_FAILED') {
      continue
    }

    const periodKey =
      event.type === 'QUEST_FAILED' && event.periodKey
        ? event.periodKey
        : formatDateKey(new Date(event.timestamp))

    if (!isDateInRange(periodKey, range)) continue

    const definition = definitionById.get(event.questId)
    if (!definition) continue

    const categoryBucket = byCategory[definition.category]
    const subcategoryBucket = definition.subcategory
      ? bySubcategory[definition.subcategory]
      : null

    if (event.type === 'QUEST_COMPLETED') {
      // Lifetime already counted from questCompletionCounts — avoid double-count.
      if (period !== 'lifetime') {
        categoryBucket.completed += 1
        if (subcategoryBucket) subcategoryBucket.completed += 1
      }
    } else {
      categoryBucket.missed += 1
      if (subcategoryBucket) subcategoryBucket.missed += 1
    }
  }

  // Recompute rates after mutation.
  finalizeAttemptMap(byCategory)
  finalizeAttemptMap(bySubcategory)

  return { byCategory, bySubcategory }
}

function finalizeAttemptMap<K extends string>(
  map: Record<K, AttemptStats>,
): void {
  for (const key of Object.keys(map) as K[]) {
    const entry = map[key]
    map[key] = toAttemptStats(entry.completed, entry.missed)
  }
}

// ── Timed quests ───────────────────────────────────────────────────────

export function getTimedQuestAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): TimedQuestAnalytics {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const timedIds = new Set(
    input.questDefinitions.filter((d) => d.timing).map((d) => d.id),
  )

  if (timedIds.size === 0) {
    return { completed: 0, missed: 0, successRate: null }
  }

  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(input.history.dailySnapshots, range)
  const hasTodaySnapshot = snapshots.some((s) => s.date === todayKey)
  const includeLiveToday =
    isDateInRange(todayKey, range) && !hasTodaySnapshot

  let completed = 0
  let missed = 0

  if (period === 'lifetime') {
    for (const id of timedIds) {
      completed += input.hero.lifetimeStats.questCompletionCounts[id] ?? 0
    }
  } else {
    // Prefer events for completed counts in short windows (buffer may truncate).
    for (const event of input.events) {
      if (event.type !== 'QUEST_COMPLETED') continue
      if (!timedIds.has(event.questId)) continue
      const periodKey = formatDateKey(new Date(event.timestamp))
      if (!isDateInRange(periodKey, range)) continue
      // Live today is counted from quest state below — skip event double-count.
      if (includeLiveToday && periodKey === todayKey) continue
      completed += 1
    }
  }

  // Only timed quests become `missed`; snapshot totals beat the event buffer.
  missed = sumField(snapshots, (s) => s.questsMissed)

  if (includeLiveToday) {
    const questStatus = new Map(input.quests.map((q) => [q.id, q.status]))
    for (const id of timedIds) {
      const status = questStatus.get(id)
      if (status === 'missed') missed += 1
      if (status === 'completed' && period !== 'lifetime') completed += 1
    }
  }

  const stats = toAttemptStats(completed, missed)
  return {
    completed: stats.completed,
    missed: stats.missed,
    successRate: stats.rate,
  }
}

// ── Punctuality ────────────────────────────────────────────────────────

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function getPunctualityAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): PunctualityAnalytics {
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const timedIds = new Set(
    input.questDefinitions.filter((d) => d.timing).map((d) => d.id),
  )

  const completions = input.questHistory.completions.filter(
    (c) =>
      timedIds.has(c.questId) && isDateInRange(c.heroDayKey, range),
  )

  if (completions.length === 0) {
    return {
      timedCompletions: 0,
      perfectPercent: null,
      onTimePercent: null,
      punctualPercent: null,
      avgMinutesLate: null,
      avgMinutesEarly: null,
      avgCompletionTimeMinutes: null,
    }
  }

  let perfect = 0
  let onTime = 0
  const lateOffsets: number[] = []
  const earlyOffsets: number[] = []
  const clockMinutes: number[] = []

  for (const c of completions) {
    if (c.grade === 'perfect') perfect += 1
    if (c.grade === 'onTime') onTime += 1
    if (c.minutesOffset > 0) lateOffsets.push(c.minutesOffset)
    if (c.minutesOffset < 0) earlyOffsets.push(-c.minutesOffset)
    const d = new Date(c.completedAt)
    clockMinutes.push(d.getHours() * 60 + d.getMinutes())
  }

  const total = completions.length
  const punctual = perfect + onTime

  return {
    timedCompletions: total,
    perfectPercent: perfect / total,
    onTimePercent: onTime / total,
    punctualPercent: punctual / total,
    avgMinutesLate: mean(lateOffsets),
    avgMinutesEarly: mean(earlyOffsets),
    avgCompletionTimeMinutes: mean(clockMinutes),
  }
}

// ── Bundles ────────────────────────────────────────────────────────────

export function getAnalyticsForPeriod(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): PeriodAnalytics {
  return {
    period,
    range: resolvePeriodRange(period, input.questDefinitions, input.now),
    hero: getHeroAnalytics(input, period),
    quests: getQuestAnalytics(input, period),
    timedQuests: getTimedQuestAnalytics(input, period),
    punctuality: getPunctualityAnalytics(input, period),
    progress: getProgressAnalytics(input, period),
    history: getHistoryAnalytics(input, period),
    achievements: getAchievementAnalytics(input),
  }
}

/** Convenience: lifetime analytics plus progress for today / week / month. */
export function getFullAnalytics(input: AnalyticsInput): {
  lifetime: PeriodAnalytics
  today: PeriodAnalytics
  week: PeriodAnalytics
  month: PeriodAnalytics
} {
  return {
    lifetime: getAnalyticsForPeriod(input, 'lifetime'),
    today: getAnalyticsForPeriod(input, 'today'),
    week: getAnalyticsForPeriod(input, 'week'),
    month: getAnalyticsForPeriod(input, 'month'),
  }
}

/** Exported for tests / DevTools — snapshot list used by a period. */
export function getSnapshotsForPeriod(
  snapshots: readonly DailySnapshot[],
  period: AnalyticsPeriod,
  questDefinitions: QuestDefinition[],
  now: Date,
): DailySnapshot[] {
  const range = resolvePeriodRange(period, questDefinitions, now)
  return filterSnapshotsForPeriod(snapshots, range)
}
