# Developer Guide

Version: aligned with application **v0.0.4**

Conventions for contributing to Ascendant. Read [ARCHITECTURE.md](ARCHITECTURE.md) first for the subsystem map.

---

# Before You Code

1. Read [README.md](../README.md), [ARCHITECTURE.md](ARCHITECTURE.md), and the feature doc for your area.
2. Confirm scope matches the current milestone ([IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)).
3. Do not implement v0.1.x systems (combat, inventory, story, skills) unless explicitly requested.

---

# Project Conventions

## Feature-based layout

```
features/myFeature/
  myFeatureLogic.ts      # Pure game logic — no React
  myFeatureSelectors.ts  # React hooks / memoized assembly (optional)
  MyFeaturePanel.tsx     # Presentation only
```

- **Logic** functions take explicit inputs and return outputs. No `useGameStore` inside logic files.
- **Components** call selectors or store actions; they do not compute XP, streaks, or analytics.
- **Data definitions** live in `src/data/`, not hardcoded in components.

## Event-driven architecture

Side effects flow through established pipelines:

| Player action | Primary pipeline |
|---------------|------------------|
| Click quest Complete | `completeQuest()` |
| Finish workout | `completeWorkout()` → `resolveWorkoutQuests()` → `completeQuest()` |
| Log meal | `logMeal()` → `resolveNutritionQuests()` → `completeQuest()` |
| Timed quest expires | `evaluateTimedQuests()` |

`completeQuest()` handles: rewards, streak, unlocks, achievements, events, questHistory, dailySummary sync, lifetimeStats.

**Do not duplicate** reward or event logic outside these paths.

## Selectors

- Analytics: `analyticsSelectors.ts` assembles `AnalyticsInput` from store + definitions.
- Workout Analytics: `workoutAnalyticsSelectors.ts` — components never read `GameState` directly.
- Nutrition: `nutritionSelectors.ts`.
- Coaching: `progressionSelectors.ts`.

Pattern: `useMemo` + pure logic functions. Selectors are read-only regarding game state.

## Hero Activities

Quest checkboxes and activity records are **separate layers**:

- **Quest** — daily reward eligibility (`QuestState`).
- **Activity** — execution record (`WorkoutActivity`, `MealActivity`, `PerformanceAssessmentActivity`).

Activity-driven quests are listed in `activityRegistry.ts`. Resolution modules call `completeQuest()` — never inline reward logic.

## Analytics

### Core Engine

- Input type: `AnalyticsInput` (`analyticsLogic.ts`).
- Periods: `today`, `last7`, `last30`, `last90`, `last180`, `last365`.
- Shared filtering: `resolvePeriodRange()` in `analyticsPeriods.ts`.
- Output: `PeriodAnalytics` — read-only, never mutates store.

### Analytics Domains

Workout Analytics and Nutrition charts follow the **Analytics Domain** pattern ([WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md)):

- Separate dashboard section and selectors.
- Reuses core period filters and chart components.
- Does not modify the core Analytics Dashboard.

### Adding analytics for a new domain

1. Add rollup type to `PeriodAnalytics` in `types/analytics.ts`.
2. Implement `getXAnalytics(input, period)` in `features/x/`.
3. Wire into `getAnalyticsForPeriod()`.
4. Add selectors + UI panel.
5. Optionally add Insights generators consuming the same input.

## Insights vs Coaching

| | Insights | Coaching (Progression Engine) |
|---|----------|----------------------------|
| **Purpose** | Describe past behavior | Suggest next training steps |
| **Location** | `features/insights/` | `features/progression/` |
| **UI** | Insights Dashboard | Workout banners, Today's Journey |
| **Rule** | Never recommends actions | Never auto-modifies workouts |

---

# Save Migrations

When persisted shape changes:

1. Edit `src/lib/migrations/migrations.ts` — append migration, bump `CURRENT_SAVE_VERSION`.
2. Add safe defaults in store `merge()` for the new field.
3. Update [PERSISTENCE.md](PERSISTENCE.md) and [CHANGELOG.md](CHANGELOG.md).

When a new field can default safely without semantic migration (e.g. empty array), you may use `merge()` only — document the choice.

---

# Versioning

| Concept | Where | Example |
|---------|-------|---------|
| Application version | `package.json` | `0.0.4` |
| Save schema version | `CURRENT_SAVE_VERSION` | `0.0.9` |
| Block schema version | e.g. `NUTRITION_SCHEMA_VERSION` | `1` |

Bump save version when existing saves need transformation. Bump application version for releases.

---

# Documentation Expectations

When adding a **major feature**:

- Update [ARCHITECTURE.md](ARCHITECTURE.md) subsystem entry (brief).
- Add or update a feature doc in `docs/` (e.g. `NUTRITION.md`).
- Update [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [CHANGELOG.md](CHANGELOG.md).
- Update [PERSISTENCE.md](PERSISTENCE.md) if persistence changes.
- Update [README.md](../README.md) if user-facing scope changes.

Keep [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) for detailed implementation archaeology — do not bloat the index.

---

# Adding a New System (Checklist)

1. **Types** — `src/types/`
2. **Logic** — `src/features/<name>/`
3. **Data** — `src/data/` if data-driven
4. **Store** — actions on `gameStore.ts`; extend `GameState`
5. **Migration** — if persisted
6. **Events** — if player-visible moments (`eventLogic.ts`)
7. **Analytics** — if historical rollups needed
8. **UI** — Dashboard panel
9. **DevTools** — sample data helpers (dev only)
10. **Docs** — feature doc + architecture index entry

Prefer consuming `history`, `questHistory`, `events`, and `lifetimeStats` over scanning ephemeral quest state for multi-day questions.

---

# Testing Locally

```bash
npm run dev          # development server
npm run lint         # oxlint
npm run build        # typecheck + production bundle
```

Use DevTools for time simulation, bulk quest completion, and sample history generation. Verify cross-system propagation: action → events → timeline → analytics → insights.

---

# Code Style

See [CODING_STANDARDS.md](CODING_STANDARDS.md) for naming, TypeScript, and component rules.

---

# AI Assistants

- [AGENTS.md](../AGENTS.md) — agent instructions
- [CLAUDE.md](../CLAUDE.md) — concise context
- [AI_CONTEXT.md](AI_CONTEXT.md) — full AI background
