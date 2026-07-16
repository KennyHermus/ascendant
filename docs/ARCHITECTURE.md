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
- `reconcileTimedQuestStatuses()` — transitions `available` quests past their deadline to `missed`, *and* reverts `missed` quests back to `available` if the deadline is no longer passed (only reachable via the dev time-simulation tool moving the clock backward — `missed` is re-derived from the clock every time, not sticky, so displayed state can never disagree with "is this actually past its deadline right now").

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

## Feature 2 — Unlock Quests (also v0.0.2)

### A separate domain, not a quest flag

Unlocks live entirely outside the quest system: `src/types/unlock.ts` (`UnlockDefinition`, `UnlockRequirement`, `UnlockState`), `src/data/unlocks.ts` (the 5 definitions), and `src/features/unlocks/unlockLogic.ts` (pure evaluation). `QuestDefinition` and `QuestState` are untouched by this feature.

`UnlockRequirement` is a discriminated union on `type`:

```
UnlockRequirement =
  | { type: 'questCompletion', questId: string }
  | { type: 'groupCompletion', group: CompletionRewardKey }
```

`groupCompletion` reuses `getGroupCompletionStatus()` from `questLogic.ts` (the same reward-group machinery backing subcategory completion bonuses) rather than duplicating a "these 5 quest IDs" check for Netflix's "all Morning Routine complete" requirement. Adding a future requirement kind (achievement, level, currency, story flag, equipment) means adding one case to the union and one branch in `checkRequirement()`/`describeRequirement()` — no changes to existing requirement types, `UnlockDefinition` data, or UI components.

### Pure logic, UI only displays results

`unlockLogic.ts` exports:

- `checkUnlockRequirements(definition, quests, questDefinitions, now?)` — boolean, all requirements met.
- `getUnlockStatus(definition, quests, questDefinitions, now?)` — full display data: overall `unlocked` plus a per-requirement `{ met, label }` list (e.g. `"Rehab incomplete"` / `"Rehab complete"`).
- `evaluateUnlocks(definitions, quests, questDefinitions, now?)` — recomputes every `UnlockState` from scratch.
- `createInitialUnlockStates()` / `mergeUnlockStates()` — same shape as `createQuestStates()` / `mergeQuestStates()`.

`UnlockCard.tsx` / `UnlockList.tsx` (in `src/features/unlocks/`) only call `getUnlockStatus()` and render the result — no requirement checks live in a component.

### Recompute, not claim-once

Unlike category completion rewards (`completionRewardClaims`, granted once per period and tracked so they can't repeat), unlocks are **re-evaluated** every time relevant state changes, and can re-lock. The store's `evaluateUnlocks()` action is called inline (in the same `set()`) right after `completeQuest` and `applyPeriodResets` change quest state, and again on `onRehydrateStorage`. This means completing "Rehab" unlocks YouTube immediately, and the next daily reset (which returns Rehab to `available`) re-locks it — matching the "earn access each day" framing in `docs/QUESTS.md`, and confirmed by the testing checklist (reset day → unlock recalculates).

### State & persistence — no migration required

`GameState` gained one field: `unlocks: UnlockState[]`. This was evaluated against the "save schema version vs. app version" distinction and did **not** warrant a migration:

- Old saves simply don't have `unlocks` — `saved.unlocks` is `undefined`.
- `merge()` calls `mergeUnlockStates(saved.unlocks, UNLOCK_DEFINITIONS)`, which does `persisted ?? []` and defaults every definition to `unlocked: false` if there's no persisted entry for it.
- `onRehydrateStorage` immediately calls `evaluateUnlocks()` afterward, which recomputes every unlock from the save's own (already-migrated) quest data — so the "all locked" default from the merge step is corrected within the same load, before first render.
- `CURRENT_SAVE_VERSION` stays `"0.0.2"`; `MIGRATIONS` in `src/lib/migrations/migrations.ts` gained no new entry.

**When a future feature *should* bump the save version**: if a change alters the *meaning* or *shape* of already-persisted fields in a way that can't be safely defaulted (e.g. renaming/restructuring `QuestState`, splitting `Hero.stats`, or introducing a requirement type whose persisted `unlocked` flag must NOT be freshly recomputed — e.g. a future "currency purchase" unlock that should stay unlocked even after currency is spent below the threshold, unlike the current recompute-based types). That kind of change is additive to `MIGRATIONS` — one new entry plus a `CURRENT_SAVE_VERSION` bump, per the existing versioning system; no other files need to change.

---

## v0.0.2 Polish Pass — Persisted Dev Time, Dev Quest Tools, Dashboard Reorg

Three independent changes, still under save version `0.0.2` (see save-schema reasoning below — the one new field defaults safely, same pattern as `unlocks`).

### Persisted developer time simulation

Previously, `lib/gameTime.ts`'s `overrideTime` was purely in-memory and reset to real time on every refresh. It's now backed by one new persisted field, `GameState.devSimulatedTime: string | null` (ISO string or `null`):

- `gameTime.ts` itself is **unchanged** — still a small, framework-agnostic module with no knowledge of Zustand or persistence, per the original design constraint. It remains the single in-memory runtime authority (`getCurrentGameTime()` etc.) that the rest of the app calls.
- The store owns persistence. Three new actions — `devSetSimulatedTime`, `devAdvanceSimulatedTime`, `devClearSimulatedTime` — call `gameTime.ts`'s existing setters *and* mirror the result into `devSimulatedTime` in the same action, so there's exactly one persisted representation and no risk of the two drifting apart.
- On rehydrate, `persist`'s `merge()` function primes `gameTime.ts`'s in-memory override from `saved.devSimulatedTime` *before* computing anything date-dependent (including its own streak resolution, and everything `onRehydrateStorage` runs afterward) — otherwise the very first evaluation after a refresh would briefly use real time before snapping to simulated time. A malformed/unparseable stored date is ignored rather than propagated as an `Invalid Date`.
- `DevTools.tsx`'s `TimeSimulationTools` now calls the three store actions instead of `gameTime.ts`'s setters directly, so every time change is automatically persisted.
- Resetting to real time (`devClearSimulatedTime`) sets `devSimulatedTime: null`, so a refresh afterward stays on real time.
- `resetProgress()` (`createInitialState()`) deliberately **re-reads** the live override via `getSimulatedTimeOverride()` rather than hardcoding `null` — resetting player progress is orthogonal to a developer's active time simulation, so it doesn't fight it.
- No migration: `devSimulatedTime` is `undefined` on any save predating this change; `merge()` defaults it to `null` (real time), identical in spirit to how `unlocks` was defaulted in the prior feature.

### Developer quest testing tools (`src/dev/QuestTestingTools.tsx`)

Bulk actions for faster manual testing, kept entirely inside the existing dev-only architecture (`src/dev/`, lazy-loaded, guarded by `import.meta.env.DEV`):

- **Bulk complete** (`devCompleteGroup(category, subcategory?)`) loops `get().completeQuest(id)` over every quest in the target category/subcategory. It never writes quest state directly — each iteration re-reads fresh state through the same action a player's click uses, so XP, gold, stats, streak, and unlocks all accumulate exactly as if each card were clicked individually. Quests that are already completed/missed/inactive today are silently skipped by `completeQuest`'s own guard.
- **Reset Daily/Weekly Quests** (`devResetDailyQuests` / `devResetWeeklyQuests`) reuse a new shared helper, `computeResetPatch()`, extracted from `applyPeriodResets`'s body — it runs the exact same `resetQuestsForPeriod` → `resetCompletionClaims` → `resolveStreakState` → `evaluateUnlocks` sequence, just force-triggered instead of gated on `lastDailyResetDate`/`lastWeeklyResetWeek`. Those two bookkeeping fields are deliberately left untouched by the forced dev reset, so it stays orthogonal to the real date-based gate (no double-reset risk if the automatic reset fires later the same day).
- **Reset All Quests** (`devResetAllQuests`) is a genuinely testing-only operation: it resets every quest to `available` including `special`, which the real reset pipeline intentionally never touches. Its pure helper (`resetAllQuestsForTesting`) lives in `src/dev/devQuestActions.ts`, not `questLogic.ts`, so this shortcut can never be reached from production logic.
- **Reset Streak** (`devResetStreak`) just zeroes `currentStreak`/`lastNonNegotiableCompleteDate` directly.

### Dashboard reorganization & the `Accordion` component

`src/components/Accordion.tsx` is a new, generic, feature-agnostic collapsible section (title, optional completion-count `meta` badge, optional expand/collapse persistence) — not quest-specific, so it's intended for reuse by future grouped content (inventory, skill trees, achievements, story chapters).

- Its expanded/collapsed state is persisted via its own `localStorage` namespace (`ascendant-accordion:<persistKey>`), completely decoupled from `GameState`/the save schema. Expand/collapse is a UI display preference, not save data — this keeps `docs/ARCHITECTURE.md`'s "game logic separate from UI" rule intact and means no migration path is ever needed for it.
- `QuestList.tsx` is rebuilt on top of it: Non-Negotiables (and its three subcategories) default to expanded; Daily Bonus, Weekly, Weekly Bonus, and Special default to collapsed. Category/subcategory display labels were deduplicated into `src/data/questLabels.ts` (previously only defined inline in `QuestList.tsx`), now shared by both the player-facing quest list and `QuestTestingTools`.
- Dashboard order became: Hero Summary (name, level, XP, gold, streak — gold/streak moved from `ProgressSummary` into `HeroCard`) → Today's Progress (subcategory completion badges, `ProgressSummary` stripped of gold/streak) → Unlocks → Quests (accordion) → Attributes → dev tools.

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