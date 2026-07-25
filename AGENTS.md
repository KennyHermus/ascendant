# Ascendant AI Development Instructions

You are contributing to Ascendant.

**Current version:** v0.0.4 (complete)  
**Next milestone:** v0.0.5 — Polish and refinement  
**Save schema:** 0.0.9

Before making changes:

1. Read [README.md](README.md)
2. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. Read [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
4. Read [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md)
5. Read [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md)

The documentation is the source of truth.

---

# Development Principles

## Maintainability

Prefer:

- Simple systems
- Clear naming
- Modular features
- Reusable components

Avoid:

- Quick hacks
- Duplicate logic
- Large files
- Unnecessary dependencies

---

# Architecture Rules

Game logic must be separated from UI.

Example:

Good:

```
features/
  quests/
    questLogic.ts
    QuestCard.tsx
```

Bad:

`QuestCard.tsx` contains UI, XP calculations, save logic, and progression logic.

Use existing pipelines: `completeQuest()`, activity-driven resolution, `eventLogic.ts`, `history`, `questHistory`.

---

# TypeScript Rules

Use TypeScript everywhere.

Prefer interfaces, explicit data models, strong typing. Avoid `any`.

---

# Game Design Rules

Before implementing a feature ask:

"Does this improve the player's real-world development experience?"

The game should motivate growth, not create meaningless grinding.

---

# Current Scope Reminder

**Implemented through v0.0.4:** Hero Dashboard, quests, timed quests, unlocks, streaks, events, Daily Summary, achievements, History, Analytics, Insights, Quest Explorer, workouts, performance assessments, coaching, workout analytics, nutrition (with quest integration), fitness settings.

Do **not** implement unless the milestone asks for it: Combat, Inventory, Equipment, Story, World, Skills (**v0.1.x only**).

---

# AI Behavior

When unsure: ask questions. Do not invent major systems. Update documentation when adding major features.
