import type { PersistStorage, StorageValue } from 'zustand/middleware'

import { migrateSaveData } from '@/lib/migrations/migrations'

/**
 * Key used by Ascendant before save versioning existed (v0.0.1). Checked as
 * a one-time fallback so pre-existing saves aren't lost when the storage
 * key becomes version-agnostic.
 */
const LEGACY_STORAGE_KEY = 'ascendant-game-v0.0.1'

/**
 * Wraps localStorage so persisted state is migrated to the current save
 * version before Zustand's `persist` middleware ever sees it. Keeps all
 * migration logic out of the store itself.
 */
export function createMigratingStorage<S>(): PersistStorage<S> {
  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
      if (!raw) return null

      try {
        const parsed = JSON.parse(raw) as StorageValue<unknown>
        const migratedState = migrateSaveData(parsed.state)
        return { ...parsed, state: migratedState } as StorageValue<S>
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      localStorage.setItem(name, JSON.stringify(value))
    },
    removeItem: (name) => {
      localStorage.removeItem(name)
    },
  }
}
