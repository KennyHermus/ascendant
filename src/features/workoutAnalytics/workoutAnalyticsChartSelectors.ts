import { EXERCISE_BY_ID } from '@/data/exercises'
import type { ChartSeries, ChartSeriesPoint } from '@/features/analytics/analyticsSeries'
import { getTrainingDistribution } from '@/features/workoutAnalytics/trainingDistributionLogic'
import {
  filterActivitiesForPeriod,
  resolveWorkoutAnalyticsRange,
  type WorkoutAnalyticsInput,
} from '@/features/workoutAnalytics/workoutAnalyticsInput'
import { addHeroDays } from '@/lib/timeService'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { WorkoutActivity } from '@/types/workout'

export interface WorkoutAnalyticsChartBundle {
  period: AnalyticsPeriod
  workoutFrequency: ChartSeries
  durationTrend: ChartSeries
  volumeTrend: ChartSeries
  exerciseFrequency: ChartSeries
  prTimeline: ChartSeries
  workoutConsistencyByWeekday: ChartSeries
  distributionByMuscleRegion: ChartSeries
  distributionByTrainingType: ChartSeries
  distributionByRole: ChartSeries
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function buildDayKeysInRange(
  range: { start: string; end: string },
  _activities: WorkoutActivity[],
): string[] {
  const keys: string[] = []
  let cursor = range.start
  while (cursor <= range.end) {
    keys.push(cursor)
    cursor = addHeroDays(cursor, 1)
  }
  return keys
}

function buildWorkoutFrequencySeries(
  dayKeys: string[],
  activities: WorkoutActivity[],
): ChartSeries {
  const counts = new Map<string, number>()
  for (const activity of activities) {
    counts.set(activity.heroDayKey, (counts.get(activity.heroDayKey) ?? 0) + 1)
  }
  return {
    id: 'workoutFrequency',
    label: 'Workouts per Day',
    points: dayKeys
      .filter((date) => (counts.get(date) ?? 0) > 0)
      .map((date) => ({ date, value: counts.get(date) ?? 0 })),
  }
}

function averageByDay(
  activities: WorkoutActivity[],
  value: (activity: WorkoutActivity) => number | null,
): ChartSeriesPoint[] {
  const byDay = new Map<string, number[]>()
  for (const activity of activities) {
    const v = value(activity)
    if (v == null) continue
    const bucket = byDay.get(activity.heroDayKey) ?? []
    bucket.push(v)
    byDay.set(activity.heroDayKey, bucket)
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      value: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
    }))
}

function buildDurationTrendSeries(activities: WorkoutActivity[]): ChartSeries {
  return {
    id: 'workoutDurationTrend',
    label: 'Avg Duration (min)',
    points: averageByDay(activities, (a) => a.durationMinutes),
  }
}

function buildVolumeTrendSeries(activities: WorkoutActivity[]): ChartSeries {
  return {
    id: 'workoutVolumeTrend',
    label: 'Avg Volume',
    points: averageByDay(activities, (a) => (a.totalVolume > 0 ? a.totalVolume : null)),
  }
}

function buildExerciseFrequencySeries(activities: WorkoutActivity[]): ChartSeries {
  const counts = new Map<string, number>()
  for (const activity of activities) {
    for (const exercise of activity.exercises) {
      if (!exercise.sets.some((s) => s.completed)) continue
      counts.set(exercise.exerciseId, (counts.get(exercise.exerciseId) ?? 0) + 1)
    }
  }
  const top = [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  return {
    id: 'exerciseFrequency',
    label: 'Top Exercises',
    points: top.map(([exerciseId, count]) => ({
      date: EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId,
      value: count,
    })),
  }
}

function buildPrTimelineSeries(
  input: WorkoutAnalyticsInput,
  dayKeys: string[],
): ChartSeries {
  const counts = new Map<string, number>()
  for (const entry of input.performance.prHistory) {
    counts.set(entry.heroDayKey, (counts.get(entry.heroDayKey) ?? 0) + 1)
  }
  return {
    id: 'prTimeline',
    label: 'Official PRs Earned',
    points: dayKeys
      .filter((date) => (counts.get(date) ?? 0) > 0)
      .map((date) => ({ date, value: counts.get(date) ?? 0 })),
  }
}

function buildWorkoutConsistencyByWeekday(activities: WorkoutActivity[]): ChartSeries {
  const counts = new Array(7).fill(0) as number[]
  for (const activity of activities) {
    const parts = activity.heroDayKey.split('-').map(Number)
    if (parts.length !== 3) continue
    const [year, month, day] = parts
    const weekday = new Date(year, month - 1, day).getDay()
    counts[weekday] += 1
  }
  return {
    id: 'workoutConsistencyByWeekday',
    label: 'Workouts by Weekday',
    points: WEEKDAY_LABELS.map((label, index) => ({ date: label, value: counts[index] })),
  }
}

export function buildWorkoutAnalyticsChartBundle(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): WorkoutAnalyticsChartBundle {
  const range = resolveWorkoutAnalyticsRange(input, period)
  const activities = filterActivitiesForPeriod(input, period)
  const dayKeys = buildDayKeysInRange(range, activities)
  const distribution = getTrainingDistribution(input, period)

  const toCategoricalSeries = (
    id: string,
    label: string,
    buckets: { label: string; count: number }[],
  ): ChartSeries => ({
    id,
    label,
    points: buckets.map((b) => ({ date: b.label, value: b.count })),
  })

  return {
    period,
    workoutFrequency: buildWorkoutFrequencySeries(dayKeys, activities),
    durationTrend: buildDurationTrendSeries(activities),
    volumeTrend: buildVolumeTrendSeries(activities),
    exerciseFrequency: buildExerciseFrequencySeries(activities),
    prTimeline: buildPrTimelineSeries(input, dayKeys),
    workoutConsistencyByWeekday: buildWorkoutConsistencyByWeekday(activities),
    distributionByMuscleRegion: toCategoricalSeries(
      'distributionByMuscleRegion',
      'Muscle Region',
      distribution.byMuscleRegion,
    ),
    distributionByTrainingType: toCategoricalSeries(
      'distributionByTrainingType',
      'Training Type',
      distribution.byTrainingType,
    ),
    distributionByRole: toCategoricalSeries(
      'distributionByRole',
      'Exercise Role',
      distribution.byRole,
    ),
  }
}
