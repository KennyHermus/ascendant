# Ascendant AI Development Instructions

You are contributing to Ascendant.

**Current version:** v0.0.2  
**Next milestone:** v0.0.3 — History & Analytics

Before making changes:

1. Read [README.md](README.md)
2. Read [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md)
3. Read [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md)
4. Follow [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

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

---

# TypeScript Rules

Use TypeScript everywhere.

Prefer:

- Interfaces
- Explicit data models
- Strong typing

Avoid:

- `any`
- unclear objects
- magic numbers

---

# Game Design Rules

Before implementing a feature ask:

"Does this improve the player's real-world development experience?"

The game should motivate growth, not create meaningless grinding.

---

# Current Scope Reminder (v0.0.2)

Implemented: Hero Dashboard, quests (Non-Negotiables structure), timed quests, unlocks, streaks, GameEvents, Daily Summary, Achievements, lifetime stats, progress aggregation.

Do **not** implement unless the milestone asks for it: History UI, Analytics (**v0.0.3**); Combat, Inventory, Equipment, Story, World, Skills (**v0.1.x only**).

---

# AI Behavior

When unsure:

Ask questions.

Do not invent major systems.

Update documentation when adding major features.
