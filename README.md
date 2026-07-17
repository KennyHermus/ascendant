# Ascendant

> Walk the Path of Resolve.

Ascendant is a real-life progression RPG designed to transform personal growth into an adventure.

The player is the hero.

Daily actions become quests.

Discipline becomes experience.

Consistency becomes power.

The goal is not simply to track productivity.

The goal is to create a game system that encourages becoming:

- Stronger
- Smarter
- More disciplined
- More resilient
- More skilled
- More well-rounded

---

# Vision

Most productivity apps treat habits as checkboxes.

Ascendant treats them as character development.

A completed workout is not just a workout.

It is:

- Strength growth
- Stamina growth
- Character growth
- Progress toward future abilities

Reading is not just reading.

It is:

- Intellect growth
- Knowledge growth
- Preparation for future challenges

Every action contributes to the hero's journey.

---

# Core Gameplay Loop

Complete quests
→ Gain XP / gold
→ Improve stats
→ Maintain streaks
→ Unlock features
→ Grow hero

(Future: face greater challenges — combat, bosses, story. Those systems are **v0.1.x only**.)

---

# Current Version

## v0.0.3

Current application version: **0.0.3**

A playable daily RPG foundation with:

**Core**

- React + TypeScript + Vite
- Zustand state management
- localStorage persistence (versioned saves)
- Feature-based architecture
- Data-driven quest definitions

**Hero**

- Level, XP, gold
- Eight stats (Strength, HP, Defense, Stamina, Speed, Intellect, Willpower, Special Technique)
- Hero title (level-based)
- Lifetime statistics
- Status + Next Objective on the Hero Banner

**Quests**

- Non-Negotiables (Morning Routine, Nutrition, Evening Routine)
- Daily Bonus, Weekly, Weekly Bonus, Special (empty / future)
- Optional quests, timed quests (target + grace), weekday schedules
- Category / subcategory completion rewards
- Streak based on required Non-Negotiables

**Systems**

- Unlock system (Messages, YouTube, Gaming, Social Media, Netflix)
- Internal GameEvent log (Recent Progress foundation)
- Daily Summary (end-of-day recap)
- Achievements (data-driven, rarity, Achievement Points)
- **History Foundation** — append-only daily snapshots ([docs/HISTORY.md](docs/HISTORY.md))
- **Analytics Engine + Dashboard** — read-only stats + presentation UI ([docs/ANALYTICS.md](docs/ANALYTICS.md))
- Quest progress aggregation utilities
- Developer time simulation + quest/achievement/history/analytics testing tools

**Dashboard order**

1. Daily Summary banner (when available)
2. Hero Banner
3. Today's Journey
4. Unlocks
5. Active Objectives
6. Quests
7. Recent Progress
8. Achievements
9. Analytics
10. Attributes

**Next within v0.0.3:** Charts & Visualizations (consume series builders — not shipped yet)

---

# Technology

Frontend:

- React
- TypeScript
- Vite
- Zustand
- Tailwind CSS

Future possibilities:

- PWA mobile support
- Cloud saves
- Native mobile application
- AI-generated quests
- Procedural story content

---

# Development Philosophy

Ascendant should prioritize:

1. Long-term sustainability over short-term optimization.
2. Enjoyment over perfection.
3. Consistency over intensity.
4. Real improvement over artificial points.

---

# Documentation

## Game Design

- [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md)
- [docs/QUESTS.md](docs/QUESTS.md)
- [docs/PROGRESSION.md](docs/PROGRESSION.md)
- [docs/ECONOMY.md](docs/ECONOMY.md)
- [docs/COMBAT.md](docs/COMBAT.md)
- [docs/STORY.md](docs/STORY.md)

## Technical Design

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/HISTORY.md](docs/HISTORY.md)
- [docs/ANALYTICS.md](docs/ANALYTICS.md)
- [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md)
- [docs/UI_UX.md](docs/UI_UX.md)
- [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [docs/CHANGELOG.md](docs/CHANGELOG.md)

## AI Context

- [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md)
- [AGENTS.md](AGENTS.md)
- [CLAUDE.md](CLAUDE.md)
