/**
 * Centralized time provider. The rest of the app calls `getCurrentGameTime()`
 * instead of `new Date()`, so a developer-only time override transparently
 * flows through streak, reset, and timed-quest logic without any of it
 * knowing time is simulated.
 *
 * Setters no-op outside development builds, so production behavior is
 * always real time regardless of any stray call.
 */

type Listener = () => void

let overrideTime: Date | null = null
const listeners = new Set<Listener>()

// Cached for `getGameTimeSnapshot()` — `useSyncExternalStore` requires its
// snapshot getter to return a referentially stable value between calls
// unless the store actually changed. `getCurrentGameTime()` intentionally
// returns a fresh, ever-changing real-time `Date` and must NOT be used as
// that snapshot (doing so caused an infinite render loop).
let cachedSnapshot: Date | null = null

function refreshSnapshot(): void {
  cachedSnapshot = getCurrentGameTime()
}

function notify(): void {
  refreshSnapshot()
  listeners.forEach((listener) => listener())
}

export function getCurrentGameTime(): Date {
  return overrideTime ? new Date(overrideTime.getTime()) : new Date()
}

/**
 * Stable snapshot for `useSyncExternalStore` (dev-only time display).
 * Only changes when a simulation action fires `notify()` — matches the
 * "no background timers" constraint, so it won't tick live in real-time mode.
 */
export function getGameTimeSnapshot(): Date {
  if (!cachedSnapshot) {
    cachedSnapshot = getCurrentGameTime()
  }
  return cachedSnapshot
}

export function isGameTimeSimulated(): boolean {
  return overrideTime !== null
}

export function getSimulatedTimeOverride(): Date | null {
  return overrideTime ? new Date(overrideTime.getTime()) : null
}

export function setSimulatedGameTime(date: Date): void {
  if (!import.meta.env.DEV) return
  overrideTime = date
  notify()
}

export function advanceSimulatedGameTime(ms: number): void {
  if (!import.meta.env.DEV) return
  const base = overrideTime ?? new Date()
  overrideTime = new Date(base.getTime() + ms)
  notify()
}

export function clearSimulatedGameTime(): void {
  if (!import.meta.env.DEV) return
  if (overrideTime === null) return
  overrideTime = null
  notify()
}

/** For `useSyncExternalStore` in dev-only UI that displays the current game time. */
export function subscribeToGameTimeChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
