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

# Next: v0.0.3 — History and Analytics

Includes:

- Historical quest data
- Progress graphs
- Stat trends
- Completion trends

Should **consume** existing foundations — `GameState.events`, `lifetimeStats`, quest progress utilities, and summary snapshots — not invent parallel tracking or reconstruct history by scanning current quest state.

**Event retention:** v0.0.2 keeps a recent-event buffer (~50). v0.0.3 should introduce long-term historical storage; do not change that until this milestone.

---

# v0.0.4 — Workout and Nutrition Tracking

Includes:

- Workout history
- PR tracking
- Stat adjustments based on performance
- Workout recommendations
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
- History & Analytics UI (wait for v0.0.3)
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
