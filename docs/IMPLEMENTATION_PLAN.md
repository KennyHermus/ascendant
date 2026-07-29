# Ascendant Implementation Plan & Roadmap

Version: aligned with application **v0.0.5** (save schema **0.0.10**)

---

# Purpose

This document tracks milestones: what shipped, what is next, and what remains future.

Version alignment:

- **Application version:** `package.json` → **0.0.5**
- **Save schema version:** `CURRENT_SAVE_VERSION` → **0.0.10**

See [PERSISTENCE.md](PERSISTENCE.md) for the migration table.

**Process:** [AI_WORKFLOW.md](AI_WORKFLOW.md) · [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) · **Phases:** [MILESTONES.md](MILESTONES.md) · **Baseline:** [PROJECT_STATE.md](PROJECT_STATE.md)

---

# Development Philosophy

Build the smallest version that creates the core gameplay loop.

Prioritize:

1. Functionality
2. Clean architecture
3. Extensibility
4. Enjoyable user experience

Avoid implementing complex systems before the foundation exists.

Enduring product values: [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md).

---

# Completed: v0.0.1 Foundation

First playable loop:

- Hero profile (level, XP, gold, stats)
- Quest completion with rewards
- Persistence via localStorage
- Single dashboard

Historical detail superseded by v0.0.2.

---

# Completed: v0.0.2

✓ Hero Dashboard 2.0 (Hero Banner, Today's Journey, Active Objectives, Recent Progress)  
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
✓ Accordion organization

---

# Completed: v0.0.3 — History and Analytics

## History Foundation

✓ Persistent `HeroHistory` with append-only `DailySnapshot` records  
✓ Written on quest-day advance  
✓ Save migration `0.0.2 → 0.0.3`  
✓ History DevTools  
✓ Docs: [HISTORY.md](HISTORY.md)

## Analytics Engine

✓ Read-only Analytics feature (`features/analytics/`)  
✓ Rolling period filters: Today, Last 7/30/90/180/365 Days *(updated in v0.0.4 integration pass)*  
✓ Hero, quest, timed quest, progress, history, achievement stats  
✓ Memoized selectors + DevTools inspector  
✓ Docs: [ANALYTICS.md](ANALYTICS.md)

## Analytics Dashboard & Charts

✓ Presentation Dashboard with period filters  
✓ Metric registry (period-aware display rules)  
✓ Recharts visualizations via `ChartSeries`  
✓ Docs: [ANALYTICS.md](ANALYTICS.md)

## Hero History

✓ Hero Timeline, Contribution Calendar, Daily History Browser  
✓ Cross-navigation (charts, calendar, timeline, achievements)  
✓ Docs: [HISTORY.md](HISTORY.md)

## Insights Engine

✓ Behavior Analytics / Insights Engine  
✓ Quest, Routine, and Behavior Trend insight generators  
✓ Docs: [INSIGHTS.md](INSIGHTS.md)

## Time, History & Quest Analytics

✓ Hero Day — 5:00 AM boundary ([TIME.md](TIME.md))  
✓ Completion timestamps and timed quest grading  
✓ Quest History (`GameState.questHistory`, save `0.0.4`)  
✓ Quest Explorer ([QUEST_EXPLORER.md](QUEST_EXPLORER.md))  
✓ Punctuality analytics and insights  

**v0.0.3 complete.**

---

# Completed: v0.0.4 — Fitness System

## Foundation

✓ Activity architecture — [ACTIVITIES.md](ACTIVITIES.md)  
✓ Workout data model — [WORKOUT.md](WORKOUT.md)  
✓ Workout completion via `completeQuest()`  
✓ Save **0.0.5**

## Logging & Sessions

✓ Draft → start → log → review → complete lifecycle  
✓ Timers, duration activities, set logging  
✓ Today's Journey workout progress  
✓ Workout detail modal from timeline  

## Performance & Personal Records

✓ Baseline and Performance Assessments — [PERFORMANCE.md](PERFORMANCE.md)  
✓ Official PRs from assessments only  
✓ Exercise Families  
✓ Save **0.0.6**

## Exercise Progression Engine

✓ Coaching recommendations — [COACHING.md](COACHING.md)  
✓ Exercise Roles and Prerequisites  
✓ Recommendation history + timeline events  
✓ Save **0.0.7**

## Workout Analytics

✓ Analytics Domain architecture — [WORKOUT_ANALYTICS.md](WORKOUT_ANALYTICS.md)  
✓ Exercise, template, PR, training distribution analytics  
✓ Coaching integration in workout analytics panel  

## Nutrition System

✓ Meal logging as Hero Activity — [NUTRITION.md](NUTRITION.md)  
✓ Analytics, insights, DevTools  
✓ Save **0.0.8**

## Integration & Polish

✓ Nutrition ↔ Quest integration (meal → quest completion; protein → vitamins-protein)  
✓ Unified rolling analytics time windows  
✓ Hero Dashboard coaching in Today's Journey  
✓ Fitness Settings — [FITNESS_SETTINGS.md](FITNESS_SETTINGS.md)  
✓ Save **0.0.9**

**v0.0.4 complete.**

---

# Completed: v0.0.5 — Hero Identity

✓ Hero Profile accordion — portrait placeholder, journey stats, consistency rates  
✓ Hero Biography — derived narrative from lifetime metrics  
✓ Hero Titles — accomplishment-gated; auto-selected active title  
✓ Lifetime Accomplishments — distinct from Achievements; timeline integration  
✓ Migration backfill without timeline event flood  
✓ Analytics Hero Identity metrics  
✓ Save **0.0.10**  
✓ Docs: [HERO_IDENTITY.md](HERO_IDENTITY.md), [PROJECT_STATE.md](PROJECT_STATE.md)

**v0.0.5 complete.**

---

# v0.0.6+ — Next milestone (TBD)

Not yet defined. Candidate themes:

- Quality-of-life and visual polish
- Manual Hero title selection UI
- Water logging (when designed)
- Workout display unit preference wiring
- Performance and accessibility pass

Promote items into this section when the next milestone is scoped.

---

# v0.0.5 — Polish and refinement (superseded)

This milestone shipped as **Hero Identity** (v0.0.5). See completed section above.

# v0.1.x — Combat / World systems

**Explicitly future.** Do not implement in v0.0.x.

- Enemies, bosses, combat calculations
- Abilities, transformations
- Equipment / inventory
- Story / world, skills

Design references: [COMBAT.md](COMBAT.md), [STORY.md](STORY.md), [ECONOMY.md](ECONOMY.md), [FUTURE_IDEAS.md](FUTURE_IDEAS.md).

---

# Later / v1.0 direction

- Mobile / PWA support
- Cloud saves
- Advanced RPG systems

---

# Explicitly Out of Scope Until Milestone Asks

- Combat / inventory / story / skills (v0.1.x)
- OS-level app blocking for unlocks
- AI-generated quests / story

---

# Cursor / AI Instructions

Before writing code:

1. Read [ARCHITECTURE.md](ARCHITECTURE.md), [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md), and relevant feature docs.
2. Implement only the current milestone's scope.
3. Update docs when architecture or major features change.
