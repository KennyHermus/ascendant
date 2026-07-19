import { useEffect, useMemo, useState } from 'react'

import { Accordion } from '@/components/Accordion'
import {
  formatCatalogDuration,
  getDefaultImplementedCatalogId,
  getWorkoutCatalogByCategory,
  getWorkoutCatalogEntry,
} from '@/data/workoutCatalog'
import { EXERCISE_BY_ID } from '@/data/exercises'
import { QUEST_DEFINITIONS } from '@/data/quests'
import { Panel } from '@/components/Panel'
import { ProgressBar } from '@/components/ProgressBar'
import { getActiveQuestDayKey } from '@/features/quests/questDay'
import { useGameTime } from '@/lib/useGameTime'
import { WorkoutDetailModal } from '@/features/workout/WorkoutDetailModal'
import {
  finishLabelForSession,
  isDurationSession,
} from '@/features/workout/durationActivityLogic'
import {
  getActiveSession,
  getWorkoutActivitiesForDay,
} from '@/features/workout/workoutLogic'
import {
  computeSessionProgress,
  computeSessionSectionProgress,
} from '@/features/workout/workoutProgress'
import { formatWorkoutSummary } from '@/features/workout/workoutPresentation'
import { ExerciseTimerPanel, RestTimerPanel } from '@/features/workout/components/WorkoutTimerPanels'
import {
  getSetPlannedDurationSeconds,
  isTimedSet,
} from '@/features/workout/workoutTimingLogic'
import { useWorkoutElapsedLabel } from '@/features/workout/useWorkoutTimer'
import {
  getVisibleSetsForExercise,
  isExerciseCompleteForDisplay,
} from '@/features/workout/workoutBlockLogic'
import {
  getDefaultSetInputValues,
} from '@/features/workout/workoutTemplateLogic'
import { useGameStore } from '@/store/gameStore'
import {
  isSessionInLoggingScreen,
  isSessionInReviewScreen,
  sessionPhaseLabel,
  shouldShowReviewWorkoutButton,
} from '@/features/workout/workoutSessionState'
import type {
  ActiveExerciseTimer,
  CircuitProgress,
  SessionExerciseLog,
  SessionSectionLog,
  WorkoutActivity,
} from '@/types/workout'

function CancelWorkoutButton({ onCancel }: { onCancel: () => void }) {
  return (
    <button
      type="button"
      onClick={onCancel}
      className="rounded-md border border-red-800/50 bg-red-950/30 px-2.5 py-1 text-xs text-red-200 transition hover:bg-red-950/50"
    >
      Cancel
    </button>
  )
}

function getExerciseName(exerciseId: string): string {
  return EXERCISE_BY_ID.get(exerciseId)?.name ?? exerciseId
}

function ExerciseSetLogger({
  exercise,
  activeExerciseTimer,
  circuitProgress,
  weightInput,
  repsInput,
  onWeightChange,
  onRepsChange,
  onToggleSet,
  onCompleteSet,
  onStartExerciseTimer,
  onPauseExerciseTimer,
  onResumeExerciseTimer,
  onStopExerciseTimer,
  onMarkExerciseTargetReached,
}: {
  exercise: SessionExerciseLog
  activeExerciseTimer: ActiveExerciseTimer | null
  circuitProgress: CircuitProgress | null | undefined
  weightInput: string
  repsInput: string
  onWeightChange: (value: string) => void
  onRepsChange: (value: string) => void
  onToggleSet: (setId: string) => void
  onCompleteSet: (setId: string) => void
  onStartExerciseTimer: (setId: string) => void
  onPauseExerciseTimer: () => void
  onResumeExerciseTimer: () => void
  onStopExerciseTimer: () => void
  onMarkExerciseTargetReached: () => void
}) {
  const visibleSets = getVisibleSetsForExercise(exercise, circuitProgress)
  const completedCount = exercise.sets.filter((set) => set.completed).length
  const activeSet =
    exercise.sets.find((set) => set.id === activeExerciseTimer?.setId) ??
    visibleSets.find((set) => !set.completed) ??
    visibleSets[0] ??
    null
  const activeSetIsTimed = activeSet ? isTimedSet(activeSet, exercise) : false
  const timerForActiveSet =
    activeExerciseTimer?.exerciseLogId === exercise.id &&
    activeExerciseTimer.setId === activeSet?.id
      ? activeExerciseTimer
      : null

  return (
    <article className="rounded-lg border border-stone-700/50 bg-stone-950/40 p-4">
      <h3 className="text-sm font-medium text-stone-100">
        {getExerciseName(exercise.exerciseId)}
      </h3>
      {exercise.targetLabel && (
        <p className="mt-0.5 text-xs text-amber-400/80">{exercise.targetLabel}</p>
      )}
      {exercise.notes && (
        <p className="mt-0.5 text-xs text-stone-500">{exercise.notes}</p>
      )}
      <p className="mb-3 text-xs text-stone-500">
        {completedCount} / {exercise.sets.length} sets complete
        {circuitProgress && exercise.blockId === circuitProgress.blockId && (
          <span className="text-amber-400/80">
            {' '}
            · Circuit {circuitProgress.currentRound} / {circuitProgress.totalRounds}
          </span>
        )}
      </p>

      {!activeSetIsTimed && (
        <div className="mb-3 flex flex-wrap gap-2 text-xs">
          <label className="flex items-center gap-1 text-stone-500">
            Weight
            <input
              type="number"
              value={weightInput}
              onChange={(e) => onWeightChange(e.target.value)}
              className="w-16 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
            />
          </label>
          <label className="flex items-center gap-1 text-stone-500">
            Reps
            <input
              type="number"
              value={repsInput}
              onChange={(e) => onRepsChange(e.target.value)}
              className="w-14 rounded border border-stone-700/50 bg-stone-950/60 px-2 py-1 text-stone-200"
            />
          </label>
        </div>
      )}

      {activeSetIsTimed && activeSet && !activeSet.completed && (
        <ExerciseTimerPanel
          plannedDurationSeconds={getSetPlannedDurationSeconds(activeSet, exercise) ?? 0}
          timer={timerForActiveSet}
          onStart={() => onStartExerciseTimer(activeSet.id)}
          onPause={onPauseExerciseTimer}
          onResume={onResumeExerciseTimer}
          onStop={onStopExerciseTimer}
          onTargetReached={onMarkExerciseTargetReached}
        />
      )}

      <ul className="space-y-2">
        {visibleSets.map((set, index) => {
          const timed = isTimedSet(set, exercise)
          const plannedSeconds = getSetPlannedDurationSeconds(set, exercise)

          return (
            <li
              key={set.id}
              className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                set.completed
                  ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-200'
                  : 'border-stone-700/40 bg-stone-900/30 text-stone-300'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleSet(set.id)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span
                  className={`inline-flex h-5 w-5 items-center justify-center rounded border ${
                    set.completed
                      ? 'border-emerald-600 bg-emerald-700/40 text-emerald-100'
                      : 'border-stone-600'
                  }`}
                >
                  {set.completed ? '✓' : index + 1}
                </span>
                <span>
                  Set {index + 1}
                  {set.notes && ` · ${set.notes}`}
                  {set.fields.weight != null && ` · ${set.fields.weight} lb`}
                  {set.fields.reps != null && ` × ${set.fields.reps}`}
                  {set.fields.durationSeconds != null &&
                    ` · ${set.fields.durationSeconds}s`}
                  {!set.completed && timed && plannedSeconds != null && (
                    <span className="text-stone-500"> · target {plannedSeconds}s</span>
                  )}
                </span>
              </button>
              {!set.completed && !timed && (
                <button
                  type="button"
                  onClick={() => onCompleteSet(set.id)}
                  className="rounded border border-amber-700/50 px-2 py-0.5 text-xs text-amber-100"
                >
                  Log
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

function SectionExerciseList({
  section,
  focusedExerciseId,
  circuitProgress,
  onSelectExercise,
  interactive,
}: {
  section: SessionSectionLog
  focusedExerciseId: string | null
  circuitProgress: CircuitProgress | null | undefined
  onSelectExercise?: (exerciseId: string) => void
  interactive?: boolean
}) {
  return (
    <div className="space-y-2">
      {section.circuitMeta && (
        <div className="rounded-md border border-amber-800/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200/90">
          <p className="font-medium">
            {circuitProgress && section.circuitMeta.blockId === circuitProgress.blockId
              ? `Circuit ${circuitProgress.currentRound} / ${circuitProgress.totalRounds}`
              : `Circuit · ${section.circuitMeta.repeatCount} rounds`}
          </p>
          <p className="mt-0.5 text-amber-300/70">
            ↻ Repeat {section.circuitMeta.repeatCount}×
            {section.circuitMeta.restAfterCircuitSeconds != null &&
              ` · ${section.circuitMeta.restAfterCircuitSeconds}s rest between rounds`}
          </p>
        </div>
      )}
      <ul className="space-y-1">
      {[...section.exercises]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((exercise) => {
          const completed = isExerciseCompleteForDisplay(exercise, circuitProgress)
          const isFocused = exercise.id === focusedExerciseId

          if (interactive && onSelectExercise) {
            return (
              <li key={exercise.id}>
                <button
                  type="button"
                  onClick={() => onSelectExercise(exercise.id)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm transition ${
                    isFocused
                      ? 'border-amber-600/60 bg-amber-950/40 text-amber-100'
                      : completed
                        ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300'
                        : 'border-stone-700/40 text-stone-400 hover:bg-stone-900/40'
                  }`}
                >
                  <span className="font-medium">{getExerciseName(exercise.exerciseId)}</span>
                  {exercise.targetLabel && (
                    <span className="mt-0.5 block text-xs text-stone-500">
                      {exercise.targetLabel}
                    </span>
                  )}
                </button>
              </li>
            )
          }

          return (
            <li key={exercise.id} className="text-sm text-stone-400">
              {getExerciseName(exercise.exerciseId)}
              {exercise.targetLabel && (
                <span className="text-stone-600"> · {exercise.targetLabel}</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function TodaysWorkoutsList({
  activities,
  onView,
}: {
  activities: WorkoutActivity[]
  onView: (activityId: string) => void
}) {
  if (activities.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-widest text-stone-500">
        Today&apos;s workouts ({activities.length})
      </p>
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start justify-between gap-3 rounded-lg border border-emerald-800/40 bg-emerald-950/20 p-3 text-sm"
        >
          <div>
            <p className="font-medium text-emerald-200">{activity.templateName}</p>
            <p className="mt-0.5 text-xs text-emerald-300/70">
              {formatWorkoutSummary(activity)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onView(activity.id)}
            className="shrink-0 rounded-md border border-stone-700/50 px-2 py-1 text-xs text-stone-300 hover:bg-stone-900/50"
          >
            Details
          </button>
        </div>
      ))}
    </div>
  )
}

export function WorkoutPanel() {
  const now = useGameTime()
  const heroDayKey = getActiveQuestDayKey(QUEST_DEFINITIONS, now)

  const workout = useGameStore((s) => s.workout)
  const createWorkoutSession = useGameStore((s) => s.createWorkoutSession)
  const startDurationActivity = useGameStore((s) => s.startDurationActivity)
  const beginWorkout = useGameStore((s) => s.beginWorkout)
  const pauseWorkout = useGameStore((s) => s.pauseWorkout)
  const resumeWorkout = useGameStore((s) => s.resumeWorkout)
  const cancelWorkout = useGameStore((s) => s.cancelWorkout)
  const logWorkoutSet = useGameStore((s) => s.logWorkoutSet)
  const toggleWorkoutSetComplete = useGameStore((s) => s.toggleWorkoutSetComplete)
  const completeWorkout = useGameStore((s) => s.completeWorkout)
  const enterWorkoutReview = useGameStore((s) => s.enterWorkoutReview)
  const exitWorkoutReview = useGameStore((s) => s.exitWorkoutReview)
  const startExerciseTimer = useGameStore((s) => s.startExerciseTimer)
  const pauseExerciseTimer = useGameStore((s) => s.pauseExerciseTimer)
  const resumeExerciseTimer = useGameStore((s) => s.resumeExerciseTimer)
  const stopExerciseTimer = useGameStore((s) => s.stopExerciseTimer)
  const markExerciseTimerTargetReached = useGameStore(
    (s) => s.markExerciseTimerTargetReached,
  )
  const pauseRestTimer = useGameStore((s) => s.pauseRestTimer)
  const resumeRestTimer = useGameStore((s) => s.resumeRestTimer)
  const stopRestTimer = useGameStore((s) => s.stopRestTimer)
  const skipRestTimer = useGameStore((s) => s.skipRestTimer)

  const [selectedCatalogId, setSelectedCatalogId] = useState(getDefaultImplementedCatalogId)
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null)
  const [weightInput, setWeightInput] = useState('135')
  const [repsInput, setRepsInput] = useState('8')
  const [detailActivityId, setDetailActivityId] = useState<string | null>(null)

  const activeSession = useMemo(() => getActiveSession(workout), [workout])
  const todayActivities = useMemo(
    () => getWorkoutActivitiesForDay(workout, heroDayKey),
    [workout, heroDayKey],
  )
  const sessionProgress = useMemo(
    () => (activeSession ? computeSessionProgress(activeSession) : null),
    [activeSession],
  )
  const sectionProgress = useMemo(
    () => (activeSession ? computeSessionSectionProgress(activeSession) : []),
    [activeSession],
  )

  const focusedExercise = useMemo(() => {
    if (!activeSession || !focusedExerciseId) return null
    return activeSession.exercises.find((entry) => entry.id === focusedExerciseId) ?? null
  }, [activeSession, focusedExerciseId])

  const elapsedLabel = useWorkoutElapsedLabel(activeSession)
  const detailActivity = useMemo(
    () => todayActivities.find((activity) => activity.id === detailActivityId) ?? null,
    [todayActivities, detailActivityId],
  )

  const catalogByCategory = useMemo(() => getWorkoutCatalogByCategory(), [])
  const selectedCatalogEntry = useMemo(
    () => getWorkoutCatalogEntry(selectedCatalogId),
    [selectedCatalogId],
  )

  useEffect(() => {
    if (!sessionProgress || !activeSession || isDurationSession(activeSession)) return
    const current = activeSession.exercises[sessionProgress.currentExerciseIndex]
    if (current && focusedExerciseId !== current.id) {
      setFocusedExerciseId(current.id)
    }
  }, [sessionProgress, activeSession, focusedExerciseId])

  useEffect(() => {
    if (!focusedExercise || !activeSession) return
    const visibleSets = getVisibleSetsForExercise(
      focusedExercise,
      activeSession.circuitProgress,
    )
    const activeSet =
      visibleSets.find((set) => !set.completed) ?? visibleSets[0] ?? null
    const defaults = getDefaultSetInputValues(activeSet)
    if (defaults.weight != null) setWeightInput(String(defaults.weight))
    if (defaults.reps != null) setRepsInput(String(defaults.reps))
  }, [focusedExercise, activeSession?.circuitProgress, activeSession?.id])

  function parseNumber(value: string): number | undefined {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  function handleCancelWorkout() {
    const label = activeSession?.templateName ?? 'workout'
    if (!window.confirm(`Cancel this ${label}? Progress will be discarded.`)) return
    cancelWorkout()
  }

  function handleStartSelected() {
    const entry = getWorkoutCatalogEntry(selectedCatalogId)
    if (!entry?.implemented) return

    if (entry.activityStructure === 'duration') {
      startDurationActivity(entry.id as 'walk')
      return
    }

    createWorkoutSession(entry.id)
    setFocusedExerciseId(null)
  }

  function handleBeginWorkout() {
    beginWorkout()
  }

  function handleCompleteSet(exerciseLogId: string, setId: string) {
    const weight = parseNumber(weightInput)
    const reps = parseNumber(repsInput)
    logWorkoutSet(exerciseLogId, setId, weight, reps)
  }

  function handleToggleSet(exerciseLogId: string, setId: string) {
    toggleWorkoutSetComplete(exerciseLogId, setId)
  }

  if (!activeSession) {
    return (
      <>
        <Panel title="Workout">
          <div className="space-y-4">
            <TodaysWorkoutsList
              activities={todayActivities}
              onView={setDetailActivityId}
            />
            <div className="space-y-3">
              <p className="text-sm text-stone-400">
                Select a workout and start a session. Multiple workouts can be logged per day.
              </p>
              <label className="block text-xs text-stone-500">
                Workout
                <select
                  value={selectedCatalogId}
                  onChange={(e) => setSelectedCatalogId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-stone-700/50 bg-stone-950/60 px-3 py-2 text-sm text-stone-200"
                >
                  {catalogByCategory.map(({ category, label, entries }) => (
                    <optgroup key={category} label={label}>
                      {entries.map((entry) => {
                        const durationLabel = formatCatalogDuration(entry)
                        return (
                          <option
                            key={entry.id}
                            value={entry.id}
                            disabled={!entry.implemented}
                          >
                            {entry.name}
                            {durationLabel ? ` · ${durationLabel}` : ''}
                            {!entry.implemented ? ' (coming soon)' : ''}
                          </option>
                        )
                      })}
                    </optgroup>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={!selectedCatalogEntry?.implemented}
                onClick={handleStartSelected}
                className="rounded-md border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 text-sm font-medium text-amber-100 transition hover:bg-amber-800/50 disabled:cursor-not-allowed disabled:border-stone-700 disabled:bg-stone-800/50 disabled:text-stone-500"
              >
                {selectedCatalogEntry?.activityStructure === 'duration'
                  ? `Start ${selectedCatalogEntry.name}`
                  : 'Create Workout Session'}
              </button>
            </div>
          </div>
        </Panel>
        {detailActivity && (
          <WorkoutDetailModal
            activity={detailActivity}
            onClose={() => setDetailActivityId(null)}
          />
        )}
      </>
    )
  }

  if (!sessionProgress) return null

  const sortedSections = [...activeSession.sections].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  )

  if (activeSession.status === 'draft') {
    return (
      <Panel title="Workout">
        <div className="space-y-4">
          <div>
            <p className="font-medium text-stone-100">{activeSession.templateName}</p>
            <p className="text-xs text-stone-500">
              {sessionProgress.exerciseCount} exercises · {sessionProgress.totalSets} sets
            </p>
          </div>

          <div className="space-y-4">
            {sortedSections.map((section) => {
              const progress = sectionProgress.find(
                (entry) => entry.sectionId === section.sectionId,
              )
              return (
                <Accordion
                  key={section.id}
                  title={section.name}
                  meta={
                    progress
                      ? `${progress.exerciseCount} exercises · ${progress.totalSets} sets`
                      : undefined
                  }
                  defaultExpanded
                  persistKey={`workout-draft-${section.sectionId}`}
                  variant="subcategory"
                >
                  <SectionExerciseList
                    section={section}
                    focusedExerciseId={null}
                    circuitProgress={activeSession.circuitProgress}
                  />
                </Accordion>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <CancelWorkoutButton onCancel={handleCancelWorkout} />
            <button
              type="button"
              onClick={handleBeginWorkout}
              className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-3 py-1.5 text-sm font-medium text-emerald-100"
            >
              Start Workout
            </button>
          </div>
        </div>
      </Panel>
    )
  }

  if (isSessionInReviewScreen(activeSession)) {
    const durationBased = isDurationSession(activeSession)
    const reviewTitle = durationBased
      ? `Review ${activeSession.templateName.toLowerCase()}`
      : 'Review workout'

    return (
      <Panel title="Workout">
        <div className="space-y-4">
          <div>
            <p className="font-medium text-stone-100">{reviewTitle}</p>
            <p className="text-xs text-stone-500">{activeSession.templateName}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-stone-500">Duration</dt>
              <dd className="text-stone-200">{elapsedLabel}</dd>
            </div>
            {!durationBased && (
              <>
                <div>
                  <dt className="text-xs text-stone-500">Exercises</dt>
                  <dd className="text-stone-200">
                    {sessionProgress.completedExerciseCount} / {sessionProgress.exerciseCount}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Sets</dt>
                  <dd className="text-stone-200">
                    {sessionProgress.completedSets} / {sessionProgress.totalSets}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-500">Volume</dt>
                  <dd className="text-stone-200">{Math.round(sessionProgress.totalVolume)} lb</dd>
                </div>
              </>
            )}
          </dl>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => exitWorkoutReview()}
              className="rounded-md border border-stone-700/50 px-3 py-1.5 text-sm text-stone-300"
            >
              Back
            </button>
            <CancelWorkoutButton onCancel={handleCancelWorkout} />
            <button
              type="button"
              onClick={() => completeWorkout()}
              className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-3 py-1.5 text-sm font-medium text-emerald-100"
            >
              {finishLabelForSession(activeSession)}
            </button>
          </div>
        </div>
      </Panel>
    )
  }

  const durationBased = isDurationSession(activeSession)
  const showLoggingView = isSessionInLoggingScreen(activeSession)

  if (durationBased && showLoggingView) {
    return (
      <Panel title="Workout">
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-stone-100">{activeSession.templateName}</p>
              <p className="font-mono text-2xl text-sky-100">{elapsedLabel}</p>
              <p className="text-xs text-stone-500">
                {sessionPhaseLabel(activeSession.status)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeSession.status === 'paused' ? (
                <button
                  type="button"
                  onClick={() => resumeWorkout()}
                  className="rounded-md border border-sky-700/50 bg-sky-900/40 px-2.5 py-1 text-xs text-sky-100"
                >
                  Resume
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => pauseWorkout()}
                  className="rounded-md border border-stone-700/50 px-2.5 py-1 text-xs text-stone-300"
                >
                  Pause
                </button>
              )}
              <button
                type="button"
                onClick={() => enterWorkoutReview()}
                className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-2.5 py-1 text-xs text-emerald-100"
              >
                Stop {activeSession.templateName}
              </button>
              <CancelWorkoutButton onCancel={handleCancelWorkout} />
            </div>
          </div>
        </div>
      </Panel>
    )
  }

  if (!showLoggingView) {
    return null
  }

  return (
    <Panel title="Workout">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium text-stone-100">{activeSession.templateName}</p>
            <p className="text-xs text-stone-500">
              {elapsedLabel}
              {' · '}
              {sessionProgress.completedExerciseCount}/{sessionProgress.exerciseCount} exercises
              {' · '}
              {sessionProgress.completedSets}/{sessionProgress.totalSets} sets
            </p>
            {sessionProgress.circuitCurrentRound != null &&
              sessionProgress.circuitTotalRounds != null && (
                <p className="mt-1 text-xs text-amber-400/80">
                  Circuit {sessionProgress.circuitCurrentRound} /{' '}
                  {sessionProgress.circuitTotalRounds}
                  {sessionProgress.circuitExerciseIndex != null &&
                    sessionProgress.circuitExerciseCount != null && (
                      <>
                        {' · '}
                        Exercise {Math.min(
                          sessionProgress.circuitExerciseIndex + 1,
                          sessionProgress.circuitExerciseCount,
                        )}{' '}
                        / {sessionProgress.circuitExerciseCount}
                      </>
                    )}
                </p>
              )}
          </div>
          <div className="flex flex-wrap gap-2">
            {activeSession.status === 'paused' ? (
              <button
                type="button"
                onClick={() => resumeWorkout()}
                className="rounded-md border border-sky-700/50 bg-sky-900/40 px-2.5 py-1 text-xs text-sky-100"
              >
                Resume
              </button>
            ) : activeSession.status !== 'ready_for_review' ? (
              <button
                type="button"
                onClick={() => pauseWorkout()}
                className="rounded-md border border-stone-700/50 px-2.5 py-1 text-xs text-stone-300"
              >
                Pause
              </button>
            ) : null}
            {shouldShowReviewWorkoutButton(activeSession) && (
              <button
                type="button"
                onClick={() => enterWorkoutReview()}
                className="rounded-md border border-emerald-700/50 bg-emerald-900/40 px-2.5 py-1 text-xs text-emerald-100"
              >
                Review Workout
              </button>
            )}
            <CancelWorkoutButton onCancel={handleCancelWorkout} />
          </div>
        </div>

        <ProgressBar
          completed={sessionProgress.completedSets}
          total={sessionProgress.totalSets}
          color="emerald"
          label="Workout progress"
        />

        <div className="space-y-4">
          {sortedSections.map((section) => {
            const progress = sectionProgress.find(
              (entry) => entry.sectionId === section.sectionId,
            )
            return (
              <Accordion
                key={section.id}
                title={section.name}
                meta={
                  progress
                    ? `${progress.completedExerciseCount}/${progress.exerciseCount} exercises · ${progress.completedSets}/${progress.totalSets} sets`
                    : undefined
                }
                defaultExpanded={progress ? progress.percent < 100 : true}
                persistKey={`workout-active-${section.sectionId}`}
                variant="subcategory"
              >
                <SectionExerciseList
                  section={section}
                  focusedExerciseId={focusedExerciseId}
                  circuitProgress={activeSession.circuitProgress}
                  interactive
                  onSelectExercise={setFocusedExerciseId}
                />
              </Accordion>
            )
          })}
        </div>

        {activeSession.activeRestTimer && (
          <RestTimerPanel
            timer={activeSession.activeRestTimer}
            onPause={() => pauseRestTimer()}
            onResume={() => resumeRestTimer()}
            onStop={() => stopRestTimer()}
            onSkip={() => skipRestTimer()}
          />
        )}

        {focusedExercise && (
          <ExerciseSetLogger
            exercise={focusedExercise}
            circuitProgress={activeSession.circuitProgress}
            activeExerciseTimer={activeSession.activeExerciseTimer}
            weightInput={weightInput}
            repsInput={repsInput}
            onWeightChange={setWeightInput}
            onRepsChange={setRepsInput}
            onToggleSet={(setId) => handleToggleSet(focusedExercise.id, setId)}
            onCompleteSet={(setId) => handleCompleteSet(focusedExercise.id, setId)}
            onStartExerciseTimer={(setId) => startExerciseTimer(focusedExercise.id, setId)}
            onPauseExerciseTimer={() => pauseExerciseTimer()}
            onResumeExerciseTimer={() => resumeExerciseTimer()}
            onStopExerciseTimer={() => stopExerciseTimer()}
            onMarkExerciseTargetReached={() => markExerciseTimerTargetReached()}
          />
        )}
      </div>
    </Panel>
  )
}
