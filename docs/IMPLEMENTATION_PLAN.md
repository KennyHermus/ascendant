# Ascendant Implementation Plan & Roadmap

Version: 0.0.2 (documentation aligned with current codebase)

---

# Purpose

This document tracks milestones: what shipped, what is next, and what remains future.

The documentation and code should agree on version numbers:

- **Application version:** `package.json` → currently **0.0.2**
- **Save schema version:** `CURRENT_SAVE_VERSION` → currently **0.0.2** (only bumps when persisted shape/meaning changes)

---

# Development Philosophy

Build the smallest version that creates the core gameplay loop.

Prioritize:

1. Functionality
2. Clean architecture
3. Extensibility
4. Enjoyable user experience

Avoid implementing complex systems before the foundation exists.

---

# Completed: v0.0.1 Foundation

First playable loop:

- Hero profile (level, XP, gold, stats)
- Quest completion with rewards
- Persistence via localStorage
- Single dashboard

Historical detail (quest categories, boolean completion, etc.) lived in earlier plans and has been superseded by v0.0.2. See git history / older ARCHITECTURE notes if needed.

---

# Completed: v0.0.2

✓ Hero Dashboard 2.0 (Hero Banner, Today's Journey, Active Objectives, Recent Progress, Attributes)  
✓ Non-Negotiables quest restructure (subcategories, optional quests, weekday schedules)  
✓ Timed quest system (target times, grace periods, weekday-only)  
✓ Developer time simulation (persisted)  
✓ Unlock system (Messages, YouTube, Gaming, Social Media, Netflix)  
✓ Streak system based on required Non-Negotiables  
✓ Category / subcategory completion rewards  
✓ Internal GameEvent tracking foundation  
✓ Quest progress aggregation utilities (`questProgress.ts`)  
✓ Lifetime statistics  
✓ Daily Summary  
✓ Achievements (data-driven, rarity, Achievement Points, popup + panel)  
✓ Accordion organization (Quests, Unlocks, Achievements, Today's Journey Non-Negotiables)

**Not completed in v0.0.2 (do not mark done):** History UI, Analytics, Combat, Inventory, Story, Equipment, Skills.

---

# In Progress: v0.0.3 — History and Analytics

## Completed: History Foundation

✓ Persistent `HeroHistory` with append-only `DailySnapshot` records
✓ Written on quest-day advance (application / simulated time)
✓ Save migration `0.0.2 → 0.0.3`
✓ History DevTools (generate / delete latest / reset history / count)
✓ Docs: [HISTORY.md](HISTORY.md)

**Not in Foundation:** charts, graphs, History page, Analytics page, calendar, workout tracking.

## Completed: Analytics Engine

✓ Read-only Analytics feature (`features/analytics/`)
✓ Period filters: today / week / month / lifetime
✓ Hero, quest, timed quest, progress, history, achievement stats
✓ Memoized selectors + DevTools inspector
✓ Docs: [ANALYTICS.md](ANALYTICS.md)

**Not in Engine:** charts, graphs, History page, Analytics page, calendar, workout analytics.

## Completed: Analytics Dashboard

✓ Presentation Analytics Dashboard with period filters
✓ Reusable metric / progress UI components
✓ Chart series builders (no chart rendering)
✓ Metric registry (period-aware display rules outside React)
✓ Stabilization: achievement eval on XP grant; Unlock All pipeline; DevTools panels
✓ Docs: [ANALYTICS.md](ANALYTICS.md)

**Not in Dashboard:** timeline, heatmaps, calendar, workout analytics.

## Completed: Charts & Visualizations

✓ Recharts-based charts consuming `ChartSeries` only
✓ Hero / Quest / Attribute Growth visualizations
✓ Period-filtered `buildPeriodChartBundle` + `usePeriodChartBundle`
✓ DevTools period-scoped series inspector
✓ Docs: [ANALYTICS.md](ANALYTICS.md)

**Not in Charts:** workout/nutrition/combat charts.

## Completed: Hero History

✓ Hero Timeline (reverse-chronological, grouped by day, filters + search)
✓ Contribution Calendar (GitHub-style heatmap, completion intensity)
✓ Daily History Browser (snapshot + events + optional Daily Summary)
✓ Cross-navigation (charts, calendar, timeline, achievements)
✓ History DevTools (sample history, inspect snapshot, jump to date)
✓ Docs: [HISTORY.md](HISTORY.md)

## Completed: Insights Engine

✓ Behavior Analytics / Insights Engine (`features/insights/`)
✓ Quest, Routine, and Behavior Trend insight generators
✓ Reusable Insight Card + Insights Dashboard
✓ DevTools: sample insight data, refresh, raw JSON
✓ Docs: [INSIGHTS.md](INSIGHTS.md)

**v0.0.3 complete** (History → Analytics → Charts → Hero History → Insights).

---

# v0.0.4 — Fitness System (in progress)

## Foundation (shipped)

✓ Activity architecture (`Quest → Activity → …`) — [ACTIVITIES.md](ACTIVITIES.md)  
✓ Workout data model — exercises, templates, sessions, activities — [WORKOUT.md](WORKOUT.md)  
✓ Workout completion pipeline via existing `completeQuest('workout')`  
✓ `WORKOUT_COMPLETED` events + timeline integration  
✓ Analytics `WorkoutAnalytics` + insights  
✓ Workout panel UI + DevTools  
✓ Save version **0.0.5** (workout persistence)

## Logging & sessions (shipped)

✓ Draft → start → log → review → complete lifecycle  
✓ Set completion status, pause/resume, elapsed duration (Time Service)  
✓ Session progress + Today's Journey integration  
✓ Statistics utilities (`workoutStatistics.ts`)  
✓ Workout detail modal from timeline  
✓ Sample workout history DevTools  

## Performance & Personal Records (shipped)

✓ Hero Assessment architecture (Fitness → Baseline / Performance) — [PERFORMANCE.md](PERFORMANCE.md)  
✓ Baseline Assessment — initial benchmarks (push-ups, plank, squat, curl, walking)  
✓ Performance Assessments — separate from workouts; dedicated activity type  
✓ Official PRs — updated only from completed assessments  
✓ Exercise Families — stable exercise ids, family benchmark anchors  
✓ Append-only PR history + `PERSONAL_RECORD_ACHIEVED` timeline events  
✓ Analytics `PerformanceAnalytics` on `PeriodAnalytics.performance`  
✓ Progression Engine extension points (stub only)  
✓ Save version **0.0.6** (performance persistence)

## Remaining v0.0.4

- Nutrition activity migration
- Workout timeline drill-down UI
- Analytics dashboard workout section
- Progression Engine recommendations (future — extension points only)
- Nutrition tracking

---

# v0.0.5 — Polish and refinement

Quality-of-life, visual polish, balance pass, bug fixes — no major new domains.

---

# v0.1.x — Combat / World systems

**Explicitly future.** Do not implement in v0.0.x.

- Enemies
- Bosses
- Combat calculations
- Abilities
- Transformations
- Equipment / inventory
- Story / world

Achievements already shipped in v0.0.2 — do not list them again as a v0.1 deliverable.

Design references: `docs/COMBAT.md`, `docs/STORY.md`, `docs/ECONOMY.md` (equipment), `docs/FUTURE_IDEAS.md`.

---

# Later / v1.0 direction

- Mobile / PWA support
- Cloud saves
- Advanced RPG systems
- Long-term progression depth

See also `docs/FUTURE_IDEAS.md`, `docs/COMBAT.md`, `docs/STORY.md`.

---

# Explicitly Out of Scope Until Milestone Asks

Do not implement early:

- Combat / inventory / story / skills folders
- History & Analytics UI (v0.0.3 — **complete**)
- OS-level app blocking for unlocks
- AI-generated quests / story

---

# Cursor / AI Instructions

Before writing code:

1. Read all relevant documentation.
2. Follow `ARCHITECTURE.md` and `CODING_STANDARDS.md`.
3. Implement only the current milestone's scope.
4. Do not create future systems early.
5. Prefer simple extensible solutions.
6. Update docs when architecture or major features change.

The goal is a clean foundation that grows deliberately — not maximum features.
