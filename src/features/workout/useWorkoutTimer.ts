import { useEffect, useState } from 'react'

import { computeSessionElapsedMs } from '@/features/workout/workoutTimingLogic'
import { formatWallClockDuration } from '@/lib/workoutWallClock'
import type { WorkoutSession } from '@/types/workout'

/** Live workout session timer label — wall clock, independent of Hero Time. */
export function useWorkoutElapsedLabel(session: WorkoutSession | null): string {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!session) return

    const sessionRunning =
      session.status === 'in_progress' || session.status === 'ready_for_review'
    const exerciseRunning =
      session.activeExerciseTimer?.timer.wallStartedAtMs != null &&
      session.activeExerciseTimer.timer.pausedAtWallMs == null
    const restRunning =
      session.activeRestTimer?.timer.wallStartedAtMs != null &&
      session.activeRestTimer.timer.pausedAtWallMs == null

    if (!sessionRunning && !exerciseRunning && !restRunning) return

    const id = window.setInterval(() => setTick((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [
    session?.id,
    session?.status,
    session?.activeExerciseTimer?.timer.pausedAtWallMs,
    session?.activeExerciseTimer?.timer.wallStartedAtMs,
    session?.activeRestTimer?.timer.pausedAtWallMs,
    session?.activeRestTimer?.timer.wallStartedAtMs,
  ])

  if (!session) return '0:00'
  void tick
  return formatWallClockDuration(computeSessionElapsedMs(session))
}

export function useWallTimerLabel(
  getElapsedMs: () => number,
  isRunning: boolean,
): string {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!isRunning) return
    const id = window.setInterval(() => setTick((value) => value + 1), 1000)
    return () => window.clearInterval(id)
  }, [isRunning])
  void tick
  return formatWallClockDuration(getElapsedMs())
}
