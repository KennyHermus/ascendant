# Ascendant Project State

**Canonical baseline snapshot** — reflects the codebase after **v0.0.5 (Hero Identity)**.

| | |
|---|---|
| **Application version** | **0.0.5** (`package.json`) |
| **Save schema version** | **0.0.10** (`CURRENT_SAVE_VERSION`) |
| **Last updated** | Hero Identity milestone complete |
| **Living document** | Update at major milestones |

This document describes Ascendant **as it exists today**. For deep dives, follow links to feature-specific documentation.

---

# Project Overview

## Vision

Ascendant is a **real-life progression RPG**. The player improves their actual life and their fictional Hero simultaneously. Daily discipline becomes experience, consistency becomes power, and long-term effort becomes identity — not spreadsheet compliance.

The long-term aim is a **persistent RPG world** driven by real-world action, supported by coaching, analytics, and (eventually) narrative systems — without encouraging unhealthy grinding.

## Current development philosophy

**Hero-first design** (from v0.0.5 onward): every new feature should answer *"How does this make the Hero feel more alive?"*

Enduring product philosophy: [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md). Decision history: [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md). AI workflow: [AI_WORKFLOW.md](AI_WORKFLOW.md). Development process: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

Additional principles in practice:

- Build the smallest loop that works, then integrate — avoid isolated features.
- Reuse foundations (`events`, `history`, `questHistory`, `completeQuest()`) instead of reconstructing state.
- Separate **logic**, **selectors**, and **UI**; keep analytics read-only.
- Identity and presentation layers must not alter core gameplay rewards unless explicitly designed.
- Document when architecture or major features change.

## Current version & stage

| Milestone | Status |
|-----------|--------|
| v0.0.1 – v0.0.4 | Complete |
| **v0.0.5 — Hero Identity** | **Complete** |
| v0.0.6+ | Not yet defined |

**Stage:** Early product — rich **life-management + fitness RPG foundation** with history, analytics, and Hero Identity. Pre-combat, pre-world, pre-story implementation.

## Short description

Ascendant is a single-page React application that turns real-world habits (routines, workouts, nutrition, learning quests) into an RPG Hero's progression. A Zustand store persists to browser `localStorage` with versioned migrations. The Dashboard is the entire application surface today: one scrollable Hero command center with quests, fitness tools, analytics, and history.

---

# Long-Term Vision

*The following are **design direction**, not implemented features.*

| Concept | Direction |
|---------|-----------|
| **Hero-first persistent RPG** | The Hero is a character with biography, titles, accomplishments, and eventually class, companions, and story — all fed by real-life action. |
| **Real-life progression** | Quests, workouts, meals, and assessments map to genuine self-improvement; the game motivates without replacing real outcomes. |
| **Persistent world** | History snapshots, timeline events, and lifetime milestones build a continuous journey across months and years. |
| **AI-powered personal operating system** | Future: intelligent planning, personalized challenges, and contextual coaching beyond rule-based recommendations. |
| **Coaching & planning** | Today: Progression Engine + dashboard nudges. Future: deeper planning and adaptive guidance. |
| **External integrations** | Future: health platforms, calendars, wearable data — activity records already use an extensible integration shape on workouts. |
| **World progression** | Future: regions, enemies, story beats, guilds — v0.1.x+ scope per [COMBAT.md](COMBAT.md), [STORY.md](STORY.md). |

**Currently implemented:** Hero progression, quests, fitness activities, history, analytics, insights, achievements, unlocks, Hero Identity (titles, biography, accomplishments).

**Not implemented:** Combat, classes, equipment, inventory, NPCs, story chapters, multiplayer, cloud sync, AI quest generation.

---

# Current Systems

Each entry: **Purpose → Capabilities → Architecture → Persistence → Future extension points**.

---

## Hero

**Purpose:** Core RPG character — level, XP, gold, eight stats, daily status, and lifetime counters.

**Capabilities:**

- Level and XP with level-up stat gains
- Eight flat stats (Strength, HP, Defense, Stamina, Speed, Intellect, Willpower, Special Technique)
- Gold (wallet + lifetime earned)
- **Level-based rank** ladder (Novice → Legend) via `heroTitle.ts`
- Dynamic **today status** and **Next Objective** on Hero Banner
- Incremental **LifetimeStats** (quests, XP, gold, per-quest counts, longest streak)

**Architecture:** `src/features/hero/` (presentation, lifetime stat helpers); `src/types/hero.ts`. Updated through `completeQuest()`, achievements, `grantXp()` (dev).

**Persistence:** `GameState.hero` including nested `lifetimeStats`.

**Extension points:** Stat XP per stat, equipment modifiers, class-based stat growth, buffs/debuffs.

**Docs:** [PROGRESSION.md](PROGRESSION.md), [GAME_BIBLE.md](GAME_BIBLE.md)

---

## Hero Identity

**Purpose:** Make the Hero feel like a **living character** — biography, accomplishment titles, lifetime milestones — without changing gameplay mechanics.

**Capabilities:**

- **Hero Profile** accordion — portrait placeholder, name, accomplishment title, rank, level, XP, journey stats, rolling consistency rates
- **Hero Biography** — auto-generated narrative from lifetime metrics (derived, not stored)
- **Hero Titles** — unlock from accomplishments (The Persistent, The Athlete, …); one active (auto-selected by priority)
- **Lifetime Accomplishments** — legacy milestones distinct from Achievements (100 quests, 100 workouts, Level 25, …)
- **Timeline events** — `HERO_TITLE_EARNED`, `LIFETIME_ACCOMPLISHMENT_EARNED` on live unlocks
- **Analytics exposure** — title, rank, days active, accomplishment count in Hero metrics section

**Architecture:** `src/features/heroIdentity/`; data in `src/data/lifetimeAccomplishments.ts`, `heroIdentityTitles.ts`; `syncHeroIdentity()` in store after quests, workouts, assessments, day advance, rehydrate.

**Persistence:** `GameState.heroIdentity` — `unlockedAccomplishmentIds`, `unlockedTitleIds`, `activeTitleId` (null = auto-select). Migration **0.0.9 → 0.0.10** backfills without timeline flood.

**Extension points:** Manual title selection (`activeTitleId`), Hero Classes, reputation, guilds, companions, alignment, story flags, custom portrait.

**Docs:** [HERO_IDENTITY.md](HERO_IDENTITY.md)

---

## Quest Engine

**Purpose:** Real-world actions as completable quests with rewards, schedules, timing, and streak contribution.

**Capabilities:**

- Categories: Non-Negotiables (Morning / Nutrition / Evening), Daily Bonus, Weekly, Weekly Bonus, Special (empty)
- Optional quests, weekday schedules, timed quests with grace periods
- Completion grades (Perfect / On Time / Completed) affecting rewards
- Streak from required Non-Negotiables; category/subcategory completion bonuses
- Activity-driven completion (workout, nutrition) via `completeQuest()`

**Architecture:** Definitions in `src/data/quests.ts`; logic in `src/features/quests/`; all completions through `gameStore.completeQuest()`.

**Persistence:** `GameState.quests`, `completionRewardClaims`, streak fields.

**Extension points:** New quest categories, AI-generated quests, seasonal events, quest chains.

**Docs:** [QUESTS.md](QUESTS.md)

---

## Today's Journey

**Purpose:** Single-glance **daily progress** — where the Hero stands right now.

**Capabilities:**

- Non-negotiable subcategory progress bars
- Active workout session progress rows
- Top **coaching recommendations** (max 3) from Progression Engine + nutrition nudges

**Architecture:** `TodaysJourney.tsx` consumes `questProgress`, `workoutProgress`, `heroCoachingLogic` selectors.

**Persistence:** Derived from live quest/workout/coaching state — not a separate store slice.

**Extension points:** Story objectives, world events, companion prompts.

---

## History

**Purpose:** Long-term, append-only **daily rollups** for multi-day analytics and calendar views.

**Capabilities:**

- `DailySnapshot` per Hero Day (quests completed/missed, XP/gold deltas, level, streak)
- Written on quest-day advance (`applyPeriodResets`)
- Powers Analytics day aggregations and contribution calendar

**Architecture:** `src/features/history/historyLogic.ts`; `HeroHistoryPanel` for UI.

**Persistence:** `GameState.history.dailySnapshots`.

**Extension points:** Weekly/monthly rollup snapshots, export, cloud backup.

**Docs:** [HISTORY.md](HISTORY.md)

---

## Hero Timeline

**Purpose:** Fine-grained **memorable moments** for Recent Progress, Daily Summary, and Hero History timeline tab.

**Capabilities:**

- Event types: quest complete/fail, level up, streak, unlock, achievement, workout, PR, nutrition, coaching, **Hero title**, **lifetime accomplishment**
- Filter categories: All, Progress, Quests, Achievements, Unlocks
- Search within timeline
- Workout events link to detail modal

**Architecture:** `GameEvent` union in `src/types/event.ts`; formatters in `eventLogic.ts`; timeline assembly in `historyTimeline.ts`.

**Persistence:** `GameState.events` — **capped at 50 entries** (recent buffer only). Long-term trends use `history` + `questHistory`, not events.

**Extension points:** Unlimited archive, event replay, story event types.

**Docs:** [HISTORY.md](HISTORY.md)

---

## Analytics

**Purpose:** Read-only **rolling-window statistics** across all domains.

**Capabilities:**

- Periods: Today, Last 7/30/90/180/365 Days — shared `resolvePeriodRange()`
- Hero, quest, timed quest, punctuality, progress, history, achievement, workout, performance, progression, nutrition, **hero identity** rollups
- Metric registry controls period visibility per stat
- Recharts visualizations via chart selectors

**Architecture:** `src/features/analytics/` — `AnalyticsInput` → `getAnalyticsForPeriod()` → selectors → Dashboard.

**Persistence:** None (derived at read time).

**Extension points:** Finance, learning, combat analytics domains following [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md) pattern.

**Docs:** [ANALYTICS.md](ANALYTICS.md)

---

## Insights

**Purpose:** **Behavioral pattern cards** from analytics — interpretation, not coaching.

**Capabilities:**

- Quest, routine, behavior trend, workout volume, nutrition pattern insights
- Period-scoped bundles via `generateInsightsForPeriod()`

**Architecture:** `src/features/insights/` — consumes `AnalyticsInput`, never mutates store.

**Persistence:** None.

**Extension points:** ML-based patterns, cross-domain correlations, insight → coaching handoff.

**Docs:** [INSIGHTS.md](INSIGHTS.md)

---

## Quest Explorer

**Purpose:** Per-quest **performance drill-down** with punctuality and charts.

**Capabilities:**

- Searchable quest list with completion/miss stats
- Punctuality breakdown (perfect/on-time rates from `questHistory`)
- Chart bundle: completion trend, rate trend, grade distribution

**Architecture:** `src/features/questExplorer/`; reads `questHistory` + analytics periods.

**Persistence:** Uses `GameState.questHistory` (append-only completions/misses).

**Extension points:** Quest comparison, forecasting, export.

**Docs:** [QUEST_EXPLORER.md](QUEST_EXPLORER.md)

---

## Achievements

**Purpose:** **Collectible milestones** with XP/gold rewards and Achievement Points — distinct from Hero Identity accomplishments.

**Capabilities:**

- Data-driven catalog with rarity tiers
- Unlock popup + panel; timeline events
- Evaluated after quest completion and on rehydrate

**Architecture:** `src/features/achievements/`; definitions co-located with logic.

**Persistence:** `GameState.achievements[]` — one state per definition id.

**Extension points:** Hidden achievements, seasonal sets, achievement-driven unlocks.

**Docs:** [PROGRESSION.md](PROGRESSION.md)

---

## Workout Engine

**Purpose:** Log **training sessions** — templates, sets, timers, duration activities — as Hero Activities separate from quest checkboxes.

**Capabilities:**

- Template programs (upper, lower, core, rehab, …)
- Session lifecycle: draft → in progress → pause → review → complete
- Set logging, rest/exercise timers, circuit blocks
- Duration activities (walk, run, etc.)
- Quest resolution by template type → `completeQuest()`
- `WORKOUT_COMPLETED` timeline events

**Architecture:** `src/features/workout/`; data in `src/data/exercises.ts`, `workoutTemplates/`.

**Persistence:** `GameState.workout` — templates, sessions, activities, active session id.

**Extension points:** External sync (HealthKit, Strava shape prepared), custom templates, RPE, program periodization.

**Docs:** [WORKOUT.md](WORKOUT.md), [WORKOUT_TIMING.md](WORKOUT_TIMING.md), [ACTIVITIES.md](ACTIVITIES.md)

---

## Nutrition

**Purpose:** **Meal logging** and daily nutrient tracking integrated with nutrition quests.

**Capabilities:**

- Log breakfast/lunch/dinner/snack with food entries
- Daily protein/calorie targets (from Fitness Settings)
- Auto-completes meal quests + vitamins-protein when protein target met
- Analytics, insights, streak logic for meal consistency
- Quest revert on meal delete (no XP clawback)

**Architecture:** `src/features/nutrition/`; `logMeal()` → quest resolution → `completeQuest()`.

**Persistence:** `GameState.nutrition` — activities + targets (mirrored from settings).

**Extension points:** Water logging, barcode scan, meal templates, external nutrition APIs.

**Docs:** [NUTRITION.md](NUTRITION.md)

---

## Performance Assessments (PRs)

**Purpose:** **Official Personal Records** from structured assessments — not from casual workouts.

**Capabilities:**

- Baseline assessment flow for new Heroes
- Performance benchmark tests (push-ups, plank, squats, curls, walk, …)
- Official PR table + append-only PR history
- Exercise families, roles, prerequisites for progression
- `PERSONAL_RECORD_ACHIEVED` timeline events

**Architecture:** `src/features/performance/`; assessment pipeline updates `PerformanceState`.

**Persistence:** `GameState.performance` — sessions, official records, prHistory, activities.

**Extension points:** Additional assessment domains (nutrition, learning, financial — types exist, fitness only implemented).

**Docs:** [PERFORMANCE.md](PERFORMANCE.md)

---

## Progression Engine (Coaching)

**Purpose:** **Informational coaching** from training trends, PRs, and prerequisites — never auto-modifies workouts.

**Capabilities:**

- Rule-based recommendations (increase weight/reps, maintain, deload, assess, introduce exercise, consistency, recovery)
- Recommendation history with confidence levels
- Surfaces in Workout panel, Workout Analytics, and **Today's Journey** (via `heroCoachingLogic`)
- `COACHING_RECOMMENDATION` timeline events

**Architecture:** `src/features/progression/` + `src/features/coaching/heroCoachingLogic.ts`.

**Persistence:** `GameState.coaching` — active recommendations + history.

**Extension points:** ML models, user feedback loop, coaching → quest suggestions.

**Docs:** [COACHING.md](COACHING.md)

---

## Fitness Settings

**Purpose:** Player-configurable **targets and unit preferences**.

**Capabilities:**

- Protein, calorie, water targets
- Preferred units; workout preferences placeholder
- Synced to `nutrition.targets` on change

**Architecture:** `src/features/settings/fitnessSettingsLogic.ts`; `FitnessSettingsPanel.tsx`.

**Persistence:** `GameState.fitnessSettings` (save **0.0.9**).

**Extension points:** Full unit wiring in workout display, body metrics, goal profiles.

**Docs:** [FITNESS_SETTINGS.md](FITNESS_SETTINGS.md)

---

## Save System

**Purpose:** Reliable **local persistence** with automatic migration.

**Capabilities:**

- Single Zustand store → `localStorage` key `ascendant-game`
- Ordered migration chain to `0.0.10`
- Idempotent `normalizeShape()` for legacy edge cases
- `merge()` safe defaults for additive fields
- Rehydrate hooks: streak reconcile, timed quests, unlocks, achievements, Hero Identity sync

**Architecture:** `src/store/gameStore.ts`, `src/lib/migrations/`.

**Persistence:** Entire `GameState` — see field table in [PERSISTENCE.md](PERSISTENCE.md).

**Extension points:** Cloud save, export/import, multi-profile.

**Docs:** [PERSISTENCE.md](PERSISTENCE.md)

---

## DevTools

**Purpose:** Development-only testing helpers — **never shipped** to production UI (`import.meta.env.DEV`).

**Capabilities:**

- Time simulation (advance clock, freeze, resume)
- Quest bulk actions, achievement unlock
- History/analytics/insights/workout/nutrition sample generators
- State inspectors and dump helpers

**Architecture:** `src/dev/` lazy-loaded from Dashboard.

**Persistence:** `devSimulatedTime`, `devHeroTime` on GameState (dev only).

---

# Application Structure

## Navigation model

**Single page** — no client router. All features live on one Dashboard (`src/app/Dashboard.tsx`). Cross-panel navigation uses React context (e.g. `HeroHistoryNavigationProvider` opens a specific day from charts or achievements).

## Dashboard layout (top → bottom)

| # | Panel | Role |
|---|-------|------|
| 1 | Daily Summary banner | End-of-day recap when available |
| 2 | Hero Banner | Identity glance — title, name, rank, XP, today status, next objective |
| 3 | **Hero Profile** | Full identity — biography, titles, accomplishments, journey stats |
| 4 | Today's Journey | Daily progress + coaching |
| 5 | Unlocks | Earned daily permissions |
| 6 | Active Objectives | Timed/scheduled quest highlights |
| 7 | Quest List | Complete quests manually |
| 8 | Workout | Session logging |
| 9 | Performance | Assessments & PRs |
| 10 | Workout Analytics | Fitness analytics domain |
| 11 | Nutrition | Meal logging |
| 12 | Fitness Settings | Targets & units |
| 13 | Recent Progress | Last 5 timeline events |
| 14 | Achievements | Collectible catalog |
| 15 | Analytics | Core statistics + charts |
| 16 | Quest Explorer | Per-quest drill-down |
| 17 | Insights | Behavioral patterns |
| 18 | Hero History | Timeline, calendar, daily browser |
| 19 | Attributes | Eight stat display |
| 20 | DevTools | Dev only |

## UI organization patterns

- **Panel** + **Accordion** for major sections (persistence keys `ascendant-accordion:*`)
- **Metric registry** drives Analytics visibility — not hardcoded in JSX
- **Selectors** assemble view models; components render DTOs only
- Mobile-first single column (`max-w-2xl`)

**Docs:** [UI_UX.md](UI_UX.md)

---

# Architecture Overview

## State management

- **Zustand** single store: `useGameStore` in `src/store/gameStore.ts`
- Actions encapsulate mutations (`completeQuest`, `completeWorkout`, `logMeal`, `syncHeroIdentity`, …)
- React components subscribe to slices; heavy derivation in selectors

## Persistence

- `persist` middleware + `createMigratingStorage()` runs migrations before hydrate
- Save version independent of app version ([PERSISTENCE.md](PERSISTENCE.md))

## History architecture (three layers)

| Layer | Storage | Retention | Use |
|-------|---------|-----------|-----|
| **Events** | `GameState.events` | Max 50 | Recent Progress, timeline UI, Daily Summary |
| **History** | `GameState.history` | All days | Analytics rollups, calendar |
| **Quest History** | `GameState.questHistory` | All records | Quest Explorer, punctuality |

Do not reconstruct lifetime totals by scanning events — use `lifetimeStats` and snapshots.

## Analytics architecture

```
Store slices + definitions
    → selectAnalyticsInput()
    → getAnalyticsForPeriod(period)
    → PeriodAnalytics
    → Dashboard / Insights / Hero Profile (read-only)
```

Domain-specific dashboards (Workout Analytics, Nutrition charts) follow the **Analytics Domain** pattern without duplicating the core engine.

## Event system

- Typed `GameEvent` union
- Created in feature pipelines via `eventLogic.ts` record helpers
- Appended through `appendEvents()` with cap enforcement

## Snapshot system

- **Daily Summary** — live during day, frozen at day advance
- **Daily Snapshot** — written to `history` at day advance
- **Day Start Hero Snapshot** — diff basis for "earned today" in summary

## Important data models

| Model | Location | Role |
|-------|----------|------|
| `Hero` | `types/hero.ts` | Level, XP, stats, lifetimeStats |
| `HeroIdentityState` | `types/heroIdentity.ts` | Titles, accomplishments |
| `QuestState` / `QuestDefinition` | `types/quest.ts` | Runtime + data |
| `GameEvent` | `types/event.ts` | Timeline entries |
| `DailySnapshot` | `types/history.ts` | Day rollup |
| `WorkoutActivity` | `types/workout.ts` | Completed session record |
| `MealActivity` | `types/nutrition.ts` | Meal record |
| `PeriodAnalytics` | `types/analytics.ts` | Analytics bundle |

## Architectural principles

1. **Feature modules** — `features/<domain>/` with `*Logic.ts` + optional selectors + UI.
2. **Data-driven** — quests, achievements, accomplishments, exercises in `src/data/`.
3. **Single completion pipeline** — `completeQuest()` for rewards and side effects.
4. **Activities ≠ quests** — execution records separate from checkbox state.
5. **Analytics-first** — derive dashboards from stored history, don't duplicate counters unnecessarily.
6. **Hero-first integration** — new systems should connect to Identity, Timeline, Journey, History, Analytics.

**Index:** [ARCHITECTURE.md](ARCHITECTURE.md) · **Deep notes:** [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md)

---

# Data Flow

## Quest completion (manual)

```
QuestList → completeQuest(id)
    → processQuestCompletion (rewards, grade, streak)
    → events + questHistory + lifetimeStats
    → achievements + syncHeroIdentity
    → dailySummary sync
```

## Workout logging

```
WorkoutPanel → completeWorkout()
    → build WorkoutActivity, append to workout.activities
    → resolveWorkoutQuests → completeQuest() per matched quest
    → WORKOUT_COMPLETED event
    → coaching refresh + syncHeroIdentity
```

## Nutrition logging

```
NutritionPanel → logMeal()
    → append MealActivity
    → resolveNutritionQuests → completeQuest()
    → NUTRITION_MEAL_LOGGED / NUTRITION_TARGET_ACHIEVED events
```

## Timeline events

```
Gameplay pipelines → record* helpers → appendEvents()
    → Recent Progress (last 5)
    → Hero History timeline (grouped by day)
    → Daily Summary content
```

## Analytics

```
Store rehydrate / user views dashboard
    → selectAnalyticsInput(store, now)
    → getAnalyticsForPeriod('last7' | …)
    → metric registry + charts + Hero Profile percentages
```

## Hero progression

```
completeQuest / achievements / grantXp
    → addXp → level up → LEVEL_UP event
    → lifetimeStats increment
    → syncHeroIdentity (accomplishments, titles)
```

## Achievements

```
completeQuest or rehydrate
    → evaluateAchievements → applyAchievementRewards
    → ACHIEVEMENT_UNLOCKED events
```

## History

```
applyPeriodResets (new Hero Day)
    → finalize Daily Summary
    → recordDailySnapshot → history.dailySnapshots
    → syncHeroIdentity (days-active milestones)
```

## Persistence

```
Any set() on gameStore
    → Zustand persist → localStorage
    → (on load) migrateSaveData → merge → onRehydrateStorage hooks
```

---

# Development Principles

| Principle | In practice |
|-----------|-------------|
| **Hero-first design** | Strengthen identity, timeline, and journey integration before adding isolated mechanics. |
| **Reuse existing systems** | `completeQuest()`, `events`, `history`, `questHistory`, analytics selectors. |
| **Event-driven architecture** | Side effects through established pipelines, not ad-hoc store patches. |
| **Analytics-first** | Read-only rollups from history; profile percentages delegate to analytics. |
| **Avoid duplicated state** | Increment `lifetimeStats`; don't rescan unbounded event logs for totals. |
| **Extensible over hardcoded** | Data-driven quests, achievements, accomplishments, exercise catalogs. |
| **Feature integration** | Nutrition ↔ quests, workouts ↔ quests, coaching ↔ journey, identity ↔ timeline. |
| **Documentation sync** | Update docs + this PROJECT_STATE snapshot at milestones. |
| **UI is dumb** | Logic in `*Logic.ts`, assembly in selectors, render in components. |
| **Scope discipline** | Combat, inventory, story, skills — **v0.1.x only** unless explicitly requested. |

**Contributor guide:** [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) · **Coding style:** [CODING_STANDARDS.md](CODING_STANDARDS.md)

---

# AI-Assisted Development

Ascendant uses a **structured AI-assisted development process** — dedicated phases and conversation types, one responsibility per thread. This keeps product design, engineering plans, code, review, and documentation from mixing in a single chat.

| Phase | Focus | Typical tool |
|-------|-------|--------------|
| **Product Planning** | What and why | ChatGPT (long-lived) |
| **Technical Planning** | How to implement | Cursor — Plan Mode (medium/large features) |
| **Implementation** | Writing the code | Cursor — Composer |
| **Code Review** | Quality and understanding | Cursor (mandatory) |
| **Documentation** | Recording project state | Cursor (within Implementation or dedicated conversation) |
| **Implementation Reporting** | What shipped | Cursor (end of Implementation) |

Optional **Learning Review** helps the developer understand the implementation in depth. Separate conversations also cover **Debugging** and **Research**.

Implementation agents read **required documentation** from the indexed repo and **explore the codebase** via search — not manually attached document packets. See [AI_WORKFLOW.md](AI_WORKFLOW.md#cursor-implementation-context).

**Full process:** [AI_WORKFLOW.md](AI_WORKFLOW.md) · **Completion criteria:** [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) · **General lifecycle:** [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md)

Resume feature development: Product Planning for v0.0.6 scope → one Implementation conversation per feature.

---

# Current Roadmap Status

## Completed

| Version | Summary |
|---------|---------|
| **v0.0.1** | First playable loop — hero, quests, XP, localStorage |
| **v0.0.2** | Hero Dashboard 2.0, Non-Negotiables, timed quests, unlocks, streaks, achievements, Daily Summary, events |
| **v0.0.3** | History snapshots, Analytics Engine + Dashboard + Charts, Insights, Hero History UI, Quest Explorer, Hero Day, quest history |
| **v0.0.4** | Workouts, performance/PRs, coaching, workout analytics, nutrition, fitness settings, cross-system integration |
| **v0.0.5** | Hero Identity — profile, biography, titles, lifetime accomplishments, timeline integration |

## Current

**v0.0.5 complete.** No active milestone coded yet.

## Upcoming (high level)

| Track | Direction |
|-------|-----------|
| **v0.0.6+** | TBD — likely polish, QoL, or next identity/world prep milestone |
| **v0.1.x** | Combat, equipment, inventory, story, world, skills (design docs exist) |
| **Later** | Mobile/PWA, cloud saves, AI planning, external integrations |

**Detailed plan:** [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)

---

# Technical Debt

*Known limitations and intentional shortcuts — not a backlog of invented issues.*

| Area | Limitation |
|------|------------|
| **Navigation** | Single Dashboard page — no router; [UI_UX.md](UI_UX.md) describes future multi-screen design only. |
| **Events buffer** | `GameState.events` capped at **50** — not a full archival log; use `history` + `questHistory` for long-term data. |
| **Hero portrait** | Initials placeholder only — no custom avatar upload. |
| **Title selection** | Auto-select only — `activeTitleId` persisted but no UI to pick among unlocked titles. |
| **Bundle size** | Production JS bundle ~900KB — Vite warns; code-splitting not yet applied. |
| **Feature doc headers** | Some subsystem docs still say "v0.0.4" in their version line — content accurate, headers lagging. |
| **Fitness Settings** | Water target stored; water logging not implemented. Unit preferences partially wired in workout display. |
| **Dev sample data** | Sample history generators may not exercise every quest-integration path (e.g. some nutrition quest completions in dev-only flows). |
| **Level accomplishment events** | Level milestones unlock as accomplishments but **suppress** duplicate timeline events because `LEVEL_UP` already fires. |

None of these block daily use; they are acceptable for the current maturity stage.

---

# Extension Points

Current architecture anticipates future systems without implementing them.

| Future system | How today's architecture supports it |
|---------------|--------------------------------------|
| **Hero Classes** | `HeroIdentityState` documented extension; stats + identity layers separate from mechanics. |
| **Equipment / Inventory** | Flat stats on Hero; reward pipeline centralized in `completeQuest()`. |
| **Combat / Enemies** | Stats exist; event system can add combat event types; analytics domain pattern for combat stats. |
| **Story / World** | Timeline + accomplishments + biography as narrative foundation; `storyFlags` reserved on identity. |
| **Companions / Guilds** | Identity state extension points; timeline for relationship milestones. |
| **Reputation / Alignment** | Identity model ready for faction standing fields. |
| **AI Planning** | Analytics + Insights + Coaching layers provide structured inputs; activities extensible. |
| **External Integrations** | `WorkoutActivityIntegration` shape on activities; activity registry pattern for new sources. |
| **Multiplayer** | Would require sync layer — currently local-only by design. |

**Design references:** [FUTURE_IDEAS.md](FUTURE_IDEAS.md), [COMBAT.md](COMBAT.md), [STORY.md](STORY.md), [HERO_IDENTITY.md](HERO_IDENTITY.md)

---

# Documentation Status

## Documentation ownership

| Document | Responsibility |
|----------|----------------|
| [PROJECT_STATE.md](PROJECT_STATE.md) | **This file** — current implementation state and major systems |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Long-term product philosophy and design principles |
| [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | Important decisions and reasoning behind them |
| [AI_WORKFLOW.md](AI_WORKFLOW.md) | How AI agents/conversations are used during development |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | General software development lifecycle and project practices |
| [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) | Completion criteria for features and versions |
| [README.md](../README.md) | Project overview, setup, and documentation entry point |

Do not duplicate content across these documents — cross-link instead.

## Canonical entry points

| Document | Role |
|----------|------|
| **[PROJECT_STATE.md](PROJECT_STATE.md)** | **This snapshot** — start here for "what exists today" |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Subsystem index and integration map |
| [README.md](../README.md) | Setup, stack, quick feature list |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Milestone roadmap |
| [MILESTONES.md](MILESTONES.md) | Major product phases |
| [CHANGELOG.md](CHANGELOG.md) | Release notes (historical) |
| [PERSISTENCE.md](PERSISTENCE.md) | Save schema |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Contributor conventions |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | General development lifecycle |
| [AI_WORKFLOW.md](AI_WORKFLOW.md) | **Canonical AI workflow** — phases, conversation types, feature lifecycle |
| [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) | Feature / version completion checklist |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Enduring product philosophy |
| [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | **Product decision log** — why major choices were made |

## Feature documentation (implemented)

Hero Identity, History, Analytics, Insights, Quest Explorer, Quests, Activities, Workout, Performance, Coaching, Nutrition, Fitness Settings, Workout Analytics, Time, Economy, Progression, UI/UX.

## AI / agent context

[AGENTS.md](../AGENTS.md), [CLAUDE.md](../CLAUDE.md), [AI_CONTEXT.md](AI_CONTEXT.md)

## Future-only design docs

[COMBAT.md](COMBAT.md), [STORY.md](STORY.md), [FUTURE_IDEAS.md](FUTURE_IDEAS.md)

## Recently updated (workflow documentation pass)

AI_WORKFLOW.md, DEVELOPMENT_WORKFLOW.md, DEFINITION_OF_DONE.md, PRODUCT_DECISIONS.md, PROJECT_STATE.md, README.md, AGENTS.md, AI_CONTEXT.md — formalized AI-assisted development workflow (v0.0.5 foundation).

## Previously updated (v0.0.5 milestone)

HERO_IDENTITY.md, ARCHITECTURE.md, PERSISTENCE.md, CHANGELOG.md, CLAUDE.md, IMPLEMENTATION_PLAN.md, MILESTONES.md, PRODUCT_PRINCIPLES.md.

## Gaps & recommendations

| Gap | Recommendation |
|-----|----------------|
| No dedicated **Unlocks** feature doc | Low priority — behavior documented in QUESTS.md / PROGRESSION.md |
| Per-doc version headers inconsistent | Batch-update "Version:" lines when touching each doc |
| No automated doc drift checks | Consider CI grep for `CURRENT_SAVE_VERSION` vs PERSISTENCE.md |
| PROJECT_STATE maintenance | Update this file at each major milestone before starting next |

---

# Changelog Summary

Concise version history — full detail in [CHANGELOG.md](CHANGELOG.md).

## v0.0.1

First playable RPG loop: hero stats, quest completion, XP/gold rewards, browser persistence, single dashboard.

## v0.0.2

Hero Dashboard 2.0; Non-Negotiables quest structure; timed quests and grades; unlocks and streaks; achievements; Daily Summary; GameEvent buffer; lifetime statistics; developer time simulation.

## v0.0.3

Append-only Hero History snapshots; Analytics Engine + Dashboard + Recharts; Insights Engine; Hero History UI (timeline, calendar, daily browser); Quest History + Quest Explorer + punctuality; Hero Day (5:00 AM boundary).

## v0.0.4

Full fitness stack: workout sessions and activities; performance assessments and Official PRs; Progression Engine coaching; Workout Analytics domain; nutrition with quest integration; fitness settings; unified rolling analytics windows; dashboard coaching in Today's Journey.

## v0.0.5

Hero Identity: expanded profile, living biography, accomplishment-based titles, lifetime milestones (distinct from achievements), timeline events for identity moments, analytics exposure, migration backfill without event flood. Marks the shift to **Hero-first** design philosophy.

---

# Project Health

## Current strengths

- **Coherent architecture** — feature modules, single store, clear completion pipeline, read-only analytics.
- **Rich foundation** — history, quest history, events, activities, and lifetime stats support multi-domain features without rewrites.
- **Integration maturity** — workouts, nutrition, coaching, quests, and identity connect through shared pipelines.
- **Documentation depth** — subsystem docs, persistence table, architecture index, and this baseline snapshot.
- **Save compatibility** — ten-version migration chain with backfill patterns for new identity fields.

## Current maturity

**Early product / late foundation.** Ascendant is a capable personal RPG for daily life management and fitness tracking with strong retrospective analytics. It is not yet a narrative RPG, combat game, or multi-platform product.

## Architecture readiness

**Good** for extending fitness, identity, analytics, and coaching. **Prepared but empty** for v0.1.x combat/world/story via extension points and stat model. Store and migration patterns proven across five application milestones.

## Maintainability

**High** for a solo/small-team TypeScript React codebase: explicit types, data-driven catalogs, selector pattern, dev tooling, lint + build CI-ready scripts. Main watchpoint is Dashboard size (many panels on one page) and store action growth — consider action grouping if v0.1.x adds large domains.

## Recommended next focus

1. **Define v0.0.6 milestone** in IMPLEMENTATION_PLAN.md — use Product Planning (ChatGPT), then Implementation conversations per [AI_WORKFLOW.md](AI_WORKFLOW.md).
2. **Keep Hero-first lens** — any new feature should integrate with Profile, Timeline, Journey, or History.
3. **Optional housekeeping** — bundle code-splitting, align per-doc version headers, dedicated Unlocks doc if unlock rules grow.
4. **Defer v0.1.x** until foundation milestones are explicitly prioritized — combat/world docs exist but should not leak into v0.0.x scope.

Development workflow documentation is **complete** — resume feature work under the formalized AI-assisted process.

---

*End of Project State snapshot (v0.0.5).*
