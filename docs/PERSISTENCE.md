# Persistence & Save Schema

Version: aligned with application **v0.0.5** / save schema **0.0.10**

Ascendant persists all game state to browser **localStorage** through a single Zustand store with automatic migrations on load.

---

# Overview

| | |
|---|---|
| **Storage key** | `ascendant-game` (legacy fallback: `ascendant-game-v0.0.1`) |
| **Store** | `src/store/gameStore.ts` |
| **Migration runner** | `src/lib/migrations/migrateSaveData()` |
| **Storage adapter** | `src/lib/migrations/migratingStorage.ts` — runs migrations before hydrate |
| **Current save version** | `0.0.10` (`CURRENT_SAVE_VERSION` in `migrations.ts`) |
| **Application version** | `0.0.5` (`package.json`) |

Save version and application version are related but independent:

- **Application version** — what features ship in a release.
- **Save version** — bumps only when persisted **shape or meaning** changes, triggering a migration.

Some v0.0.2 fields were added with safe defaults in `merge()` without a migration (unlocks, events, lifetimeStats). Newer v0.0.3+ features use explicit migration steps.

---

# Migration Strategy

1. On load, `createMigratingStorage()` reads raw JSON from localStorage.
2. `migrateSaveData()` walks the ordered `MIGRATIONS` table from the save's version to `CURRENT_SAVE_VERSION`.
3. `normalizeShape()` runs idempotently afterward (handles legacy v0.0.2 shape edge cases).
4. Zustand `merge()` fills safe defaults for any missing fields.
5. `onRehydrateStorage` reconciles streak, timed quests, unlocks, achievements, coaching, Hero Identity.

**Adding a migration:**

1. Append `{ fromVersion, toVersion, migrate }` to `MIGRATIONS` in `migrations.ts`.
2. Bump `CURRENT_SAVE_VERSION`.
3. Document the change here and in [CHANGELOG.md](CHANGELOG.md).

---

# Save Version History

| Save version | Application milestone | Change |
|--------------|----------------------|--------|
| *(none)* → **0.0.1** | v0.0.1 | Legacy saves without `saveVersion` |
| **0.0.1 → 0.0.2** | v0.0.2 | Quest `status` enum; Non-Negotiables restructure; quest id renames; completion reward claims |
| **0.0.2 → 0.0.3** | v0.0.3 | `GameState.history` (HeroHistory) |
| **0.0.3 → 0.0.4** | v0.0.3 | `GameState.questHistory`; quest `completedAt` / `completionGrade` |
| **0.0.4 → 0.0.5** | v0.0.4 | `GameState.workout` (WorkoutState) |
| **0.0.5 → 0.0.6** | v0.0.4 | `GameState.performance` (PerformanceState) |
| **0.0.6 → 0.0.7** | v0.0.4 | `GameState.coaching` (CoachingState) |
| **0.0.7 → 0.0.8** | v0.0.4 | `GameState.nutrition` (NutritionState) |
| **0.0.8 → 0.0.9** | v0.0.4 | `GameState.fitnessSettings`; syncs nutrition targets |
| **0.0.9 → 0.0.10** | v0.0.5 | `GameState.heroIdentity` (accomplishment titles, lifetime milestones) |

---

# Persisted GameState Fields

## Core

| Field | Type | Notes |
|-------|------|-------|
| `saveVersion` | `string` | Migration target version |
| `hero` | `Hero` | Level, XP, gold, stats, lifetimeStats |
| `quests` | `QuestState[]` | Per-quest status, completedAt, grade |
| `currentStreak` | `number` | Live streak counter |
| `lastNonNegotiableCompleteDate` | `string \| null` | Quest-day key |
| `completionRewardClaims` | object | Subcategory / weekly claim flags |
| `lastDailyResetDate` | `string \| null` | Daily reset bookkeeping |
| `lastWeeklyResetWeek` | `string \| null` | Weekly reset bookkeeping |

## Unlocks & Summary

| Field | Type | Notes |
|-------|------|-------|
| `unlocks` | `UnlockState[]` | Recomputed from quest state |
| `dailySummary` | `SummarySnapshot \| null` | Live or frozen daily recap |
| `dailySummaryViewed` | `boolean` | Banner viewed state |
| `dayStartHeroSnapshot` | `DayStartHeroSnapshot` | Diff basis for daily earnings |

## Events & History

| Field | Type | Notes |
|-------|------|-------|
| `events` | `GameEvent[]` | **Recent buffer** (max 50) — not long-term history |
| `history` | `HeroHistory` | Append-only daily snapshots |
| `questHistory` | `QuestHistory` | Per-quest completions and misses |

## Fitness (v0.0.4)

| Field | Type | Notes |
|-------|------|-------|
| `workout` | `WorkoutState` | Templates, sessions, activities |
| `performance` | `PerformanceState` | Assessments, official PRs, PR history |
| `coaching` | `CoachingState` | Active recommendations + history |
| `nutrition` | `NutritionState` | Meal activities + targets (mirrored from settings) |
| `fitnessSettings` | `FitnessSettings` | Player targets and unit preferences |
| `heroIdentity` | `HeroIdentityState` | Accomplishment titles and lifetime milestone unlocks |

## Meta

| Field | Type | Notes |
|-------|------|-------|
| `achievements` | `AchievementState[]` | Unlock timestamps |
| `devSimulatedTime` | `string \| null` | Dev-only persisted time override |
| `devHeroTime` | config \| null | Dev Hero Time configuration |

---

# What Gets Written When

| Action | Persisted updates |
|--------|-------------------|
| `completeQuest()` | hero, quests, streak, unlocks, achievements, events, questHistory, lifetimeStats, dailySummary |
| `completeWorkout()` | workout, quests (via completeQuest), events, coaching |
| `logMeal()` | nutrition, quests (via completeQuest), events |
| `deleteMealActivity()` | nutrition, quests (revert), unlocks, streak reconcile |
| Assessment complete | performance, events (PR achieved) |
| Coaching refresh | coaching, events (recommendation) |
| Day advance (`applyPeriodResets`) | quests reset, history snapshot, dailySummary finalize, dayStartHeroSnapshot, syncHeroIdentity |
| Hero Identity sync | heroIdentity, events (on live accomplishment/title unlock) |

---

# Nested Schema Versions

Some blocks carry their own `schemaVersion` for forward-compatible evolution:

| Block | Current schema version |
|-------|------------------------|
| `HeroHistory` | 1 |
| `QuestHistory` | 1 |
| `WorkoutState` | 1 (template schema 4 — see WORKOUT_DATA.md) |
| `PerformanceState` | 1 |
| `CoachingState` | 1 |
| `NutritionState` | 1 |
| `FitnessSettings` | 1 |
| `HeroIdentityState` | 1 |

---

# Non-Persisted UI State

These are intentionally **outside** GameState:

- Accordion expand/collapse — `localStorage` key `ascendant-accordion:*`
- Achievement unlock popup queue — ephemeral React state
- Dashboard scroll / modal open state

---

# Backward Compatibility

- Saves from any prior version load through the migration chain automatically.
- Missing fields default safely in `merge()` — no data loss for additive changes.
- Dev-only fields (`devSimulatedTime`) default to `null` (real time) on old saves.

---

# Related

- [ARCHITECTURE.md](ARCHITECTURE.md) — subsystem map
- [HISTORY.md](HISTORY.md) — snapshot write path
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) — how to add persistence for new systems
