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
import type { Hero } from '@/types/hero'
import type { DailySnapshot, HeroHistory } from '@/types/history'
import type { QuestDefinition, QuestState } from '@/types/quest'
import type { QuestHistory } from '@/types/questHistory'
import type { DayStartHeroSnapshot } from '@/types/summary'
import type { WorkoutActivity } from '@/types/workout'
import type { PerformanceState } from '@/types/performance'
import type { CoachingState } from '@/types/progression'
import type { NutritionState } from '@/types/nutrition'
import { getPerformanceAnalytics } from '@/features/performance/performanceAnalyticsLogic'
import { getProgressionAnalytics } from '@/features/progression/progressionAnalyticsLogic'
import { getWorkoutAnalytics } from '@/features/workout/workoutAnalyticsLogic'
import { getNutritionAnalytics } from '@/features/nutrition/nutritionAnalyticsLogic'
import type { GameEvent } from '@/types/event'

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
  workoutActivities: WorkoutActivity[]
  performance: PerformanceState
  coaching: CoachingState
  nutrition: NutritionState
  /** Application / simulated clock. */
  now: Date
}

// ── Hero ───────────────────────────────────────────────────────────────

export function getHeroAnalytics(
  input: AnalyticsInput,
  period: AnalyticsPeriod = 'last365',
): HeroAnalytics {
  const { hero, currentStreak, history } = input
  const range = resolvePeriodRange(period, input.questDefinitions, input.now)
  const snapshots = filterSnapshotsForPeriod(history.dailySnapshots, range)

  let highestLevelReached = hero.level
  for (const snapshot of snapshots) {
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
 */
export function getLongestStreakForPeriod(
  input: AnalyticsInput,
  period: AnalyticsPeriod,
): number {
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
  period: AnalyticsPeriod = 'last365',
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

  const todayKey = getActiveQuestDayKey(input.questDefinitions, input.now)
  if (isDateInRange(todayKey, range) && !snapshottedDates.has(todayKey)) {
    const live = liveDayEarnings(input)
    xpEarned += live.xpEarned
    goldEarned += live.goldEarned
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

  const { byCategory, bySubcategory } = buildCategoryBreakdown(input, range)

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

function buildCategoryBreakdown(
  input: AnalyticsInput,
  range: ReturnType<typeof resolvePeriodRange>,
): Pick<QuestAnalytics, 'byCategory' | 'bySubcategory'> {
  const byCategory = emptyCategoryAttemptMap()
  const bySubcategory = emptySubcategoryAttemptMap()
  const definitionById = new Map(
    input.questDefinitions.map((definition) => [definition.id, definition]),
  )

  for (const completion of input.questHistory.completions) {
    if (!isDateInRange(completion.heroDayKey, range)) continue
    const definition = definitionById.get(completion.questId)
    if (!definition) continue
    byCategory[definition.category].completed += 1
    if (definition.subcategory) {
      bySubcategory[definition.subcategory].completed += 1
    }
  }

  for (const miss of input.questHistory.misses) {
    if (!isDateInRange(miss.heroDayKey, range)) continue
    const definition = definitionById.get(miss.questId)
    if (!definition) continue
    byCategory[definition.category].missed += 1
    if (definition.subcategory) {
      bySubcategory[definition.subcategory].missed += 1
    }
  }

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
  let missed = sumField(snapshots, (s) => s.questsMissed)

  for (const completion of input.questHistory.completions) {
    if (!timedIds.has(completion.questId)) continue
    if (!isDateInRange(completion.heroDayKey, range)) continue
    if (includeLiveToday && completion.heroDayKey === todayKey) continue
    completed += 1
  }

  if (includeLiveToday) {
    const questStatus = new Map(input.quests.map((q) => [q.id, q.status]))
    for (const id of timedIds) {
      const status = questStatus.get(id)
      if (status === 'missed') missed += 1
      if (status === 'completed') completed += 1
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
    workouts: getWorkoutAnalytics(input, period),
    performance: getPerformanceAnalytics(input, period),
    progression: getProgressionAnalytics({ coaching: input.coaching, period, now: input.now }),
    nutrition: getNutritionAnalytics(input, period),
  }
}

/** Convenience: common rolling windows precomputed for DevTools / comparisons. */
export function getFullAnalytics(input: AnalyticsInput): {
  today: PeriodAnalytics
  last7: PeriodAnalytics
  last30: PeriodAnalytics
  last90: PeriodAnalytics
  last180: PeriodAnalytics
  last365: PeriodAnalytics
} {
  return {
    today: getAnalyticsForPeriod(input, 'today'),
    last7: getAnalyticsForPeriod(input, 'last7'),
    last30: getAnalyticsForPeriod(input, 'last30'),
    last90: getAnalyticsForPeriod(input, 'last90'),
    last180: getAnalyticsForPeriod(input, 'last180'),
    last365: getAnalyticsForPeriod(input, 'last365'),
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
