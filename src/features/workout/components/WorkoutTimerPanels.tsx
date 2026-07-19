import { useEffect } from 'react'

import { ProgressBar } from '@/components/ProgressBar'
import {
  computeExerciseTimerElapsedMs,
  computeRestTimerElapsedMs,
} from '@/features/workout/workoutTimingLogic'
import { useWallTimerLabel } from '@/features/workout/useWorkoutTimer'
import { formatWallClockDurationWithCentiseconds } from '@/lib/workoutWallClock'
import type { ActiveExerciseTimer, ActiveRestTimer } from '@/types/workout'

interface ExerciseTimerPanelProps {
  plannedDurationSeconds: number
  timer: ActiveExerciseTimer | null
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onTargetReached?: () => void
}

export function ExerciseTimerPanel({
  plannedDurationSeconds,
  timer,
  onStart,
  onPause,
  onResume,
  onStop,
  onTargetReached,
}: ExerciseTimerPanelProps) {
  const wallTimer = timer?.timer ?? {
    wallStartedAtMs: null,
    accumulatedPausedMs: 0,
    pausedAtWallMs: null,
    completedElapsedMs: null,
  }
  const isRunning = wallTimer.pausedAtWallMs == null && wallTimer.wallStartedAtMs != null
  const elapsedMs = timer ? computeExerciseTimerElapsedMs(timer) : 0
  const targetMs = plannedDurationSeconds * 1000
  const targetReached = timer?.targetReached || elapsedMs >= targetMs
  const label = useWallTimerLabel(
    () => (timer ? computeExerciseTimerElapsedMs(timer) : 0),
    isRunning,
  )

  useEffect(() => {
    if (!timer || timer.targetReached || elapsedMs < targetMs || !onTargetReached) return
    onTargetReached()
  }, [timer, timer?.targetReached, elapsedMs, targetMs, onTargetReached])

  return (
    <div className="mt-3 rounded-lg border border-sky-800/40 bg-sky-950/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-sky-300/80">
          Timed exercise
        </p>
        {targetReached && (
          <span className="rounded-full border border-emerald-700/50 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-200">
            Target reached
          </span>
        )}
      </div>
      <p className="font-mono text-2xl text-sky-100">
        {formatWallClockDurationWithCentiseconds(elapsedMs)}
        <span className="text-sm text-stone-500">
          {' '}
          / {formatWallClockDurationWithCentiseconds(targetMs)}
        </span>
      </p>
      <div className="my-2">
        <ProgressBar
          completed={Math.min(elapsedMs, targetMs)}
          total={targetMs}
          color="sky"
          label={label}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {wallTimer.wallStartedAtMs == null ? (
          <button
            type="button"
            onClick={onStart}
            className="rounded border border-sky-700/50 px-2 py-1 text-xs text-sky-100"
          >
            Start Timer
          </button>
        ) : isRunning ? (
          <button
            type="button"
            onClick={onPause}
            className="rounded border border-stone-700/50 px-2 py-1 text-xs text-stone-300"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={onResume}
            className="rounded border border-sky-700/50 px-2 py-1 text-xs text-sky-100"
          >
            Resume
          </button>
        )}
        {wallTimer.wallStartedAtMs != null && (
          <button
            type="button"
            onClick={onStop}
            className="rounded border border-emerald-700/50 px-2 py-1 text-xs text-emerald-100"
          >
            Stop
          </button>
        )}
      </div>
    </div>
  )
}

interface RestTimerPanelProps {
  timer: ActiveRestTimer
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onSkip: () => void
}

export function RestTimerPanel({
  timer,
  onPause,
  onResume,
  onStop,
  onSkip,
}: RestTimerPanelProps) {
  const isRunning = timer.timer.pausedAtWallMs == null
  const elapsedMs = computeRestTimerElapsedMs(timer)
  const targetMs = timer.plannedSeconds * 1000
  const label = useWallTimerLabel(() => computeRestTimerElapsedMs(timer), isRunning)

  return (
    <div className="rounded-lg border border-violet-800/40 bg-violet-950/20 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-widest text-violet-300/80">
          {timer.kind === 'circuit' ? 'Circuit rest' : `Rest · ${timer.kind}`}
        </p>
        {elapsedMs >= targetMs && (
          <span className="text-[10px] text-violet-200/80">Rest complete</span>
        )}
      </div>
      <p className="font-mono text-xl text-violet-100">
        {formatWallClockDurationWithCentiseconds(elapsedMs)}
        <span className="text-sm text-stone-500">
          {' '}
          / {formatWallClockDurationWithCentiseconds(targetMs)}
        </span>
      </p>
      <div className="my-2">
        <ProgressBar
          completed={Math.min(elapsedMs, targetMs)}
          total={targetMs}
          color="amber"
          label={label}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {isRunning ? (
          <button
            type="button"
            onClick={onPause}
            className="rounded border border-stone-700/50 px-2 py-1 text-xs text-stone-300"
          >
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={onResume}
            className="rounded border border-violet-700/50 px-2 py-1 text-xs text-violet-100"
          >
            Resume
          </button>
        )}
        <button
          type="button"
          onClick={onStop}
          className="rounded border border-violet-700/50 px-2 py-1 text-xs text-violet-100"
        >
          Stop
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded border border-stone-700/50 px-2 py-1 text-xs text-stone-300"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
