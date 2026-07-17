import {
  QUEST_CATEGORY_LABELS,
  SUBCATEGORY_LABELS,
} from '@/data/questLabels'
import {
  formatRatePercent,
  rateToPercent,
} from '@/features/analytics/analyticsPresentationFormat'
import type {
  AnalyticsPeriod,
  AttemptStats,
  PeriodAnalytics,
} from '@/types/analytics'
import type { NonNegotiableSubcategory, QuestCategory } from '@/types/quest'
import {
  NON_NEGOTIABLE_SUBCATEGORIES,
} from '@/types/quest'

export const ANALYTICS_PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  lifetime: 'Lifetime',
}

export type MetricSectionId =
  | 'hero'
  | 'questPerformance'
  | 'punctuality'
  | 'categories'
  | 'subcategories'
  | 'achievements'
  | 'history'

export type PeriodSupport = readonly AnalyticsPeriod[] | 'all'

export interface MetricDefinition {
  id: string
  title: string
  section: MetricSectionId
  /**
   * Which period filters should show this metric.
   * Lifetime-only identity stats (achievements catalog) stay off week/month
   * so the filter does not imply they are period aggregates.
   */
  supportedPeriods: PeriodSupport
  /** Optional design note for docs / DevTools — not shown in the UI. */
  rationale?: string
  resolve: (analytics: PeriodAnalytics) => {
    value: string
    hint?: string
  }
}

export interface AttemptMetricDefinition {
  id: string
  title: string
  section: 'categories' | 'subcategories'
  supportedPeriods: PeriodSupport
  resolve: (analytics: PeriodAnalytics) => AttemptStats
}

const ALL_PERIODS: PeriodSupport = 'all'

function formatInteger(value: number): string {
  return String(Math.round(value))
}

function formatDecimal(value: number | null, digits = 1): string {
  if (value === null) return '—'
  return value.toFixed(digits)
}

export function isPeriodSupported(
  support: PeriodSupport,
  period: AnalyticsPeriod,
): boolean {
  return support === 'all' || support.includes(period)
}

/**
 * Central registry of scalar Analytics Dashboard metrics.
 * Components render filtered entries — they do not decide period visibility.
 */
export const ANALYTICS_METRIC_REGISTRY: MetricDefinition[] = [
  // ── Hero Progress ──────────────────────────────────────────────────
  {
    id: 'level',
    title: 'Current Level',
    section: 'hero',
    supportedPeriods: ALL_PERIODS,
    rationale:
      'Current hero identity — same in every period; kept as context while viewing period XP/gold.',
    resolve: (a) => ({ value: formatInteger(a.hero.currentLevel) }),
  },
  {
    id: 'xp',
    title: 'XP Earned',
    section: 'hero',
    supportedPeriods: ALL_PERIODS,
    rationale: 'True period aggregate from Engine progress analytics.',
    resolve: (a) => ({ value: formatInteger(a.progress.xpEarned) }),
  },
  {
    id: 'gold',
    title: 'Gold Earned',
    section: 'hero',
    supportedPeriods: ALL_PERIODS,
    rationale: 'True period aggregate from Engine progress analytics.',
    resolve: (a) => ({ value: formatInteger(a.progress.goldEarned) }),
  },
  {
    id: 'streak',
    title: 'Current Streak',
    section: 'hero',
    supportedPeriods: ['today'],
    rationale:
      'Live streak counter — only meaningful as current state while viewing Today.',
    resolve: (a) => ({ value: formatInteger(a.hero.currentStreak) }),
  },
  {
    id: 'longestStreak',
    title: 'Longest Streak',
    section: 'hero',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale:
      'Peak streak within the selected period (from snapshots + live today when in range). Hidden for Today.',
    resolve: (a) => ({ value: formatInteger(a.hero.longestStreak) }),
  },

  // ── Quest Performance ──────────────────────────────────────────────
  {
    id: 'completed',
    title: 'Total Completed',
    section: 'questPerformance',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({ value: formatInteger(a.quests.totalCompleted) }),
  },
  {
    id: 'missed',
    title: 'Total Missed',
    section: 'questPerformance',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({ value: formatInteger(a.quests.totalMissed) }),
  },
  {
    id: 'completion',
    title: 'Completion',
    section: 'questPerformance',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({ value: formatRatePercent(a.quests.completionRate) }),
  },
  {
    id: 'timed',
    title: 'Timed Success',
    section: 'questPerformance',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({
      value: formatRatePercent(a.timedQuests.successRate),
      hint: `${a.timedQuests.completed} completed · ${a.timedQuests.missed} missed`,
    }),
  },
  {
    id: 'perfectDays',
    title: 'Perfect Days',
    section: 'questPerformance',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale:
      'Historical metric — a day cannot be perfect until it is complete; hidden for Today.',
    resolve: (a) => ({ value: formatInteger(a.quests.perfectDays) }),
  },

  // ── Punctuality (timed quests, from questHistory) ─────────────────
  {
    id: 'perfectRate',
    title: 'Perfect Rate',
    section: 'punctuality',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({
      value: formatRatePercent(a.punctuality.perfectPercent),
      hint:
        a.punctuality.timedCompletions > 0
          ? `${a.punctuality.timedCompletions} timed completions`
          : undefined,
    }),
  },
  {
    id: 'onTimeRate',
    title: 'On-Time Rate',
    section: 'punctuality',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({ value: formatRatePercent(a.punctuality.onTimePercent) }),
  },
  {
    id: 'punctualRate',
    title: 'Punctual Rate',
    section: 'punctuality',
    supportedPeriods: ALL_PERIODS,
    rationale: 'Perfect + On Time grades among timed completions.',
    resolve: (a) => ({
      value: formatRatePercent(a.punctuality.punctualPercent),
    }),
  },
  {
    id: 'avgLate',
    title: 'Avg Minutes Late',
    section: 'punctuality',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({
      value: formatDecimal(a.punctuality.avgMinutesLate),
    }),
  },
  {
    id: 'avgEarly',
    title: 'Avg Minutes Early',
    section: 'punctuality',
    supportedPeriods: ALL_PERIODS,
    resolve: (a) => ({
      value: formatDecimal(a.punctuality.avgMinutesEarly),
    }),
  },

  // ── Achievements (lifetime catalog — not period-scoped) ────────────
  {
    id: 'unlocked',
    title: 'Unlocked',
    section: 'achievements',
    supportedPeriods: ['lifetime'],
    rationale:
      'Achievement catalog progress is lifetime-only; week/month filters would show identical misleading numbers.',
    resolve: (a) => ({
      value: formatInteger(a.achievements.totalUnlocked),
    }),
  },
  {
    id: 'total',
    title: 'Total',
    section: 'achievements',
    supportedPeriods: ['lifetime'],
    resolve: (a) => ({
      value: formatInteger(a.achievements.totalDefined),
    }),
  },
  {
    id: 'percent',
    title: 'Completion',
    section: 'achievements',
    supportedPeriods: ['lifetime'],
    resolve: (a) => ({
      value: `${a.achievements.unlockPercentage}%`,
    }),
  },

  // ── History ────────────────────────────────────────────────────────
  {
    id: 'days',
    title: 'Days Tracked',
    section: 'history',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale:
      'Counts finalized snapshots in range — not meaningful for an in-progress Today.',
    resolve: (a) => ({ value: formatInteger(a.history.daysTracked) }),
  },
  {
    id: 'snapshots',
    title: 'Snapshots Stored',
    section: 'history',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale: 'Same as Days Tracked — historical finalized-day records only.',
    resolve: (a) => ({ value: formatInteger(a.history.totalSnapshots) }),
  },
  {
    id: 'avgXp',
    title: 'Average XP/day',
    section: 'history',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale:
      'Averages need multiple days to be meaningful; Today hides this (use XP Earned instead).',
    resolve: (a) => ({ value: formatDecimal(a.history.averageXpPerDay) }),
  },
  {
    id: 'avgGold',
    title: 'Average Gold/day',
    section: 'history',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale: 'Same as Average XP/day — not shown for Today.',
    resolve: (a) => ({ value: formatDecimal(a.history.averageGoldPerDay) }),
  },
  {
    id: 'avgCompletion',
    title: 'Average Completion',
    section: 'history',
    supportedPeriods: ['week', 'month', 'lifetime'],
    rationale: 'Mean of daily completion rates across snapshots in range.',
    resolve: (a) => ({
      value: formatRatePercent(a.history.averageCompletionRate),
    }),
  },
]

const DASHBOARD_CATEGORIES: QuestCategory[] = [
  'nonNegotiable',
  'dailyBonus',
  'weekly',
  'weeklyBonus',
]

export const ANALYTICS_ATTEMPT_METRIC_REGISTRY: AttemptMetricDefinition[] = [
  ...DASHBOARD_CATEGORIES.map(
    (category): AttemptMetricDefinition => ({
      id: category,
      title: QUEST_CATEGORY_LABELS[category],
      section: 'categories',
      supportedPeriods: ALL_PERIODS,
      resolve: (a) => a.quests.byCategory[category],
    }),
  ),
  ...NON_NEGOTIABLE_SUBCATEGORIES.map(
    (subcategory: NonNegotiableSubcategory): AttemptMetricDefinition => ({
      id: subcategory,
      title: SUBCATEGORY_LABELS[subcategory],
      section: 'subcategories',
      supportedPeriods: ALL_PERIODS,
      resolve: (a) => a.quests.bySubcategory[subcategory],
    }),
  ),
]

export const METRIC_SECTION_LABELS: Record<MetricSectionId, string> = {
  hero: 'Hero Progress',
  questPerformance: 'Quest Performance',
  punctuality: 'Punctuality',
  categories: 'Activity Breakdown',
  subcategories: 'Non-Negotiable Breakdown',
  achievements: 'Achievements',
  history: 'History',
}

export function getMetricsForPeriod(
  period: AnalyticsPeriod,
  section: MetricSectionId,
): MetricDefinition[] {
  return ANALYTICS_METRIC_REGISTRY.filter(
    (metric) =>
      metric.section === section &&
      isPeriodSupported(metric.supportedPeriods, period),
  )
}

export function getAttemptMetricsForPeriod(
  period: AnalyticsPeriod,
  section: 'categories' | 'subcategories',
): AttemptMetricDefinition[] {
  return ANALYTICS_ATTEMPT_METRIC_REGISTRY.filter(
    (metric) =>
      metric.section === section &&
      isPeriodSupported(metric.supportedPeriods, period),
  )
}

export function attemptStatsToRow(
  id: string,
  label: string,
  stats: AttemptStats,
): {
  id: string
  label: string
  completed: number
  missed: number
  percent: number | null
  percentLabel: string
} {
  return {
    id,
    label,
    completed: stats.completed,
    missed: stats.missed,
    percent: rateToPercent(stats.rate),
    percentLabel: formatRatePercent(stats.rate),
  }
}
