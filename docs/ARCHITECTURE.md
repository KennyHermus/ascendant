# Ascendant Technical Architecture

Version: 0.1

---

# Overview

Ascendant is a React + TypeScript application built as a modular game system.

The architecture separates:

- Presentation
- Game logic
- Data
- State
- Configuration

The goal is to allow the game to expand for years without becoming difficult to maintain.

---

# Technology Stack

## Frontend

- React
- TypeScript
- Vite

---

## Styling

Primary:

- Tailwind CSS

Future:

- Component libraries where appropriate

---

## State Management

Zustand

Used for:

- Player state
- Progression state
- Quest state
- Settings

---



## Persistence

Initial:

Browser local storage

Future:

Cloud database synchronization

---

## v0.0.1 Implementation Notes

Stats use a `StatState` wrapper (`{ value: number }`) per attribute so future per-stat XP fields can be added without restructuring `HeroStats`.

Quest completion is one-way: rewards apply once and quests stay completed until daily or weekly reset.

Streak tracking requires all daily core quests (`dailyCore` category) to be completed. Daily bonus quests are tracked separately and do not affect streak.

Category completion bonuses are defined in `src/data/completionRewards.ts` and granted once per period via `completionRewardClaims` in persisted state.

---

## v0.0.2 Implementation Notes — Timed Quests, Quest Restructure, Time Simulation

v0.0.2 was developed as two features shipped together under the same save version: Timed Quests, followed by the Non-Negotiables quest restructure + developer time simulation. Both are documented below.

### Feature 1 — Timed Quests

`QuestState.completed` (boolean) was replaced with `QuestState.status`: `'available' | 'completed' | 'missed'`. This is applied consistently across `questLogic.ts`, the store, and quest UI components.

`QuestDefinition` gained an optional `timing` field (`{ targetTime: "HH:mm", graceMinutes }`). Quests without `timing` behave exactly as before.

Timing evaluation (`src/features/quests/questTiming.ts`) is deliberately independent of quest status:

- `evaluateQuestTiming()` — pure function returning the current phase (`onTime` / `inGracePeriod` / `expired`) for display/urgency purposes.
- `sweepExpiredTimedQuests()` — transitions `available` quests past their deadline to `missed`.

"Grace Period" is a timing phase, not a quest status — the status enum stays exactly `available` / `completed` / `missed` per the game design docs.

Evaluation runs only on: app load, persisted-state rehydrate, and the tab regaining visibility (`visibilitychange`). There are no background timers, per design constraint. This means a timed quest's displayed urgency can be briefly stale until the next such event.

A `targetTime` of `"00:00"` is treated as "the upcoming midnight" (end of the current day) so "before midnight" quests like Sleep behave correctly throughout the day.

Missed quests grant no rewards and no penalties, and cannot be completed — `completeQuest` sweeps expired quests before attempting completion, closing the race between an expired deadline and a stale `available` status.

### Save Versioning & Migrations

Persisted state carries a top-level `saveVersion` field (`GameState.saveVersion`), aligned with the app's semantic version (e.g. `"0.0.2"` for git `v0.0.2`).

Migrations are centralized in `src/lib/migrations/`:

- `migrations.ts` — `CURRENT_SAVE_VERSION`, `LEGACY_SAVE_VERSION`, and an ordered `MIGRATIONS` table. `migrateSaveData()` walks a save forward one step at a time until it matches the current version, then runs an idempotent `normalizeShape()` pass (see note below).
- `migratingStorage.ts` — a custom Zustand `PersistStorage` adapter that runs `migrateSaveData()` on read, before the store ever sees the data. It also falls back to the old literal key (`ascendant-game-v0.0.1`) once, so pre-existing saves aren't lost when the storage key became version-agnostic (`ascendant-game`).

The Zustand store only wires in `storage: createMigratingStorage()` — it contains no migration rules itself. Adding a future migration means appending one entry to `MIGRATIONS` and bumping `CURRENT_SAVE_VERSION`; no other file changes.

**Why `normalizeShape()` exists**: v0.0.2's two features both wrote `saveVersion: "0.0.2"`, but the quest restructure changed the shape again *after* that version number was already in use during development. A save tagged `"0.0.2"` could therefore be in either shape. Since version-matching alone can't disambiguate two shapes sharing one version string, `migrateSaveData()` always runs a normalization pass after the version loop — it detects and fixes the older shape's field names regardless of the version string, and is a no-op on already-current data. This is a one-off consequence of not bumping the version mid-feature; future shape changes should get their own version bump and migration step instead of relying on this pass.

---

## Non-Negotiables Restructure & Time Simulation (also v0.0.2)

### Data-driven scheduling instead of hardcoded requirement lists

`QuestDefinition` gained `subcategory` (`morningRoutine` | `nutrition` | `eveningRoutine`, only meaningful for `nonNegotiable`), `schedule` (`{ weekdaysOnly?, streakOnlyOnWeekdays? }`), `contributesToStreak`, and `optional`. There is deliberately no separate "required quests today" list anywhere — `src/features/quests/questSchedule.ts` derives it from the data:

- `isQuestActiveOn(definition, date)` — whether the quest appears at all today (`weekdaysOnly` quests vanish on weekends).
- `questContributesToStreakOn(definition, date)` — the single source of truth for "is this quest required today," used identically by streak resolution, subcategory completion rewards, and quest list grouping. UI components never re-implement this check.
- `getEffectiveCategory(definition, date)` — resolves a quest's display category for today (e.g. Learning/Work reads as `dailyBonus` on weekends even though its static `category` is always `nonNegotiable`).

### Quest categories

`dailyCore` was replaced by `nonNegotiable` (now split into the three subcategories above) and a new `weeklyBonus` category was added. `QuestCategory` is `'nonNegotiable' | 'dailyBonus' | 'weekly' | 'weeklyBonus' | 'special'`.

### Streak & completion rewards generalized to "reward groups"

`questLogic.ts` replaced category-specific completion functions with a generic reward-group model (`getGroupCompletionStatus()`), where a group is one of the three non-negotiable subcategories or `weekly` / `weeklyBonus` / `special`. `getNonNegotiableCompletionStatus()` aggregates all three subcategories for streak purposes. `completionRewardLogic.ts` iterates `COMPLETION_REWARD_KEYS` generically rather than switching on category by name.

### Centralized time provider (`src/lib/gameTime.ts`)

All `new Date()` calls used for date/time logic (daily/weekly reset keys, streak day comparison, timed-quest evaluation) now go through `getCurrentGameTime()`. This is a small always-shipped module — its setters (`setSimulatedGameTime`, `advanceSimulatedGameTime`, `clearSimulatedGameTime`) no-op outside `import.meta.env.DEV`, so production behavior is always real time regardless of any stray call. A plain subscriber list (not Zustand — avoids pulling dev-only store code into the production bundle via a static import) backs a `useSyncExternalStore`-compatible subscription used by `DevTools.tsx` for reactive display.

Because `getTodayDateString()`, `getWeekKey()`, and the default `now` parameters in `questTiming.ts` / `questLogic.ts` all read from `getCurrentGameTime()`, the developer time simulation UI required no prop drilling anywhere else in the app — every consumer was already calling these functions rather than `new Date()` directly.

### Developer Time Simulation Tool

`DevTools.tsx` adds time controls: a real/simulated toggle, a `datetime-local` input, quick-advance buttons (+15m/+30m/+1h/+6h/+1d), and reset-to-real-time. Every action calls the store's `applyPeriodResets()` + `evaluateTimedQuests()` immediately afterward — the same pipeline used for real load/resume events — so quest and streak state updates instantly without any background timer.

### Migration

Renames 3 quest ids (`walk`→`morning-walk`, `bible-reading`→`bible`, `extra-learning`→`read`) to preserve their status, remaps `completionRewardClaims` (old `dailyCore` claim is dropped in favor of 3 fresh subcategory claims; `weekly`/`weeklyBonus`/`special` carry over), and renames `lastDailyCoreCompleteDate` → `lastNonNegotiableCompleteDate`. Hero level/XP/currency/stats are untouched. New quests with no prior persisted state initialize to `available` automatically via the existing `mergeQuestStates()` fallback — no special-casing needed for quests that didn't previously exist. See the `normalizeShape()` note above for why this runs independent of the version check.

---



# Folder Structure

src/

├── app/

│

├── features/

│   ├── hero/

│   ├── quests/

│   └── progression/

│

├── components/

│

├── data/

│

├── store/

│

├── types/

│

├── lib/

│

└── utils/

---



# Feature-Based Architecture

Features contain related functionality.

Example:

features/

└── hero/

    ├── components/

    │   └── HeroCard.tsx

    │

    ├── heroStore.ts

    │

    ├── heroTypes.ts

    │

    └── heroLogic.ts

---



# Core Features

Initial:

features/

├── hero/

│

├── quests/

│

├── progression/

│

├── combat/

│

├── inventory/

│

├── story/

│

├── skills/

│

└── achievements/

---



# Feature Responsibilities



## Hero

Responsible for:

- Player identity
- Stats
- Level
- Experience

---



## Quests

Responsible for:

- Quest definitions
- Completion
- Rewards

---



## Progression

Responsible for:

- XP calculations
- Level ups
- Unlocks

---



# Data Flow

Preferred:

User Action

↓

Feature Logic

↓

State Update

↓

UI Refresh

↓

Persistence

---



# Example

Completing a workout:

Quest Button Click

↓

Quest Engine

↓

Reward Calculation

↓

Hero XP Update

↓

Strength XP Update

↓

Save State

↓

Display Progress

---



# Rules



## Keep Components Dumb

Components display information.

Logic belongs elsewhere.

---



## Avoid Global State Abuse

Only store true application state globally.

---



## Prefer Data-Driven Systems

Avoid:

if quest === workout  

Prefer:

quest.statRewards.strength += 5

---



# Future Architecture Goals

Eventually:

packages/

game-engine/

shared-types/

ui/

mobile/

web/

The game logic should eventually be portable across platforms.