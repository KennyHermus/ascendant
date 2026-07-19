import { QUEST_DEFINITIONS } from '@/data/quests'
import { DEFAULT_WORKOUT_TEMPLATES } from '@/data/workoutTemplates'
import { recordWorkoutCompleted } from '@/features/events/eventLogic'
import {
  buildWorkoutActivityFromSession,
  createSetLog,
  createSessionFromTemplate,
} from '@/features/workout/workoutLogic'
import { resolveQuestIdsForTemplate } from '@/features/workout/workoutQuestResolution'
import { createDefaultSessionTiming } from '@/features/workout/workoutTimingLogic'
import { parseCalendarDateKey } from '@/lib/timeService'
import type { GameEvent } from '@/types/event'
import type { WorkoutActivity, WorkoutSession, WorkoutState } from '@/types/workout'

const TEMPLATE_IDS = DEFAULT_WORKOUT_TEMPLATES.map((template) => template.id)

function shiftHeroDayKey(baseKey: string, offsetDays: number): string {
  const date = parseCalendarDateKey(baseKey)
  date.setDate(date.getDate() - offsetDays)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function buildSampleSession(
  templateId: string,
  heroDayKey: string,
  startedAt: string,
  endedAt: string,
): WorkoutSession {
  const template =
    DEFAULT_WORKOUT_TEMPLATES.find((entry) => entry.id === templateId) ??
    DEFAULT_WORKOUT_TEMPLATES[0]

  const { sections } = createSessionFromTemplate(template)
  const completedSections = sections.map((section) => ({
    ...section,
    exercises: section.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set, index) =>
        createSetLog(set.id, {
          weight: 95 + index * 10,
          reps: 8 - index,
          completed: true,
        }),
      ),
    })),
  }))
  const completedExercises = completedSections.flatMap((section) => section.exercises)

  return {
    id: crypto.randomUUID(),
    templateId: template.id,
    templateName: template.name,
    activityStructure: 'exercise',
    activityType: template.id,
    status: 'completed',
    heroDayKey,
    questId: resolveQuestIdsForTemplate(template.id, QUEST_DEFINITIONS)[0] ?? null,
    startedAt,
    endedAt,
    pausedAt: null,
    accumulatedPausedMs: 0,
    ...createDefaultSessionTiming(),
    sections: completedSections,
    exercises: completedExercises,
    activityId: null,
  }
}

export function generateSampleWorkoutHistory(input: {
  workout: WorkoutState
  todayKey: string
  days?: number
  now: Date
}): { workout: WorkoutState; events: GameEvent[] } {
  const days = input.days ?? 30
  const activities: WorkoutActivity[] = [...input.workout.activities]
  const sessions: WorkoutSession[] = [...input.workout.sessions]
  const events: GameEvent[] = []

  for (let offset = 1; offset <= days; offset += 1) {
    const heroDayKey = shiftHeroDayKey(input.todayKey, offset)
    if (activities.some((activity) => activity.heroDayKey === heroDayKey)) continue

    const templateId = TEMPLATE_IDS[offset % TEMPLATE_IDS.length]
    const day = parseCalendarDateKey(heroDayKey)
    const startedAt = new Date(day)
    startedAt.setHours(7, 30, 0, 0)
    const endedAt = new Date(startedAt.getTime() + 45 * 60_000)

    const session = buildSampleSession(
      templateId,
      heroDayKey,
      startedAt.toISOString(),
      endedAt.toISOString(),
    )
    const activityId = crypto.randomUUID()
    const resolvedQuestId =
      resolveQuestIdsForTemplate(templateId, QUEST_DEFINITIONS)[0] ?? null
    const activity = buildWorkoutActivityFromSession(
      { ...session, activityId, endedAt: endedAt.toISOString() },
      activityId,
      endedAt.toISOString(),
      'completed',
      heroDayKey,
      resolvedQuestId,
    )

    sessions.push({ ...session, activityId })
    activities.push(activity)
    events.push(recordWorkoutCompleted({ activity, now: endedAt }))
  }

  return {
    workout: {
      ...input.workout,
      sessions,
      activities,
    },
    events,
  }
}
