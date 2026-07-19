/**
 * Hero Time — the in-game calendar clock used for quests, Hero Days, history
 * timestamps, and analytics dates. May be simulated in development.
 *
 * Workout session/exercise/rest timers use wall clock (`Date.now()`) via
 * `workoutWallClock.ts` and are intentionally independent of Hero Time.
 */

export type HeroTimeMode = 'live' | 'simulated_running' | 'simulated_frozen'

export interface HeroTimePersistedConfig {
  mode: HeroTimeMode
  /** ISO instant for frozen mode, or anchor sim time when running. */
  simTimeIso: string | null
  /** Wall-clock ms when sim_running anchor was recorded (re-anchored on load). */
  anchorWallMs: number | null
}

type Listener = () => void

interface HeroTimeRuntime {
  mode: HeroTimeMode
  frozenSimMs: number | null
  anchorWallMs: number | null
  anchorSimMs: number | null
}

let runtime: HeroTimeRuntime = {
  mode: 'live',
  frozenSimMs: null,
  anchorWallMs: null,
  anchorSimMs: null,
}

const listeners = new Set<Listener>()
let cachedSnapshot: Date | null = null

function refreshSnapshot(): void {
  cachedSnapshot = getCurrentGameTime()
}

function notify(): void {
  refreshSnapshot()
  listeners.forEach((listener) => listener())
}

export function getCurrentGameTime(): Date {
  if (runtime.mode === 'live') return new Date()
  if (runtime.mode === 'simulated_frozen' && runtime.frozenSimMs != null) {
    return new Date(runtime.frozenSimMs)
  }
  if (
    runtime.mode === 'simulated_running' &&
    runtime.anchorWallMs != null &&
    runtime.anchorSimMs != null
  ) {
    return new Date(runtime.anchorSimMs + (Date.now() - runtime.anchorWallMs))
  }
  return new Date()
}

export function getGameTimeSnapshot(): Date {
  if (!cachedSnapshot) cachedSnapshot = getCurrentGameTime()
  return cachedSnapshot
}

export function getHeroTimeMode(): HeroTimeMode {
  return runtime.mode
}

export function isGameTimeSimulated(): boolean {
  return runtime.mode !== 'live'
}

export function getSimulatedTimeOverride(): Date | null {
  if (runtime.mode === 'live') return null
  return getCurrentGameTime()
}

export function getHeroTimePersistedConfig(): HeroTimePersistedConfig {
  if (runtime.mode === 'live') {
    return { mode: 'live', simTimeIso: null, anchorWallMs: null }
  }
  if (runtime.mode === 'simulated_frozen' && runtime.frozenSimMs != null) {
    return {
      mode: 'simulated_frozen',
      simTimeIso: new Date(runtime.frozenSimMs).toISOString(),
      anchorWallMs: null,
    }
  }
  const sim = getCurrentGameTime()
  return {
    mode: 'simulated_running',
    simTimeIso: sim.toISOString(),
    anchorWallMs: Date.now(),
  }
}

export function restoreHeroTimeConfig(config: HeroTimePersistedConfig | null | undefined): void {
  if (!config || config.mode === 'live') {
    runtime = { mode: 'live', frozenSimMs: null, anchorWallMs: null, anchorSimMs: null }
    refreshSnapshot()
    return
  }

  const simMs = config.simTimeIso ? new Date(config.simTimeIso).getTime() : Date.now()
  if (Number.isNaN(simMs)) {
    runtime = { mode: 'live', frozenSimMs: null, anchorWallMs: null, anchorSimMs: null }
    refreshSnapshot()
    return
  }

  if (config.mode === 'simulated_frozen') {
    runtime = {
      mode: 'simulated_frozen',
      frozenSimMs: simMs,
      anchorWallMs: null,
      anchorSimMs: null,
    }
  } else {
    runtime = {
      mode: 'simulated_running',
      frozenSimMs: null,
      anchorWallMs: Date.now(),
      anchorSimMs: simMs,
    }
  }
  refreshSnapshot()
}

export function setSimulatedGameTime(date: Date): void {
  if (!import.meta.env.DEV) return
  runtime = {
    mode: 'simulated_running',
    frozenSimMs: null,
    anchorWallMs: Date.now(),
    anchorSimMs: date.getTime(),
  }
  notify()
}

export function freezeSimulatedGameTime(): void {
  if (!import.meta.env.DEV) return
  const current = getCurrentGameTime()
  runtime = {
    mode: 'simulated_frozen',
    frozenSimMs: current.getTime(),
    anchorWallMs: null,
    anchorSimMs: null,
  }
  notify()
}

export function resumeSimulatedGameTimeProgression(): void {
  if (!import.meta.env.DEV) return
  if (runtime.mode !== 'simulated_frozen' || runtime.frozenSimMs == null) return
  runtime = {
    mode: 'simulated_running',
    frozenSimMs: null,
    anchorWallMs: Date.now(),
    anchorSimMs: runtime.frozenSimMs,
  }
  notify()
}

export function advanceSimulatedGameTime(ms: number): void {
  if (!import.meta.env.DEV) return
  const current = getCurrentGameTime()
  setSimulatedGameTime(new Date(current.getTime() + ms))
}

export function clearSimulatedGameTime(): void {
  if (!import.meta.env.DEV) return
  runtime = { mode: 'live', frozenSimMs: null, anchorWallMs: null, anchorSimMs: null }
  notify()
}

export function subscribeToGameTimeChanges(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** @deprecated Use getHeroTimeMode — kept for existing call sites. */
export function setSimulatedGameTimeLegacy(date: Date): void {
  setSimulatedGameTime(date)
}
