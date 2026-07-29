# Ascendant

> Walk the Path of Resolve.

Ascendant is a real-life progression RPG. Daily actions become quests, discipline becomes experience, and consistency becomes power.

The player improves their real life and their character simultaneously — not through checkbox productivity, but through a hero's journey.

---

# Philosophy

Most habit apps treat actions as chores. Ascendant treats them as **character development**:

- A completed workout is Strength, Stamina, and XP — not just a checkmark.
- Reading builds Intellect and prepares future challenges.
- Nutrition, sleep, and routine quests maintain the hero's foundation.

The game should motivate growth without encouraging unhealthy grinding. See [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md).

---

# Current Version

**Application:** v0.0.5 (complete)  
**Save schema:** 0.0.10  
**Next milestone:** v0.0.6 — TBD

**Canonical project snapshot:** [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)

---

# Major Features

## Core (v0.0.2+)

- **Hero** — level, XP, gold, eight stats, rank ladder, lifetime statistics, dynamic status
- **Hero Identity** — profile, biography, accomplishment titles, lifetime milestones, timeline integration
- **Quests** — Non-Negotiables (Morning / Nutrition / Evening), Daily Bonus, Weekly, timed quests, optional quests, streaks
- **Unlocks** — earn daily access to Messages, YouTube, Gaming, Social Media, Netflix
- **Daily Summary** — end-of-day recap when the day is complete
- **Achievements** — data-driven milestones with rarity and Achievement Points
- **Events** — recent progress feed and timeline foundation

## History & Analytics (v0.0.3)

- **Hero History** — timeline, contribution calendar, daily browser
- **Analytics Engine** — rolling-window statistics (Today → Last 365 Days)
- **Charts** — Recharts visualizations for hero, quest, and stat growth
- **Insights Engine** — behavioral pattern cards (not coaching)
- **Quest Explorer** — per-quest stats, punctuality, charts
- **Hero Day** — 5:00 AM day boundary via Time Service

## Fitness System (v0.0.4)

- **Workout Engine** — templates, sessions, set logging, timers, duration activities (cardio, walks)
- **Workout Analytics** — exercise/template stats, training distribution, PR timeline
- **Performance Assessments** — baseline + benchmark tests; Official Personal Records
- **Exercise Families, Roles, Prerequisites** — structured progression paths
- **Progression Engine** — coaching recommendations (informational only)
- **Nutrition System** — meal logging, daily targets, analytics, insights
- **Nutrition ↔ Quest integration** — meals auto-complete breakfast/lunch/dinner; protein target completes vitamins quest
- **Fitness Settings** — configurable targets and unit preferences
- **Hero Dashboard coaching** — top recommendations in Today's Journey

**Not implemented:** Combat, inventory, equipment, story, world, skills (**v0.1.x only**).

---

# Technology Stack

| | |
|---|---|
| **UI** | React 19, TypeScript |
| **Build** | Vite 8 |
| **Styling** | Tailwind CSS 4 |
| **State** | Zustand (persisted) |
| **Charts** | Recharts |
| **Storage** | Browser localStorage (versioned migrations) |

---

# Running the Project

## Prerequisites

- Node.js 20+ (LTS recommended)
- npm

## Development

```bash
npm install
npm run dev
```

Starts the Vite dev server (default: `http://localhost:5173`). Hot module replacement enabled. Game state persists to `localStorage` under the key `ascendant-game`.

## Production build

```bash
npm run build
```

Runs TypeScript project references (`tsc -b`) then Vite production bundle to `dist/`.

## Preview production build

```bash
npm run preview
```

Serves the `dist/` output locally for smoke-testing the production bundle.

## Lint

```bash
npm run lint
```

Runs [oxlint](https://oxc.rs/docs/guide/usage/linter) on the codebase.

## DevTools

When running in development mode, the Dashboard includes a **DevTools** panel at the bottom:

- Time simulation (advance clock, test timed quests and daily reset)
- Quest bulk-complete / reset helpers
- History, analytics, insights, workout, nutrition, and achievement testing tools

DevTools never ship to production builds (`import.meta.env.DEV` guards).

---

# Architecture Overview

Feature-based architecture: logic in `src/features/*/`, data in `src/data/`, types in `src/types/`, single store in `src/store/gameStore.ts`.

```
Player action → Feature logic → gameStore → Events / History / Activities
                                      ↓
                              Analytics (read-only) → Insights → UI
```

**Entry point:** [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)  
**Persistence:** [docs/PERSISTENCE.md](docs/PERSISTENCE.md)  
**Developer guide:** [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)

---

# Folder Structure

```
src/
├── app/           # Dashboard and app shell
├── components/    # Shared UI primitives
├── data/          # Quest, exercise, template definitions
├── features/      # Domain modules (hero, quests, workout, nutrition, …)
├── lib/           # Time, storage, migrations
├── store/         # Zustand gameStore
├── types/         # TypeScript models
└── dev/           # Dev-only testing tools
docs/              # Design and technical documentation
```

---

# Dashboard Layout (v0.0.5)

1. Daily Summary banner (when available)
2. Hero Banner
3. Hero Profile (identity, biography, titles, accomplishments)
4. Today's Journey (quests + workouts + coaching)
5. Unlocks
6. Active Objectives
7. Quests
8. Workout
9. Performance Assessments
10. Workout Analytics
11. Nutrition
12. Fitness Settings
13. Recent Progress
14. Achievements
15. Analytics
16. Quest Explorer
17. Insights
18. Hero History
19. Attributes

---

# Version History

## v0.0.1 — Foundation

First playable loop: hero profile, quest completion with XP/gold rewards, localStorage persistence, single dashboard. Superseded structurally by v0.0.2.

## v0.0.2 — Hero Dashboard & Core Systems

- Hero Dashboard 2.0 (Banner, Today's Journey, Active Objectives, Recent Progress)
- Non-Negotiables restructure (Morning / Nutrition / Evening subcategories)
- Timed quests with grace periods and completion grades
- Unlock system, streaks, category completion rewards
- GameEvent foundation, Daily Summary, Achievements
- Lifetime statistics, developer time simulation
- Save schema through additive fields (no migration chain yet for some features)

## v0.0.3 — History & Analytics

- Append-only `HeroHistory` daily snapshots
- Analytics Engine + Dashboard + Recharts
- Insights Engine (behavioral patterns)
- Hero History UI (timeline, calendar, daily browser)
- Quest History + Quest Explorer + punctuality analytics
- Hero Day (5:00 AM) via Time Service
- Save migrations **0.0.2 → 0.0.3 → 0.0.4**

## v0.0.4 — Fitness System (complete)

- **Activities** — workout, nutrition, performance assessment records separate from quest checkboxes
- **Workout** — full session lifecycle, timers, duration activities, quest-driven completion
- **Performance** — baseline/performance assessments, Official PRs, exercise families
- **Coaching** — Progression Engine with recommendation history
- **Workout Analytics** — first Analytics Domain (exercise, template, distribution, PR charts)
- **Nutrition** — meal logging, analytics, insights, quest integration
- **Integration pass** — unified rolling analytics windows, Fitness Settings, dashboard coaching
- Save migrations **0.0.5 → 0.0.9**

## v0.0.5 — Hero Identity (complete)

- **Hero Profile** — accordion panel with journey stats and consistency rates
- **Hero Biography**, **Titles**, **Lifetime Accomplishments** — distinct from Achievements
- Timeline integration; migration backfill; save **0.0.10**
- Docs: [docs/HERO_IDENTITY.md](docs/HERO_IDENTITY.md)

Full release notes: [docs/CHANGELOG.md](docs/CHANGELOG.md)

---

# Roadmap

| Version | Scope | Status |
|---------|-------|--------|
| v0.0.5 | Hero Identity | **Complete** |
| v0.0.6+ | TBD | Planned |
| v0.1.x | Combat, inventory, equipment, story, skills | Future |

Details: [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)

---

# Development Workflow

Official process: **[docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)** — planning, implementation, verification, version completion, and AI conversation types.

Before coding: read [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md), [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md), and [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md).

AI contributors: [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md), [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md).

---

# Documentation

## Game Design

- [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md) — vision and mechanics
- [docs/QUESTS.md](docs/QUESTS.md) — quest categories and rules
- [docs/PROGRESSION.md](docs/PROGRESSION.md) — XP, levels, streaks, achievements
- [docs/ECONOMY.md](docs/ECONOMY.md) — gold and rewards

## Technical

- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — **canonical baseline snapshot (start here)**
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — subsystem index
- [docs/PERSISTENCE.md](docs/PERSISTENCE.md) — save schema and migrations
- [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md) — conventions for contributors
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — roadmap
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — release notes

## Process & product

- [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) — **official development process**
- [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md) — completion checklist
- [docs/MILESTONES.md](docs/MILESTONES.md) — major product phases
- [docs/PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md) — enduring product philosophy

## v0.0.5 Systems

- [docs/HERO_IDENTITY.md](docs/HERO_IDENTITY.md) — Hero Identity

## v0.0.4 Systems

- [docs/ACTIVITIES.md](docs/ACTIVITIES.md) — Hero Activity architecture
- [docs/WORKOUT.md](docs/WORKOUT.md) — workout engine
- [docs/PERFORMANCE.md](docs/PERFORMANCE.md) — assessments and PRs
- [docs/COACHING.md](docs/COACHING.md) — Progression Engine
- [docs/WORKOUT_ANALYTICS.md](docs/WORKOUT_ANALYTICS.md) — workout analytics domain
- [docs/NUTRITION.md](docs/NUTRITION.md) — nutrition system
- [docs/FITNESS_SETTINGS.md](docs/FITNESS_SETTINGS.md) — settings
- [docs/HISTORY.md](docs/HISTORY.md) — long-term history
- [docs/ANALYTICS.md](docs/ANALYTICS.md) — analytics engine
- [docs/INSIGHTS.md](docs/INSIGHTS.md) — insights engine

## Future (design only)

- [docs/COMBAT.md](docs/COMBAT.md), [docs/STORY.md](docs/STORY.md), [docs/FUTURE_IDEAS.md](docs/FUTURE_IDEAS.md)
