import { useEffect, useRef, useState } from 'react'

import type { AchievementDefinition, AchievementState } from '@/types/achievement'

const POPUP_DURATION_MS = 5000

/**
 * Diffs `states` render-over-render to detect achievements that just
 * flipped locked → unlocked, queuing them as transient "Achievement
 * Unlocked!" popups. Deliberately kept out of the persisted store — the
 * store only needs to know the authoritative unlocked/unlockedAt record;
 * "is a toast showing right now" is presentation-only, ephemeral UI state
 * that resets on reload, same as `Dashboard.tsx`'s `isSummaryOpen`. Shows
 * one at a time, auto-advancing through the queue.
 */
export function useAchievementUnlockPopups(
  definitions: AchievementDefinition[],
  states: AchievementState[],
): {
  current: AchievementDefinition | null
  dismissCurrent: () => void
} {
  const previousUnlockedRef = useRef<Set<string>>(
    new Set(states.filter((s) => s.unlocked).map((s) => s.id)),
  )
  const [queue, setQueue] = useState<AchievementDefinition[]>([])

  useEffect(() => {
    const currentUnlocked = new Set(states.filter((s) => s.unlocked).map((s) => s.id))
    const newlyUnlocked = definitions.filter(
      (d) => currentUnlocked.has(d.id) && !previousUnlockedRef.current.has(d.id),
    )
    previousUnlockedRef.current = currentUnlocked

    if (newlyUnlocked.length > 0) {
      setQueue((prev) => [...prev, ...newlyUnlocked])
    }
  }, [definitions, states])

  useEffect(() => {
    if (queue.length === 0) return
    const timer = setTimeout(() => setQueue((prev) => prev.slice(1)), POPUP_DURATION_MS)
    return () => clearTimeout(timer)
  }, [queue])

  return {
    current: queue[0] ?? null,
    dismissCurrent: () => setQueue((prev) => prev.slice(1)),
  }
}
