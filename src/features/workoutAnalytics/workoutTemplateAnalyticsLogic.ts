import { DEFAULT_WORKOUT_TEMPLATES } from '@/data/workoutTemplates'
import { EXERCISE_BY_ID } from '@/data/exercises'
import { getRecommendationsForExercise } from '@/features/progression/progressionEngineLogic'
import {
  filterActivitiesForPeriod,
  frequencyPerWeek,
  periodDayCount,
  type WorkoutAnalyticsInput,
} from '@/features/workoutAnalytics/workoutAnalyticsInput'
import type { AnalyticsPeriod } from '@/types/analytics'
import type { CoachingRecommendation } from '@/types/progression'
import type { WorkoutActivity } from '@/types/workout'

export interface WorkoutTemplateSectionStat {
  sectionId: string
  sectionName: string
  completionRate: number
  totalSets: number
}

export interface WorkoutTemplateSkippedExerciseStat {
  exerciseId: string
  exerciseName: string
  skipRate: number
  totalSets: number
}

export interface WorkoutTemplateAnalyticsStats {
  templateId: string
  templateName: string
  timesCompleted: number
  completionRate: number | null
  averageDurationMinutes: number | null
  averageVolume: number | null
  mostDifficultSection: WorkoutTemplateSectionStat | null
  mostSkippedExercise: WorkoutTemplateSkippedExerciseStat | null
  currentRecommendation: CoachingRecommendation | null
  trainingFrequencyPerWeek: number | null
  lastCompletedAt: string | null
}

export interface WorkoutTemplateAnalyticsEntry {
  templateId: string
  templateName: string
  stats: WorkoutTemplateAnalyticsStats
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}

/** All template ids/names ever seen — default programs plus any recorded activity (e.g. Walk). */
export function getWorkoutTemplateCatalog(
  activities: WorkoutActivity[],
): { templateId: string; templateName: string }[] {
  const catalog = new Map<string, string>(
    DEFAULT_WORKOUT_TEMPLATES.map((t) => [t.id, t.name]),
  )
  for (const activity of activities) {
    if (!catalog.has(activity.templateId)) {
      catalog.set(activity.templateId, activity.templateName)
    }
  }
  return [...catalog.entries()].map(([templateId, templateName]) => ({
    templateId,
    templateName,
  }))
}

function sectionStatsForActivities(
  activities: WorkoutActivity[],
): WorkoutTemplateSectionStat | null {
  const bySection = new Map<string, { name: string; completed: number; total: number }>()

  for (const activity of activities) {
    for (const section of activity.sections) {
      const entry = bySection.get(section.sectionId) ?? {
        name: section.name,
        completed: 0,
        total: 0,
      }
      for (const exercise of section.exercises) {
        entry.total += exercise.sets.length
        entry.completed += exercise.sets.filter((s) => s.completed).length
      }
      bySection.set(section.sectionId, entry)
    }
  }

  let worst: WorkoutTemplateSectionStat | null = null
  for (const [sectionId, entry] of bySection) {
    if (entry.total === 0) continue
    const completionRate = entry.completed / entry.total
    if (!worst || completionRate < worst.completionRate) {
      worst = { sectionId, sectionName: entry.name, completionRate, totalSets: entry.total }
    }
  }
  return worst
}

function skippedExerciseForActivities(
  activities: WorkoutActivity[],
): WorkoutTemplateSkippedExerciseStat | null {
  const byExercise = new Map<string, { completed: number; total: number }>()

  for (const activity of activities) {
    for (const exercise of activity.exercises) {
      const entry = byExercise.get(exercise.exerciseId) ?? { completed: 0, total: 0 }
      entry.total += exercise.sets.length
      entry.completed += exercise.sets.filter((s) => s.completed).length
      byExercise.set(exercise.exerciseId, entry)
    }
  }

  let worst: WorkoutTemplateSkippedExerciseStat | null = null
  for (const [exerciseId, entry] of byExercise) {
    if (entry.total < 2) continue
    const skipRate = 1 - entry.completed / entry.total
    if (skipRate <= 0) continue
    if (!worst || skipRate > worst.skipRate) {
      worst = {
        exerciseId,
        exerciseName: EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId,
        skipRate,
        totalSets: entry.total,
      }
    }
  }
  return worst
}

function findTemplateRecommendation(
  activities: WorkoutActivity[],
  coachingRecommendations: CoachingRecommendation[],
): CoachingRecommendation | null {
  const exerciseIds = new Set(
    activities.flatMap((activity) => activity.exercises.map((e) => e.exerciseId)),
  )
  for (const exerciseId of exerciseIds) {
    const matches = getRecommendationsForExercise(coachingRecommendations, exerciseId)
    if (matches.length > 0) return matches[0]
  }
  return null
}

export function getWorkoutTemplateAnalytics(
  input: WorkoutAnalyticsInput,
  templateId: string,
  period: AnalyticsPeriod,
): WorkoutTemplateAnalyticsStats {
  const catalog = getWorkoutTemplateCatalog(input.workoutActivities)
  const templateName =
    catalog.find((t) => t.templateId === templateId)?.templateName ?? templateId

  const activities = filterActivitiesForPeriod(input, period)
    .filter((activity) => activity.templateId === templateId)
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))

  const completionRates = activities
    .filter((a) => a.setCount > 0)
    .map((a) => a.completedSetCount / a.setCount)
  const durations = activities
    .map((a) => a.durationMinutes)
    .filter((d): d is number => d != null)
  const volumes = activities.map((a) => a.totalVolume).filter((v) => v > 0)

  const days = periodDayCount(input, period)

  return {
    templateId,
    templateName,
    timesCompleted: activities.length,
    completionRate: mean(completionRates),
    averageDurationMinutes: mean(durations),
    averageVolume: mean(volumes),
    mostDifficultSection: sectionStatsForActivities(activities),
    mostSkippedExercise: skippedExerciseForActivities(activities),
    currentRecommendation: findTemplateRecommendation(
      activities,
      input.coaching.activeRecommendations,
    ),
    trainingFrequencyPerWeek: frequencyPerWeek(activities.length, days),
    lastCompletedAt: activities.length > 0 ? activities[activities.length - 1].completedAt : null,
  }
}

export function getAllWorkoutTemplateAnalyticsEntries(
  input: WorkoutAnalyticsInput,
  period: AnalyticsPeriod,
): WorkoutTemplateAnalyticsEntry[] {
  return getWorkoutTemplateCatalog(input.workoutActivities).map(
    ({ templateId, templateName }) => ({
      templateId,
      templateName,
      stats: getWorkoutTemplateAnalytics(input, templateId, period),
    }),
  )
}
