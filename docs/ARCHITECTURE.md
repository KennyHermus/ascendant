# Ascendant Architecture Index

Version: aligned with application **v0.0.5** (save schema **0.0.10**)

This document is the **entry point** for developers. It maps major subsystems, their responsibilities, and where to read more. Detailed implementation notes from earlier milestones live in [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md).

---

# Stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Build | Vite 8 |
| State | Zustand (single persisted store) |
| Charts | Recharts |
| Persistence | Browser `localStorage` via versioned migrations |

---

# Folder Structure

```
src/
├── app/                 # App shell, Dashboard composition
├── components/          # Shared UI (Panel, Accordion, ProgressBar, …)
├── data/                # Data-driven definitions (quests, exercises, templates, …)
├── features/            # Feature modules (logic + UI per domain)
├── lib/                 # gameTime, timeService, storage, migrations
├── store/               # gameStore.ts — single source of persisted truth
├── types/               # Shared TypeScript models
└── dev/                 # Dev-only tools (lazy-loaded, import.meta.env.DEV)
```

Game logic lives in `features/*/ *Logic.ts`. Components render selector output — they do not compute rewards or mutate history directly.

---

# System Map

## Cross-cutting data flow

```
Player action
    ↓
Feature logic (pure) + gameStore action
    ↓
GameState update (hero, quests, activities, …)
    ↓
Events (recent buffer) + questHistory + lifetimeStats
    ↓
History snapshot (on day advance)
    ↓
Analytics Engine (read-only rollups)
    ↓
Insights Engine (behavioral patterns — not coaching)
    ↓
UI (Dashboard, Timeline, Today's Journey, …)
```

## Quest completion pipeline

```
completeQuest()  OR  activity-driven resolution (workout / nutrition)
    ↓
XP, gold, stat rewards, completion grade
    ↓
Quest state, streak, unlocks, achievements
    ↓
GameEvent + questHistory record
    ↓
Daily Summary sync, lifetimeStats increment
```

---

# Subsystems

## Hero System

**Purpose:** Player identity — level, XP, gold, eight stats, ranks, accomplishment titles, biography, lifetime milestones, lifetime counters, status presentation.

| | |
|---|---|
| **Models** | `Hero`, `LifetimeStats`, `HeroIdentityState` — `src/types/hero.ts`, `src/types/heroIdentity.ts` |
| **Logic** | `src/features/hero/` — level ranks, presentation; `src/features/heroIdentity/` — titles, accomplishments, biography |
| **UI** | `HeroBanner.tsx`, `HeroProfileSection.tsx`, `StatsPanel.tsx` |
| **Integration** | Updated by `completeQuest()`, workouts, assessments, `syncHeroIdentity()`; Timeline events; Analytics hero section |

Docs: [HERO_IDENTITY.md](HERO_IDENTITY.md), [GAME_BIBLE.md](GAME_BIBLE.md), [PROGRESSION.md](PROGRESSION.md)

---

## Quest System

**Purpose:** Real-world actions as completable quests with rewards, timing, schedules, and streak contribution.

| | |
|---|---|
| **Models** | `QuestDefinition` (data), `QuestState` (runtime) — `src/types/quest.ts` |
| **Data** | `src/data/quests.ts` |
| **Logic** | `src/features/quests/` — completion, timing, schedule, progress aggregation |
| **UI** | `QuestList.tsx`, `QuestCard.tsx`, `TodaysJourney.tsx` |
| **Integration** | Activity-driven quests via `activityRegistry.ts`; events + `questHistory` on complete/miss |

Docs: [QUESTS.md](QUESTS.md)

---

## Hero Activities

**Purpose:** Separate **execution records** (workouts, meals, assessments) from checkbox quest state. Activities can drive quest completion.

| Kind | Record type | Quest integration |
|------|-------------|-------------------|
| `workout` | `WorkoutActivity` | Template → workout/core/rehab/walk quests |
| `nutrition` | `MealActivity` | Meal type → breakfast/lunch/dinner; protein target → vitamins-protein |
| `performance_assessment` | `PerformanceAssessmentActivity` | Does not complete quests; updates Official PRs |

Docs: [ACTIVITIES.md](ACTIVITIES.md)

---

## Workout System

**Purpose:** Log training sessions — templates, sets, timers, duration activities, session lifecycle.

| | |
|---|---|
| **Models** | `WorkoutState`, `WorkoutSession`, `WorkoutActivity` — `src/types/workout.ts` |
| **Data** | `src/data/exercises.ts`, `src/data/workoutTemplates/` |
| **Logic** | `src/features/workout/` — sessions, timing, quest resolution, statistics |
| **UI** | `WorkoutPanel.tsx` |
| **Integration** | `completeWorkout()` → `completeQuest()` + `WORKOUT_COMPLETED` event; coaching reads activities |

Docs: [WORKOUT.md](WORKOUT.md), [WORKOUT_TIMING.md](WORKOUT_TIMING.md), [DURATION_ACTIVITIES.md](DURATION_ACTIVITIES.md), [WORKOUT_DATA.md](WORKOUT_DATA.md)

---

## Performance Assessment System

**Purpose:** Baseline and benchmark assessments that establish/update **Official Personal Records** — separate from normal workouts.

| | |
|---|---|
| **Models** | `PerformanceState`, `OfficialPersonalRecord`, `PersonalRecordHistoryEntry` |
| **Logic** | `src/features/performance/` |
| **UI** | `PerformancePanel.tsx` |
| **Integration** | `PERSONAL_RECORD_ACHIEVED` events; feeds Progression Engine and Workout Analytics |

Docs: [PERFORMANCE.md](PERFORMANCE.md)

---

## Progression Engine (Coaching)

**Purpose:** Analyze training trends + PRs + prerequisites; emit **informational** coaching recommendations. Never auto-edits workouts.

| | |
|---|---|
| **Models** | `CoachingState`, `CoachingRecommendation` — `src/types/progression.ts` |
| **Logic** | `src/features/progression/` — engine, pipeline, analytics |
| **UI** | Workout panel banners; **Today's Journey** top recommendations (`heroCoachingLogic.ts`) |
| **Integration** | `COACHING_RECOMMENDATION` events; `PeriodAnalytics.progression` |

Docs: [COACHING.md](COACHING.md)

---

## Nutrition System

**Purpose:** Quick meal logging, daily nutrient tracking, quest integration, analytics, and insights.

| | |
|---|---|
| **Models** | `NutritionState`, `MealActivity`, `NutritionTargets` — `src/types/nutrition.ts` |
| **Logic** | `src/features/nutrition/` — logging, statistics, quest resolution/sync |
| **UI** | `NutritionPanel.tsx` |
| **Integration** | `logMeal()` → quest completion; `NUTRITION_MEAL_LOGGED` / `NUTRITION_TARGET_ACHIEVED` events |

Docs: [NUTRITION.md](NUTRITION.md)

---

## Fitness Settings

**Purpose:** Player-configurable targets and unit preferences.

| | |
|---|---|
| **Models** | `FitnessSettings` — `src/types/fitnessSettings.ts` |
| **Logic** | `src/features/settings/fitnessSettingsLogic.ts` |
| **UI** | `FitnessSettingsPanel.tsx` |
| **Integration** | Mirrored to `nutrition.targets` for analytics and protein-quest checks |

Docs: [FITNESS_SETTINGS.md](FITNESS_SETTINGS.md)

---

## History System

**Purpose:** Long-term append-only daily snapshots for multi-day trends.

| | |
|---|---|
| **Models** | `HeroHistory`, `DailySnapshot` — `src/types/history.ts` |
| **Logic** | `src/features/history/historyLogic.ts` |
| **UI** | `HeroHistoryPanel.tsx` — timeline, calendar, daily browser |
| **Integration** | Written on quest-day advance; primary Analytics input for day rollups |

Docs: [HISTORY.md](HISTORY.md)

---

## Quest History & Quest Explorer

**Purpose:** Per-quest completion/miss log with punctuality grades — powers Quest Explorer and timed analytics.

| | |
|---|---|
| **Models** | `QuestHistory` — `src/types/questHistory.ts` |
| **Logic** | `src/features/questExplorer/` |
| **UI** | `QuestExplorerPanel.tsx` |
| **Integration** | Appended on quest complete/miss; punctuality analytics + insights |

Docs: [QUEST_EXPLORER.md](QUEST_EXPLORER.md)

---

## Analytics Engine

**Purpose:** Read-only derived statistics across all domains for a selected rolling time window.

| | |
|---|---|
| **Models** | `PeriodAnalytics`, `AnalyticsPeriod` — `src/types/analytics.ts` |
| **Logic** | `src/features/analytics/analyticsLogic.ts`, `analyticsPeriods.ts` |
| **UI** | `AnalyticsDashboard.tsx`, `AnalyticsCharts.tsx`; domain panels (Workout, Nutrition) |
| **Periods** | Today, Last 7/30/90/180/365 Days — shared `resolvePeriodRange()` |

Docs: [ANALYTICS.md](ANALYTICS.md), [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md)

---

## Insights Engine

**Purpose:** Behavioral pattern cards from Analytics + History. **Does not coach** — that is the Progression Engine.

| | |
|---|---|
| **Models** | `PeriodInsights`, `InsightCard` — `src/types/insights.ts` |
| **Logic** | `src/features/insights/` |
| **UI** | `InsightsDashboard.tsx` |

Docs: [INSIGHTS.md](INSIGHTS.md)

---

## Hero Timeline (Events)

**Purpose:** Recent fine-grained moments for Recent Progress, Daily Summary, and Hero History timeline.

| | |
|---|---|
| **Models** | `GameEvent` — `src/types/event.ts` |
| **Logic** | `src/features/events/eventLogic.ts` |
| **UI** | `RecentProgress.tsx`, timeline in Hero History |
| **Retention** | Capped at 50 entries — not long-term storage |

---

## Achievements

**Purpose:** Data-driven milestones consuming hero/quest/lifetime state.

| | |
|---|---|
| **Models** | `AchievementDefinition`, `AchievementState` |
| **Logic** | `src/features/achievements/` |
| **UI** | `AchievementPanel.tsx`, unlock popup |

Docs: [PROGRESSION.md](PROGRESSION.md) (achievement section)

---

## Today's Journey & Dashboard

**Purpose:** Glanceable daily progress — quest categories, active workouts, top coaching recommendations.

| | |
|---|---|
| **Logic** | `questProgress.ts`, `workoutProgress.ts`, `heroCoachingLogic.ts` |
| **UI** | `TodaysJourney.tsx` on Dashboard |

---

## Save System & Persistence

**Purpose:** Versioned localStorage persistence with automatic migrations on load.

| | |
|---|---|
| **Store** | `src/store/gameStore.ts` |
| **Migrations** | `src/lib/migrations/migrations.ts` — `CURRENT_SAVE_VERSION = '0.0.10'` |
| **Adapter** | `src/lib/migrations/migratingStorage.ts` |

Docs: [PERSISTENCE.md](PERSISTENCE.md)

---

## Time Service

**Purpose:** Hero Day boundary (5:00 AM), simulated time for dev testing, consistent date keys.

| | |
|---|---|
| **Modules** | `src/lib/timeService.ts`, `src/lib/gameTime.ts` |

Docs: [TIME.md](TIME.md)

---

## DevTools

**Purpose:** Developer-only testing helpers — never shipped to production UI paths without `import.meta.env.DEV` guards.

| | |
|---|---|
| **Location** | `src/dev/` — lazy-loaded from Dashboard |

---

# Analytics Domains

Workout Analytics and Nutrition charts follow the **Analytics Domain** pattern — separate dashboard sections with their own selectors, sharing core period filters and chart components.

Future domains (Finance, Learning, Combat) should follow the same pattern documented in [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md).

---

# Principles

1. **UI is dumb** — logic in `*Logic.ts`, assembly in selectors, rendering in components.
2. **Data-driven definitions** — quests, exercises, achievements in `src/data/`.
3. **Consume foundations** — do not reconstruct history from current quest state.
4. **Event-driven side effects** — quest completion, streak, unlocks, achievements flow through `completeQuest()` or equivalent activity paths.
5. **Combat / inventory / story / skills** — **v0.1.x only**. Do not implement in v0.0.x.

Full principles and v0.0.x implementation history: [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md).

---

# Related Documentation

| Topic | Document |
|-------|----------|
| **Project baseline** | [PROJECT_STATE.md](PROJECT_STATE.md) |
| Development process | [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) |
| Completion checklist | [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) |
| Product phases | [MILESTONES.md](MILESTONES.md) |
| Product philosophy | [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) |
| Roadmap | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| Release notes | [CHANGELOG.md](CHANGELOG.md) |
| Developer conventions | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| Save schema | [PERSISTENCE.md](PERSISTENCE.md) |
| Game design | [GAME_BIBLE.md](GAME_BIBLE.md) |
| Coding style | [CODING_STANDARDS.md](CODING_STANDARDS.md) |
| AI assistants | [AI_CONTEXT.md](AI_CONTEXT.md), [AGENTS.md](../AGENTS.md) |
