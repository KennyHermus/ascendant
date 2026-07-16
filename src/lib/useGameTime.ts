import { useSyncExternalStore } from 'react'

import {
  getGameTimeSnapshot,
  subscribeToGameTimeChanges,
} from '@/lib/gameTime'

/**
 * Subscribes a component to the centralized game-time provider.
 *
 * Simulated-time changes call `notify()`, which invalidates this snapshot and
 * re-renders dependents (timed-quest badges, countdowns, availability). Real
 * time does not tick on a background timer — matching the app's evaluation
 * model (load / resume / explicit sim actions only).
 */
export function useGameTime(): Date {
  return useSyncExternalStore(
    subscribeToGameTimeChanges,
    getGameTimeSnapshot,
    getGameTimeSnapshot,
  )
}
