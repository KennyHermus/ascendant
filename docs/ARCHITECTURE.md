# Ascendant Technical Architecture

Version: 0.3 (aligned with Ascendant v0.0.3)

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

**(Historical v0.0.1 note — superseded.)** Early streak tracking required all daily core quests (`dailyCore`). See the Non-Negotiables restructure section below for current streak rules.

Category completion bonuses are defined in `src/data/completionRewards.ts` and granted once per period via `completionRewardClaims` in persisted state.

---

## v0.0.2 Implementation Notes — Timed Quests, Quest Restructure, Time Simulation

v0.0.2 was developed as two features shipped together under the same save version: Timed Quests, followed by the Non-Negotiables quest restructure + developer time simulation. Both are documented below.

### Feature 1 — Timed Quests

`QuestState.completed` (boolean) was replaced with `QuestState.status`: `'available' | 'completed' | 'missed'`. This is applied consistently across `questLogic.ts`, the store, and quest UI components.

`QuestDefinition` gained an optional `timing` field (`{ targetTime: "HH:mm", graceMinutes }`). Quests without `timing` behave exactly as before.

Timing evaluation (`src/features/quests/questTiming.ts`) is deliberately independent of quest status:

- `evaluateQuestTiming()` — pure function returning the current phase (`onTime` / `inGracePeriod` / `expired`). Overnight-aware: grace windows that cross midnight keep using the previous calendar day's target until that deadline passes.
- `getEffectiveQuestStatus()` — **current** availability from definition + clock + completion only. Never reads `GameEvent` history. Persisted `missed` is not authoritative for display.
- `reconcileTimedQuestStatuses()` — syncs persisted `available`/`missed` to match the clock (including missed → available on simulated-time rewind). `QUEST_FAILED` events are append-only history and are never consulted here.
- Timed quests are completable any time before the grace deadline (`onTime` or `inGracePeriod`). Timing phases are for display/urgency, not a separate lock gate.

`QUEST_FAILED` events carry an optional `periodKey` (quest-day) so re-entering the same missed window after a rewind does not emit a duplicate. Events answer "what happened?"; availability answers "what is true right now?"

The active *quest day* (`getActiveQuestDayKey`) rolls at the previous day's streak-end deadline (Sleep grace → 00:15 next morning on weekdays; otherwise midnight), not at calendar midnight — so daily reset and streak "today" stay aligned with Sleep's window. When a daily reset *advances* (not a simulated rewind), `reconcileTimedQuestStatusesForDay` sweeps the ending day before quests are wiped.

"Grace Period" is a timing phase, not a quest status — the status enum stays exactly `available` / `completed` / `missed` per the game design docs.

Evaluation runs only on: app load, persisted-state rehydrate, and the tab regaining visibility (`visibilitychange`). There are no background timers, per design constraint. This means a timed quest's displayed urgency can be briefly stale until the next such event.

A `targetTime` of `"00:00"` is treated as "the upcoming midnight" (end of the current day) so "before midnight" quests like Sleep behave correctly throughout the day.

Missed quests grant no rewards and no penalties, and cannot be completed — `completeQuest` sweeps expired quests before attempting completion, closing the race between an expired deadline and a stale `available` status.

### Save Versioning & Migrations

Persisted state carries a top-level `saveVersion` field (`GameState.saveVersion`), aligned with the app's semantic version (e.g. `"0.0.3"` for git `v0.0.3`).

Migrations are centralized in `src/lib/migrations/`:

- `migrations.ts` — `CURRENT_SAVE_VERSION`, `LEGACY_SAVE_VERSION`, and an ordered `MIGRATIONS` table. `migrateSaveData()` walks a save forward one step at a time until it matches the current version, then runs an idempotent `normalizeShape()` pass (see note below).
- `migratingStorage.ts` — a custom Zustand `PersistStorage` adapter that runs `migrateSaveData()` on read, before the store ever sees the data. It also falls back to the old literal key (`ascendant-game-v0.0.1`) once, so pre-existing saves aren't lost when the storage key became version-agnostic (`ascendant-game`).

The Zustand store only wires in `storage: createMigratingStorage()` — it contains no migration rules itself. Adding a future migration means appending one entry to `MIGRATIONS` and bumping `CURRENT_SAVE_VERSION`; no other file changes.

**Why `normalizeShape()` exists**: v0.0.2's two features both wrote `saveVersion: "0.0.2"`, but the quest restructure changed the shape again *after* that version number was already in use during development. A save tagged `"0.0.2"` could therefore be in either shape. Since version-matching alone can't disambiguate two shapes sharing one version string, `migrateSaveData()` always runs a normalization pass after the version loop — it detects and fixes the older shape's field names regardless of the version string, and is a no-op on already-current data. This is a one-off consequence of not bumping the version mid-feature; future shape changes should get their own version bump and migration step instead of relying on this pass.

---

## v0.0.3 Implementation Notes — History Foundation

First milestone of History & Analytics. **Backend/foundation only** — no charts, History page, or Analytics UI.

- **`HeroHistory` / `DailySnapshot`** — `src/types/history.ts`, pure helpers in `src/features/history/historyLogic.ts`.
- **Persistence** — `GameState.history`; save version `0.0.3`; migration `0.0.2 → 0.0.3` seeds empty history.
- **Write path** — when the quest day **advances** in `applyPeriodResets`, build a snapshot from pre-reset state and `recordDailySnapshot` (idempotent per date). Uses application/simulated time via `getCurrentGameTime()` and the same quest-day key as daily reset.
- **Relationship** — Events = fine-grained recent moments; Daily Snapshot = long-term day rollup; Daily Summary = player-facing report. Full detail: [HISTORY.md](HISTORY.md).
- **DevTools** — `HistoryTestingTools.tsx`: generate today's snapshot, delete latest, reset history only, show count.

### Analytics Engine (also v0.0.3)

Read-only statistics layer — `src/types/analytics.ts`, `src/features/analytics/`. Consumes History snapshots, lifetime stats, hero state, quest definitions, achievements, and the recent event buffer. Period filters: today / week / month / lifetime.

### Analytics Dashboard & Charts (also v0.0.3)

Presentation metrics + Recharts visualizations on the Hero Dashboard — `AnalyticsDashboard.tsx`, `AnalyticsCharts.tsx`. Metrics use Engine/registry; charts use `usePeriodChartBundle` → `ChartSeries` only. See [ANALYTICS.md](ANALYTICS.md).

---

## Non-Negotiables Restructure & Time Simulation (also v0.0.2)

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
- Dashboard order became (intermediate polish pass): Hero Summary → Today's Progress → Unlocks → Quests → Attributes → dev tools. Superseded by Hero Dashboard 2.0 order below (adds Active Objectives, Recent Progress, Achievements, Daily Summary banner).

---

## Hero Dashboard 2.0 & GameEvent Foundation (also v0.0.2)

Presentation/organization-only redesign — no gameplay mechanic changed. Two independent pieces shipped together: the dashboard reorganization, and a lightweight internal event log that seeds it.

### GameEvent — a foundation, not a full history feature

`src/types/event.ts` defines `GameEvent` as a discriminated union on `type`: `QUEST_COMPLETED`, `QUEST_FAILED`, `LEVEL_UP`, `STREAK_INCREASED`, `STREAK_BROKEN`, `UNLOCK_EARNED`, `ACHIEVEMENT_UNLOCKED`. Each carries only an `id`, ISO `timestamp`, and minimal type-specific payload (e.g. `questName`, `streak`, `achievementName`). `src/features/events/eventLogic.ts` is the only place that constructs, diffs, or formats events:

- `record*()` — one constructor per event type.
- `findNewlyMissedQuestEvents()` / `findNewlyUnlockedEvents()` — diff a before/after array (quest statuses, unlock states) and return one event per item that *just* transitioned, not items that were already in that state.
- `deriveStreakEvents()` — diffs a before/after `StreakState` snapshot. A break is detected when `currentStreak` drops to **0** after a positive streak (day-end expiry via `resolveStreakState`). A legacy "broken and restarted at 1" transition is still recognized for older saves that never went through 0.
- `appendEvents()` — caps the **recent-event** buffer to the most recent 50 entries (see Architecture Principles → Event retention strategy). This supports Recent Progress and Daily Summary; it is not long-term History storage.
- `formatEventLabel()` / `getEventIcon()` / `formatRelativeTime()` — the only formatting logic; `RecentProgress.tsx` just renders the result.

**Where events are recorded**: only from the store's *real* pipeline — `completeQuest()` (quest completed, level up, newly-earned unlocks, streak change) and `evaluateTimedQuests()` (quest newly missed). Both fire identically whether triggered by real usage or the dev time-simulation tool exercising those same functions — that parity is intentional. The explicit dev-only force-reset actions (`devResetAllQuests`/`devResetDailyQuests`/`devResetWeeklyQuests`/`devResetStreak`) do **not** emit events — they're testing shortcuts, not real pipeline entry points (and structurally can't produce a streak increase anyway, since they only reset quests to `available`, never `completed`). `grantXp()` (the dev "+100 XP Test" button) also does not emit events, by the same reasoning.

**Persistence**: one new field, `GameState.events: GameEvent[]`. No migration — defaults to `[]` on any save predating this feature, identical in spirit to how `unlocks` and `devSimulatedTime` were defaulted in earlier v0.0.2 work. `resetProgress()` clears it along with everything else, since `createInitialState()` includes it.

**Explicitly out of scope until their milestones:** no History or Analytics UI (v0.0.3), no long-term historical storage change yet (see Event retention strategy above). Achievements added `ACHIEVEMENT_UNLOCKED` as a seventh event type. The recent-event module stays small so v0.0.3 can consume the same event types without rework.

### Dashboard reorganization

New order: Daily Summary banner (when displayable) → Hero Banner → Today's Journey → Unlocks → Active Objectives → Quests → Recent Progress → Achievements → Attributes → dev tools. "Quests" (the full accordion checklist) isn't one of the six sections the original redesign named explicitly, but it's kept — removing it would remove the ability to actually complete a quest from the dashboard.

- **`src/components/Panel.tsx`** — generic section-wrapper (title + consistent border/spacing/typography) used by every top-level section now, replacing each section's own hand-rolled `<section><h2>` markup. Not feature-specific; any future section (inventory, skills, story) can use it.
- **`src/components/ProgressBar.tsx`** — generic completed/total bar (`XpBar` stays as-is, purpose-built for XP; this is the general-purpose version used by Today's Journey).
- **`src/features/hero/HeroBanner.tsx`** (replaces `HeroCard.tsx`) — adds an avatar placeholder (initials in a circle — a reserved slot for a future hero portrait), a level-based title ladder (`getHeroTitle()`, now in its own `heroTitle.ts`), and a rule-based status (`getHeroStatus()` in `heroPresentation.ts`). Both are pure, display-only functions — no new persisted state, no mechanic change. (Superseded further by the finishing pass below.)
- **`src/features/quests/TodaysJourney.tsx`** (replaces `ProgressSummary.tsx`) — mirrors the real quest hierarchy: Non-Negotiables as a single accordion (overall bar + subcategory rows when expanded) plus one row each for Daily Bonus, Weekly, Weekly Bonus, and Special. Backed by `getTodaysJourneyProgress()` in `questProgress.ts`. Optional-quest display uses `gatedBonus` / `gatedBonusCapped` (see "Today's Journey: gated optional quest progress" below) — optional completions only count after required quests in the set are done. Any row with 0 total (including Special) is omitted.
- **`src/features/unlocks/`** — `UnlockList.tsx` now groups into "Unlocked"/"Locked" sections. `unlockLogic.ts`'s `UnlockRequirementStatus` gained an optional `progress: { completed, total }`, populated for `groupCompletion` requirements (e.g. Netflix now shows "Morning Routine incomplete (4 / 5)"), not `questCompletion` ones (inherently binary).
- **`src/features/dashboard/`** — new feature folder for cross-cutting "what should I do next" logic that doesn't belong to quests/unlocks/hero exclusively. `activeObjectivesLogic.ts`'s `getActiveObjectives()` applies three fixed-priority rules: soonest upcoming timed quest (excluding one whose timing is `expired` but not yet reconciled to `missed` — a stale-state guard, not a new mechanic), the locked unlock with the fewest unmet requirements, and one incomplete weekly quest. `ActiveObjectives.tsx` renders the result, or an empty-state message.
- **`src/features/quests/questTiming.ts`** gained `formatRemainingMinutes()` (e.g. "2h 15m" instead of a raw 3-digit minute count past an hour), used both by the new Active Objectives section and the existing per-quest timing badge (`formatTimingStatusLabel()`), so both stay consistent.
- **`src/features/hero/StatsPanel.tsx`** — visual polish only (icon per stat, card layout via `Panel`); no stat mechanics touched.

### Hero Dashboard 2.0 finishing pass (v0.0.2 polish)

A follow-up pass on the Hero Card and a de-duplication pass across the pieces above.

**Generic progress aggregation (`src/features/quests/questProgress.ts`, new file)** — the single place that turns "a list of quest definitions + current quest state" into `{ completed, total, percent }`. `computeProgress()` is the core counting primitive; `getCategoryProgress()`/`getSubcategoryProgress()` filter by effective category/subcategory on top of it (with `activeOnly`/`excludeOptional` options), and `getTodaysJourneyProgress()` (moved here from `questLogic.ts`) composes them into the Today's Journey shape. `questLogic.ts`'s `getGroupCompletionStatus()`/`getNonNegotiableCompletionStatus()` now call `computeProgress()` too, instead of each re-implementing the same "filter, then count completed/total" loop — the streak/reward-eligibility *filtering* rules stay in `questLogic.ts` (that's domain logic, not a generic aggregation concern), but the actual counting is defined once. This layer is intentionally opinion-free about streak/reward semantics so it can be reused by Daily Summary, Achievements, History, Analytics, and future objective systems without any of them needing their own counting logic.

**Hero Status (`getHeroStatus()` in `heroPresentation.ts`, rewritten)** — a small state ladder over today's non-negotiable subcategory completion (`getNonNegotiableStatusBreakdown()` in `questLogic.ts`, which reuses `getGroupCompletionStatus`/`getNonNegotiableCompletionStatus` so this can never drift from the streak's own rules): `Day Complete` (all non-negotiables done) → `Evening Wind Down` (Morning + Nutrition done, Evening isn't) → `Making Progress` (Morning done, Nutrition isn't, and something's been touched) → `Morning Routine Complete` (Morning done, nothing else touched yet) → `Focused` (something done, Morning isn't complete) → `Ready for Adventure` (nothing done yet). Evaluated most-progressed-first so the branches are mutually exclusive. No quest IDs — only the existing category/subcategory structure. Deliberately doesn't (yet) consider combat/fatigue/injuries/buffs/equipment/story — the ladder is a plain `string`-returning function, so a future status source can be added as another branch without any Dashboard/HeroBanner change.

**Next Objective (`src/features/dashboard/nextObjectiveLogic.ts`, new file)** — `getNextObjective()` returns the single most meaningful next action for the Hero Card, distinct from the plural Active Objectives panel elsewhere on the dashboard. Fixed priority: soonest timed-quest deadline → earliest incomplete Non-Negotiable → earliest incomplete Daily Bonus → an incomplete Weekly quest ("earliest" = definition order in `data/quests.ts`, which mirrors the day's natural flow). Optional quests are never suggested. The "soonest timed quest" search itself was extracted into `findNextTimedQuest()` in `questTiming.ts` so `activeObjectivesLogic.ts` and this file share one implementation instead of two copies of the same sort/filter.

**Hero Title (`src/features/hero/heroTitle.ts`, new file, split out of `heroPresentation.ts`)** — expanded to an 8-tier level ladder (Novice → Apprentice → Adventurer → Veteran → Elite → Champion → Ascendant → Legend, levels 1/5/10/20/35/50/75/100). Split into its own file because it's meant to grow into a small standalone system — a future resolver could weigh story progression, achievements, or prestige state without any component that calls `getHeroTitle()` needing to change.

**Lifetime Stats (`Hero.lifetimeStats`, new persisted field)** — a `LifetimeStats` record (`src/types/hero.ts`) tracking `longestStreak`, `totalQuestsCompleted`, `totalXpEarned`, `totalGoldEarned`, and `questCompletionCounts` (per-quest-id totals for Achievements), distinct from today's quest/streak state (which resets). Updated incrementally in `gameStore.ts`'s `completeQuest()` via pure helpers in `src/features/hero/lifetimeStats.ts` (`recordQuestCompletionStats()`, `recordStreakForLifetimeStats()`) — never recomputed by scanning `GameEvent` history, so it stays cheap regardless of history size. `reconcileStreak()` also re-applies `recordStreakForLifetimeStats()` as a safety net on every rehydrate (a cheap, idempotent max-check), even though in practice `currentStreak` can only increase inside `completeQuest`. As with `unlocks`/`events` before it, this is a **safe-default, not a save-version bump**: `gameStore.ts`'s `merge()` fills in `createInitialLifetimeStats()` for any `hero` missing the field, so old saves load without a migration entry. `grantXp()` (the dev "+100 XP Test" button) does **not** update lifetime stats, for the same reason it doesn't emit `GameEvent`s — it's a testing shortcut, not a real gameplay action. The interface is written to be extensible: future counters (enemies defeated, bosses defeated, workouts, distance walked, weight lifted, achievements/transformations unlocked) are additive fields with a one-line update call each, not a rewrite.

**HeroBanner.tsx** — restructured into three visually-grouped sections per spec: Identity (title/name, Level in the XP bar), Progress (XP bar, Gold, Current Streak), and Lifetime (a bordered-off block below, so "Streak" and "Longest Streak" are never visually confused). Also gained the Next Objective row directly under Status. A small local `StatTile` helper removes the repeated label/value markup across the now six stat cells (Gold, Streak, and four lifetime tiles).

### Today's Journey: gated optional quest progress

`questProgress.ts`'s `ProgressQueryOptions.optionalHandling` controls how optional quests (e.g. Breakfast) factor into completion fractions:

- `'include'` (default) — optional quests count fully in both `completed` and `total` (Daily Bonus/Weekly/Weekly Bonus/Special rows).
- `'gatedBonus'` — optional quests are **invisible** until every required quest in the same set is done; once that happens, an extra optional completion can push `completed` past `total` (e.g. Nutrition reads "4 / 3" when Lunch, Dinner, Vitamins, and Breakfast are all done). Before required quests are finished, optionals don't count at all — Breakfast + Lunch only still reads "1 / 3", not "2 / 3".
- `'gatedBonusCapped'` — same gating rule as `'gatedBonus'`, but `completed` is clamped to `total` so the fraction never exceeds 100% (Today's Journey's overall Non-Negotiable row).
- `'exclude'` — optional quests are dropped entirely (unused by current callers; streak/reward eligibility has its own separate filtering in `questLogic.ts`).

`getTodaysJourneyProgress()` applies `'gatedBonus'` per Non-Negotiable subcategory and `'gatedBonusCapped'` for the overall Non-Negotiable row — subcategories can celebrate bonus completions, the headline number stays simple. Weekend-suspended quests (Wake Up/Sleep, `weekdaysOnly`) are handled by `isQuestActiveOn`, not by this flag.

The counting primitive is `computeGatedBonusProgress()`; `applyOptionalHandling()` routes each category/subcategory call to the right mode.

### Daily Summary (v0.0.2)

An end-of-day recap — `src/features/summary/` and `src/types/summary.ts` — deliberately built as a **generic period pipeline** with only `'daily'` implemented, per the spec's "don't hardcode this to daily" requirement:

- **`SummarySnapshot`** (`types/summary.ts`) is the **generic summary model** for any period — not a daily-only DTO. Fields cover hero identity/title, XP/Gold *earned this period*, a `SummaryQuestBreakdown`, `statGrowth`, this period's event slice, streak, rule-based `reflection`, and a forward-looking preview. The same interface supports:
  - **Daily** summaries (`period: 'daily'`, `periodKey: YYYY-MM-DD`) — implemented today
  - **Weekly** summaries (`period: 'weekly'`, week key) — future generator only
  - **Monthly** summaries (`period: 'monthly'`, month key) — future generator only  

  UI (`DailySummaryModal`) is already period-agnostic: it renders a `SummarySnapshot` without caring which generator produced it. `SUMMARY_PERIODS` currently lists only `'daily'`; adding weekly/monthly is a new logic file + period enum entry, not a modal rewrite.
- **`DayStartHeroSnapshot`** (`types/summary.ts`) — `{ stats, totalXpEarned, totalGoldEarned }`, captured at the start of each day (`captureDayStartSnapshot()`) and stored as `GameState.dayStartHeroSnapshot`. This is the diff basis for "earned/grew today": `hero.lifetimeStats.totalXpEarned/totalGoldEarned` are monotonically-increasing cumulative counters (unlike `currentXp`, which resets on level-up), so subtracting the day-start snapshot's values gives an exact per-day delta regardless of how many level-ups happened that day. Stat growth is a simpler per-stat value diff, since stats never decrease.
- **`features/summary/dailySummaryLogic.ts`** — the pure "daily" implementation of the pipeline:
  - `isDailySummaryAvailable()` — true once every non-optional non-negotiable required today has left `available` (completed *or* missed — reuses the same required-set as `questContributesToStreakOn`, so it can never drift from streak eligibility) **or** the Sleep quest specifically has been completed. Sleep is referenced by a documented `id` constant — the one deliberate quest-id reference in this feature, because the product spec calls it out by name as "the day's natural end."
  - `isDailySummaryDisplayable()` — whether the summary should still be surfaced on the dashboard. Independent of `dailySummaryViewed`: a summary stays visible and re-openable from the moment it's generated through the rest of its own day and all of the following morning, disappearing only at **noon the day after** the summary's `periodKey` (`parseDateKey(periodKey)` + 1 day). Closing the modal does not hide the banner — only this time window does.
  - `generateDailySummary()` — composes `getTodaysJourneyProgress()` (Quest Summary), a stat diff against `DayStartHeroSnapshot` (Stat Growth), the event log filtered to `periodKey` and sorted chronologically (Major Events), `generateHeroReflection()` (a handful of simple, priority-ordered string templates — no AI, easily extended with another branch), and a Tomorrow Preview built from: tomorrow's required Non-Negotiable names (`getEffectiveCategory`/`isQuestActiveOn` evaluated one day ahead, so a weekday→weekend transition is reflected automatically), `available` Weekly quest names, and the locked unlocks with the fewest unmet requirements (`getLockedUnlocksByProximity()`, extracted from `activeObjectivesLogic.ts`'s inlined "closest unlock" sort into `unlockLogic.ts` so both features share one implementation).
- **Persistence (`gameStore.ts`)** — three new `GameState` fields, all safely defaulted in `merge()` for old saves (no version bump, same pattern as `unlocks`/`events`): `dailySummary: SummarySnapshot | null`, `dailySummaryViewed: boolean`, `dayStartHeroSnapshot`. Two store-internal helpers do the actual work:
  - `syncDailySummaryPatch(state, now)` — the *live, same-day* path. If a summary already exists for a **different** (necessarily earlier) `periodKey`, it's already frozen and is never touched — this is what guarantees a past day's summary is never recomputed after its reset. Otherwise, if `isDailySummaryAvailable()`, it (re)generates today's snapshot from current state. Called inline at the end of `completeQuest()` and `evaluateTimedQuests()` (either can be what makes a summary newly available — e.g. a timed quest's deadline sweeping Sleep to `missed`), and via the public `syncDailySummary()` action on load/resume, mirroring the existing `evaluate*` action pattern.
  - `finalizeDailySummaryForEndingDay(state, endingDayKey)` — called from `applyPeriodResets()` **before** `computeResetPatch()` wipes quest/streak state for the new day, using the *pre-reset* state and a reference time still inside the ending day (`lib/storage.ts`'s `parseDateKey()`, not real "now" — which may already be past midnight into the next day by that point, and would otherwise evaluate weekday/weekend-aware quest logic against the wrong day). Always generates (unlike the live path, it isn't gated by `isDailySummaryAvailable()` — an incomplete day still gets summarized honestly), and rolls `dayStartHeroSnapshot` forward for the new day.
  - Both funnel through `buildDailySummaryPatch()`, which only resets `dailySummaryViewed` to `false` when the snapshot starts a **new** `periodKey` distinct from whatever's currently stored — refreshing the same day's live snapshot, or finalizing it at the reset boundary, both preserve whatever viewed state it already had. `dailySummaryViewed` only softens the banner copy ("View Today's Summary" vs "Today's Summary is ready"); it does not control visibility.
- **UI** — `DailySummaryBanner.tsx` (Dashboard call-to-action, shown whenever `dailySummary && isDailySummaryDisplayable()` — re-openable until noon next day) and `DailySummaryModal.tsx` (the "rewards screen," purely presentational). Closing the modal calls `viewDailySummary()` to soften copy; the dev-tools preview flow never touches persisted state.
- **Dev Tools** — "Open Today's Summary" in `DevTools.tsx` calls `generateDailySummary()` directly (bypassing `isDailySummaryAvailable()`) and renders the result in a component-local `DailySummaryModal`, entirely independent of the store's `dailySummary`/`dailySummaryViewed`.

### Achievements (v0.0.2)

A data-driven milestone system — `src/features/achievements/` and `src/types/achievement.ts` — that **consumes** existing game state and events without modifying gameplay logic.

- **`AchievementDefinition`** (`types/achievement.ts`) — `id`, `name`, `description`, `category`, `icon`, optional `hidden`, `rarity`, `reward[]`, `condition`. Categories: Progression, Consistency, Quests, Exploration, Fitness, Learning, Special. Rarities: Common → Legendary, each mapping to Achievement Points (5/10/25/50/100) and card/popup styling. Reward types include XP/Gold (applied today) plus Title/Cosmetic Badge/Item/Skill Point (modelled but not yet implemented).
- **`AchievementCondition`** — discriminated union over data that already exists: `heroLevel`, `longestStreak`, `totalQuestsCompleted`, `questCompletionCount` (sum across quest ids via `lifetimeStats.questCompletionCounts`), `timedQuestCompleted`, `categoryCompletedInDay`, `perfectDay`. Adding a new condition kind is one union member + one evaluator branch.
- **`achievementDefinitions.ts`** — the full catalog as plain data; thresholds and rewards are editable here without touching logic or UI.
- **`achievementLogic.ts`** — pure functions: `evaluateAchievements()` (checks only not-yet-unlocked entries — never unlocks twice), `getAchievementProgress()` (current/target for numeric conditions), `applyAchievementRewards()` (XP through real `addXp` pipeline, Gold to currency, lifetime totals via `recordBonusEarnings`), `getAchievementSummary()` (completion % and points, derived on demand, not persisted).
- **Lifetime stats extension** — `Hero.lifetimeStats.questCompletionCounts: Record<string, number>` incremented in `recordQuestCompletionStats()` on every quest completion. Powers count-based achievements (100 Workouts, 100 Walks, etc.) without scanning `GameEvent` history. Safe-defaulted in `merge()` for old saves.
- **Evaluation timing** — event-driven, not per-render:
  - Inline inside `completeQuest()` after hero/quest/streak state is updated (the one place every achievement-relevant stat can change).
  - `syncAchievements()` on rehydrate as a backfill safety net.
  - Dev "Evaluate Achievements" routes through `syncAchievements()` (real conditions, real rewards).
- **Persistence (`gameStore.ts`)** — `achievements: AchievementState[]` (id, unlocked, unlockedAt). `mergeAchievementStates()` safe-defaults against `ACHIEVEMENT_DEFINITIONS` for old saves — no version bump. Dev "Unlock All" bypasses conditions and grants no rewards; "Reset Achievements" restores locked defaults.
- **Events** — newly unlocked achievements emit `ACHIEVEMENT_UNLOCKED` into the `GameEvent` log (same cap/lifecycle as other events).
- **UI** — `AchievementPanel.tsx` (Unlocked/Locked sections, grouped by category, completion % and points in header), `AchievementCard.tsx` (rarity styling, progress bar for numeric conditions, hidden locked entries render as "???"), `AchievementUnlockedPopup.tsx` (transient toast, rarity-colored, auto-dismisses via `useAchievementUnlockPopups` — ephemeral UI state, not persisted). Panel sits on the dashboard between Recent Progress and Attributes.
- **Dev Tools** — `AchievementTestingTools.tsx`: Evaluate Achievements, Unlock All Achievements, Reset Achievements.

---



# Folder Structure

```
src/
├── app/                 # App shell + Dashboard composition
├── components/          # Shared UI (Panel, ProgressBar, Accordion, XpBar, …)
├── data/                # Data-driven definitions (quests, unlocks, rewards, labels)
├── features/
│   ├── achievements/    # Achievement definitions, logic, panel, popup
│   ├── dashboard/       # Active Objectives, Next Objective (cross-cutting)
│   ├── events/          # GameEvent constructors/formatters, Recent Progress
│   ├── hero/            # Hero Banner, stats panel, titles, lifetime stats
│   ├── history/         # Long-term DailySnapshot History (no UI yet)
│   ├── analytics/       # Engine + series builders + Analytics Dashboard
│   ├── progression/     # XP / level-up pure logic
│   ├── quests/          # Quest list/cards, timing, schedule, progress aggregation
│   ├── summary/         # Daily Summary logic + UI
│   └── unlocks/         # Unlock evaluation + UI
├── lib/                 # gameTime, storage, save migrations
├── store/               # Zustand gameStore (single persisted store)
├── types/               # Shared TypeScript models
├── dev/                 # Dev-only tools (time sim, quests, achievements, history, analytics)
└── assets/              # Static assets
```

There is no `src/utils/` folder — shared helpers live in `lib/` or feature `*Logic.ts` files.

---

# Architecture Principles

These principles apply to every new feature. They are the source of truth for how systems should grow.

## Separation of concerns

- **UI must not contain game logic** — components render results of pure functions and store actions.
- **Definitions are data-driven** — quests, unlocks, and achievements live in data/definition files, not hardcoded in components.
- **Shared calculations belong in logic modules** — e.g. `questProgress.ts`, `eventLogic.ts`, `lifetimeStats.ts`, `dailySummaryLogic.ts`, `historyLogic.ts`, `analyticsLogic.ts`.

## Consume existing foundations

Future systems (especially **v0.0.3 Analytics UI**, and later combat/world features) must **consume** these foundations rather than reinventing them:

| Foundation | Location | Purpose |
|------------|----------|---------|
| **`GameState.events`** | `types/event.ts`, `features/events/` | Fine-grained recent moments (capped buffer for UI) |
| **`GameState.history`** | `types/history.ts`, `features/history/` | Append-only daily snapshots for long-term trends |
| **Analytics Engine** | `types/analytics.ts`, `features/analytics/` | Read-only derived stats over History / lifetime / events |
| **`lifetimeStats`** | `Hero.lifetimeStats` | Incremental long-term counters (not a time series) |
| **Quest progress** | `features/quests/questProgress.ts` | Completed / total / percent for any category or subcategory slice |
| **Daily Summary** | `types/summary.ts` `SummarySnapshot` | Player-facing period recap (not an Analytics input) |

**Do not** reconstruct history by scanning current quest state (quest statuses reset daily/weekly and cannot answer "what happened last week"). Prefer `HeroHistory` daily snapshots for multi-day series; use the Analytics Engine for derived metrics. Full detail: [HISTORY.md](HISTORY.md), [ANALYTICS.md](ANALYTICS.md).

## Event retention strategy

**Recent events:** `GameState.events` remains a **recent-event** buffer. `appendEvents()` keeps only the most recent **50** entries for Recent Progress and Daily Summary's "Major Events" slice. It is **not** long-term historical storage.

**Long-term History + Analytics (v0.0.3):** `GameState.history` stores append-only `DailySnapshot` records. The Analytics Engine reads those snapshots (plus lifetime stats / limited events). Future charts should call Analytics APIs — not scan the event buffer as a complete archive. See [HISTORY.md](HISTORY.md) and [ANALYTICS.md](ANALYTICS.md).

---

# Feature-Based Architecture

Features contain related functionality. Types live in `src/types/`; the single store is `src/store/gameStore.ts`.

Example:

```
features/
└── quests/
    ├── questLogic.ts      # pure game logic
    ├── questProgress.ts   # shared progress aggregation
    ├── QuestCard.tsx      # presentational UI
    └── QuestList.tsx
```

---

# Core Features

## Implemented (through v0.0.3 History Foundation)

```
features/
├── hero/
├── quests/
├── progression/
├── unlocks/
├── events/
├── history/          # DailySnapshot persistence
├── analytics/        # Engine, series builders, Dashboard, Charts (Recharts)
├── dashboard/
├── summary/
└── achievements/
```

## Planned — v0.1.x only (not yet present as folders)

Combat, inventory, equipment, story, skills, and world systems are **explicitly future v0.1.x**. Do not implement them in v0.0.x.

```
features/
├── combat/      # v0.1.x
├── inventory/   # v0.1.x (equipment lives here / adjacent)
├── story/       # v0.1.x (world / chapters)
└── skills/      # v0.1.x
```

Design docs for those domains: `docs/COMBAT.md`, `docs/STORY.md`, `docs/ECONOMY.md` (equipment/shops), `docs/FUTURE_IDEAS.md`.
---

# Feature Responsibilities

## Hero

- Player identity, stats, level, XP, gold
- Titles, status presentation, lifetime stats

## Quests

- Quest definitions (data), completion, timing, schedules
- Progress aggregation, Today's Journey, Quest list UI

## Progression

- XP calculations and level-ups

## Unlocks

- Unlock definitions and evaluation against quest state

## Events

- GameEvent construction, formatting, Recent Progress (capped recent buffer)

## History

- Append-only daily snapshots for long-term progression (`features/history/`)
- See [HISTORY.md](HISTORY.md)

## Analytics

- **Metric registry** — each dashboard metric declares `supportedPeriods`; UI renders filtered sections only ([ANALYTICS.md](ANALYTICS.md))
- Read-only derived statistics + presentation Dashboard (`features/analytics/`)
- Recharts visualizations via `ChartSeries` + period bundle — see [ANALYTICS.md](ANALYTICS.md)

## Dashboard

- Cross-cutting "what next" logic (Active Objectives, Next Objective)

## Summary

- Daily Summary generation and UI (period-generic snapshot shape; presentation, not Analytics DB)

## Achievements

- Data-driven milestones, evaluation, rewards, panel/popup

## Combat / Inventory / Story / Skills / World

**v0.1.x only.** Designed in `docs/COMBAT.md`, `docs/STORY.md`, and related docs; not implemented. Do not invent these systems in v0.0.x milestones.



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

Stat value update (e.g. Strength +1)

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