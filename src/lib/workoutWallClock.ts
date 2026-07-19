/**
 * Wall-clock timer utilities for workout timing.
 *
 * Uses `Date.now()` — real elapsed time independent of Hero Time simulation.
 * Hero Time is only used for workout start/completion calendar timestamps.
 */

export interface WallClockTimer {
  wallStartedAtMs: number | null
  accumulatedPausedMs: number
  pausedAtWallMs: number | null
  completedElapsedMs: number | null
}

export function createWallClockTimer(): WallClockTimer {
  return {
    wallStartedAtMs: null,
    accumulatedPausedMs: 0,
    pausedAtWallMs: null,
    completedElapsedMs: null,
  }
}

export function nowWallMs(): number {
  return Date.now()
}

export function startWallClockTimer(
  timer: WallClockTimer,
  atMs: number = nowWallMs(),
): WallClockTimer {
  return {
    ...timer,
    wallStartedAtMs: atMs,
    pausedAtWallMs: null,
    accumulatedPausedMs: timer.accumulatedPausedMs ?? 0,
    completedElapsedMs: null,
  }
}

export function pauseWallClockTimer(
  timer: WallClockTimer,
  atMs: number = nowWallMs(),
): WallClockTimer {
  if (timer.wallStartedAtMs == null || timer.pausedAtWallMs != null) return timer
  return { ...timer, pausedAtWallMs: atMs }
}

export function resumeWallClockTimer(
  timer: WallClockTimer,
  atMs: number = nowWallMs(),
): WallClockTimer {
  if (timer.pausedAtWallMs == null) return timer
  const pauseDuration = Math.max(0, atMs - timer.pausedAtWallMs)
  return {
    ...timer,
    pausedAtWallMs: null,
    accumulatedPausedMs: timer.accumulatedPausedMs + pauseDuration,
  }
}

export function completeWallClockTimer(
  timer: WallClockTimer,
  atMs: number = nowWallMs(),
): WallClockTimer {
  const running = timer.pausedAtWallMs != null ? resumeWallClockTimer(timer, atMs) : timer
  return {
    ...running,
    completedElapsedMs: computeWallClockElapsedMs(running, atMs),
    pausedAtWallMs: atMs,
  }
}

export function computeWallClockElapsedMs(
  timer: WallClockTimer,
  atMs: number = nowWallMs(),
): number {
  if (timer.completedElapsedMs != null) return timer.completedElapsedMs
  if (timer.wallStartedAtMs == null) return 0
  const end = timer.pausedAtWallMs ?? atMs
  return Math.max(0, end - timer.wallStartedAtMs - (timer.accumulatedPausedMs ?? 0))
}

export function formatWallClockDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function formatWallClockDurationWithCentiseconds(ms: number): string {
  const totalSeconds = Math.max(0, ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = Math.floor(totalSeconds % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
