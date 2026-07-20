import type { SaveMigration } from '@/lib/migrations/types'

/**
 * Semantic save version, kept aligned with the app/git version.
 * Bump this whenever the persisted shape changes, and add a migration below.
 */
export const CURRENT_SAVE_VERSION = '0.0.6'

/**
 * Saves written before `saveVersion` existed have no version field at all.
 * Treat that as this baseline so the migration table below has an explicit
 * starting point.
 */
export const LEGACY_SAVE_VERSION = '0.0.1'

/**
 * Ordered upgrade steps. To add a future migration, append a new entry
 * (e.g. `{ fromVersion: '0.0.3', toVersion: '0.0.4', migrate: ... }`) and
 * bump `CURRENT_SAVE_VERSION`. No other file needs to change.
 */
const MIGRATIONS: SaveMigration[] = [
  {
    fromVersion: LEGACY_SAVE_VERSION,
    toVersion: '0.0.2',
    // v0.0.2 combined two changes to the quest shape, developed as separate
    // features but shipped together:
    //  1. `completed` boolean -> `status` enum ('available'|'completed'|'missed'), for Timed Quests.
    //  2. Categories restructured (`dailyCore` -> `nonNegotiable` split into
    //     3 subcategories; new `weeklyBonus` category) and 3 quests renamed,
    //     for the Non-Negotiables/streak overhaul.
    migrate: (state) => {
      const idRenames: Record<string, string> = {
        walk: 'morning-walk',
        'bible-reading': 'bible',
        'extra-learning': 'read',
      }

      const quests = Array.isArray(state.quests)
        ? state.quests.map(
            (quest: { id: string; completed?: boolean; status?: string }) => ({
              id: idRenames[quest.id] ?? quest.id,
              status: quest.status ?? (quest.completed ? 'completed' : 'available'),
            }),
          )
        : state.quests

      const oldClaims = (state.completionRewardClaims ?? {}) as Record<
        string,
        boolean
      >

      const { lastDailyCoreCompleteDate, completionRewardClaims: _oldClaims, ...rest } =
        state

      return {
        ...rest,
        saveVersion: '0.0.2',
        quests,
        lastNonNegotiableCompleteDate: lastDailyCoreCompleteDate ?? null,
        completionRewardClaims: {
          // dailyCore split into 3 subcategories with no clean 1:1 mapping;
          // start them unclaimed rather than risk over-crediting a claim.
          morningRoutine: false,
          nutrition: false,
          eveningRoutine: false,
          weekly: oldClaims.weekly ?? false,
          weeklyBonus: oldClaims.weeklyBonus ?? false,
          special: oldClaims.special ?? false,
        },
      }
    },
  },
  {
    fromVersion: '0.0.2',
    toVersion: '0.0.3',
    // v0.0.3 History Foundation: long-term `HeroHistory` with append-only
    // daily snapshots. Empty history is a safe default for prior saves.
    migrate: (state) => ({
      ...state,
      saveVersion: '0.0.3',
      history: state.history ?? {
        schemaVersion: 1,
        dailySnapshots: [],
      },
    }),
  },
  {
    fromVersion: '0.0.3',
    toVersion: '0.0.4',
    migrate: (state) => ({
      ...state,
      saveVersion: '0.0.4',
      questHistory: state.questHistory ?? {
        schemaVersion: 1,
        completions: [],
        misses: [],
      },
      quests: Array.isArray(state.quests)
        ? state.quests.map((q: { id: string; status: string; completedAt?: string | null; completionGrade?: string | null }) => ({
            id: q.id,
            status: q.status,
            completedAt: q.completedAt ?? null,
            completionGrade: q.completionGrade ?? null,
          }))
        : state.quests,
    }),
  },
  {
    fromVersion: '0.0.4',
    toVersion: '0.0.5',
    // v0.0.4 Fitness Foundation: Activity layer + Workout persistence.
    migrate: (state) => ({
      ...state,
      saveVersion: '0.0.5',
      workout: state.workout ?? {
        schemaVersion: 1,
        templates: [],
        sessions: [],
        activities: [],
        activeSessionId: null,
      },
    }),
  },
  {
    fromVersion: '0.0.5',
    toVersion: '0.0.6',
    // v0.0.4 Performance & PR system — assessments, official records, PR history.
    migrate: (state) => ({
      ...state,
      saveVersion: '0.0.6',
      performance: state.performance ?? {
        schemaVersion: 1,
        exerciseFamilies: [],
        officialRecords: [],
        prHistory: [],
        assessments: [],
        sessions: [],
        activeSessionId: null,
        baselineCompletedAt: null,
      },
    }),
  },
]

/**
 * Idempotent shape normalization, run in addition to (not instead of) the
 * version-keyed migration chain above.
 *
 * v0.0.2 was developed as two features (Timed Quests, then the
 * Non-Negotiables restructure) that both shipped under the same save
 * version. A save written mid-development may already carry
 * `saveVersion: "0.0.2"` under the *older* of those two shapes, so it
 * wouldn't hit the migration step above (its version already matches
 * `CURRENT_SAVE_VERSION`). This pass detects and fixes that regardless of
 * the version string, so it's safe to run on every load.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeShape(state: any): any {
  if (!state) return state

  const idRenames: Record<string, string> = {
    walk: 'morning-walk',
    'bible-reading': 'bible',
    'extra-learning': 'read',
  }

  const quests = Array.isArray(state.quests)
    ? state.quests.map(
        (quest: { id: string; completed?: boolean; status?: string }) => ({
          id: idRenames[quest.id] ?? quest.id,
          status: quest.status ?? (quest.completed ? 'completed' : 'available'),
        }),
      )
    : state.quests

  const claims = state.completionRewardClaims as
    | Record<string, boolean>
    | undefined
  const hasCurrentClaimShape =
    !!claims &&
    'morningRoutine' in claims &&
    'nutrition' in claims &&
    'eveningRoutine' in claims

  const lastNonNegotiableCompleteDate =
    state.lastNonNegotiableCompleteDate ??
    state.lastDailyCoreCompleteDate ??
    null

  if (
    quests === state.quests &&
    hasCurrentClaimShape &&
    state.lastNonNegotiableCompleteDate !== undefined &&
    state.lastDailyCoreCompleteDate === undefined
  ) {
    return state
  }

  const { lastDailyCoreCompleteDate: _old, ...rest } = state

  return {
    ...rest,
    quests,
    lastNonNegotiableCompleteDate,
    completionRewardClaims: hasCurrentClaimShape
      ? claims
      : {
          morningRoutine: false,
          nutrition: false,
          eveningRoutine: false,
          weekly: claims?.weekly ?? false,
          weeklyBonus: claims?.weeklyBonus ?? false,
          special: claims?.special ?? false,
        },
  }
}

/**
 * Upgrades persisted state through the migration chain until it matches
 * `CURRENT_SAVE_VERSION`, then normalizes the shape defensively. Safe to
 * call on already-current or missing state.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSaveData(rawState: any): any {
  if (!rawState) return rawState

  let state = rawState
  let currentVersion: string = state.saveVersion ?? LEGACY_SAVE_VERSION

  while (currentVersion !== CURRENT_SAVE_VERSION) {
    const migration = MIGRATIONS.find((m) => m.fromVersion === currentVersion)

    if (!migration) {
      console.warn(
        `[ascendant] No migration path from save version "${currentVersion}" to "${CURRENT_SAVE_VERSION}". Leaving save as-is.`,
      )
      break
    }

    state = migration.migrate(state)
    currentVersion = migration.toVersion
  }

  return normalizeShape(state)
}
