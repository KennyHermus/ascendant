import { Accordion } from '@/components/Accordion'
import { EXERCISE_BY_ID } from '@/data/exercises'
import {
  formatWorkoutGradeLabel,
  formatWorkoutVolume,
  getExerciseDisplayName,
} from '@/features/workout/workoutPresentation'
import { isDurationActivity } from '@/features/workout/durationActivityLogic'
import type { WorkoutActivity } from '@/types/workout'

interface WorkoutDetailModalProps {
  activity: WorkoutActivity
  onClose: () => void
}

export function WorkoutDetailModal({ activity, onClose }: WorkoutDetailModalProps) {
  const durationBased = isDurationActivity(activity)
  const sortedSections = [...activity.sections].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="workout-detail-title"
    >
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-stone-700/60 bg-stone-900 p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-500/70">
              Workout
            </p>
            <h2 id="workout-detail-title" className="text-lg font-semibold text-stone-100">
              {activity.templateName}
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              {activity.durationMinutes != null
                ? `${activity.durationMinutes} min`
                : 'Duration n/a'}
              {' · '}
              {formatWorkoutGradeLabel(activity.completionGrade)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-stone-700/50 px-2 py-1 text-sm text-stone-400 hover:bg-stone-800/60"
          >
            Close
          </button>
        </div>

        <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
          {!durationBased && (
            <>
              <div>
                <dt className="text-xs text-stone-500">Exercises</dt>
                <dd className="font-medium text-stone-200">{activity.exerciseCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Sets</dt>
                <dd className="font-medium text-stone-200">{activity.completedSetCount}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Reps</dt>
                <dd className="font-medium text-stone-200">{activity.totalReps}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Volume</dt>
                <dd className="font-medium text-stone-200">
                  {formatWorkoutVolume(activity.totalVolume)}
                </dd>
              </div>
            </>
          )}
          {durationBased && (
            <>
              <div>
                <dt className="text-xs text-stone-500">Started</dt>
                <dd className="font-medium text-stone-200">
                  {new Date(activity.startedAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-500">Completed</dt>
                <dd className="font-medium text-stone-200">
                  {new Date(activity.completedAt).toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </dd>
              </div>
            </>
          )}
        </dl>

        {durationBased ? null : activity.notes ? (
          <p className="mb-4 rounded-lg border border-stone-800/60 bg-stone-950/40 p-3 text-sm text-stone-400">
            {activity.notes}
          </p>
        ) : null}

        {!durationBased && (
          <div className="space-y-4">
            {sortedSections.map((section) => {
              const loggedExercises = section.exercises.filter((exerciseLog) =>
                exerciseLog.sets.some((set) => set.completed),
              )
              if (loggedExercises.length === 0) return null

              return (
                <Accordion
                  key={section.id}
                  title={section.name}
                  meta={`${loggedExercises.length} exercises`}
                  defaultExpanded
                  persistKey={`workout-detail-${section.sectionId}`}
                  variant="subcategory"
                >
                  <div className="space-y-3">
                    {loggedExercises.map((exerciseLog) => {
                      const definition = EXERCISE_BY_ID.get(exerciseLog.exerciseId)
                      const completedSets = exerciseLog.sets.filter((set) => set.completed)

                      return (
                        <article
                          key={exerciseLog.id}
                          className="rounded-lg border border-stone-700/50 bg-stone-950/40 p-3"
                        >
                          <h3 className="text-sm font-medium text-stone-100">
                            {getExerciseDisplayName(exerciseLog.exerciseId)}
                          </h3>
                          {exerciseLog.targetLabel && (
                            <p className="text-xs text-stone-500">{exerciseLog.targetLabel}</p>
                          )}
                          {definition && (
                            <p className="text-xs text-stone-600">{definition.muscleGroup}</p>
                          )}
                          <ul className="mt-2 space-y-1 text-xs text-stone-400">
                            {completedSets.map((set, index) => (
                              <li key={set.id}>
                                Set {index + 1}
                                {set.notes && ` · ${set.notes}`}
                                {set.fields.weight != null && ` · ${set.fields.weight} lb`}
                                {set.fields.reps != null && ` × ${set.fields.reps}`}
                                {set.fields.durationSeconds != null &&
                                  ` · ${set.fields.durationSeconds}s`}
                              </li>
                            ))}
                          </ul>
                        </article>
                      )
                    })}
                  </div>
                </Accordion>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
