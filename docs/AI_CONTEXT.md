# Ascendant AI Context

This document provides background for AI assistants working on Ascendant.

---

# Project Summary

Ascendant is a gamified personal development RPG.

The player completes real-life quests to strengthen a fictional hero.

The application combines:

- Habit tracking
- RPG progression
- Character development
- Challenge systems

(Storytelling and combat are designed but not yet implemented.)

---

# Inspiration

Inspirations include:

- RPG progression systems
- Training arcs
- Hero journeys
- Character transformation stories

Examples:

- Dragon Ball style growth
- Solo Leveling style progression

However:

Ascendant must maintain an original identity.

---

# Core Principle

The player's real-world improvement is the primary gameplay mechanic.

The game exists to encourage:

- Discipline
- Learning
- Fitness
- Responsibility
- Growth

---

# Current Version

**Application version:** v0.0.3 (History + Analytics complete)

## Implemented

- Hero Dashboard 2.0 (Hero Banner, Today's Journey, Active Objectives, Recent Progress)
- Quest system (Non-Negotiables + subcategories, Daily Bonus, Weekly, Weekly Bonus)
- Timed quests + developer time simulation
- Unlock system
- Streaks (required Non-Negotiables)
- Category / subcategory completion rewards
- Internal GameEvent tracking (recent buffer)
- Quest progress aggregation utilities
- Lifetime statistics
- Daily Summary
- Achievements
- **History Foundation** — append-only daily snapshots (`GameState.history`); see [HISTORY.md](HISTORY.md)
- **Analytics Engine + Dashboard + Charts** — read-only stats, metric registry, Recharts visualizations; see [ANALYTICS.md](ANALYTICS.md)

## Current Priority

v0.0.3 Analytics is complete. Next: **v0.0.4** Workout and Nutrition Tracking.

---

# Long-Term Vision

Future systems (not implemented):

- Workout and Nutrition Tracking (**v0.0.4**)
- Polish (**v0.0.5**)
- Combat, bosses, abilities, transformations, equipment, inventory, story/world, skills (**v0.1.x only**)
- AI-generated challenges
- Mobile support

See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [CHANGELOG.md](CHANGELOG.md).

---

# Important Constraint

Do not over-engineer early versions.

A fun simple game is better than a complex unfinished game.

Do not invent major systems (**combat, inventory, equipment, story, world, skills**) unless the **v0.1.x** milestone explicitly asks for them. History + Analytics already exist — extend via [HISTORY.md](HISTORY.md) / [ANALYTICS.md](ANALYTICS.md), do not replace them.
