# Ascendant AI Development Instructions

You are contributing to Ascendant.

**Current version:** v0.0.5 (complete)  
**Next milestone:** v0.0.6 — TBD  
**Save schema:** 0.0.10

Before making changes:

1. Read [README.md](README.md)
2. Read [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md)
3. Read [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md) — match your conversation type (Product Planning, Implementation, Debugging, Documentation, Research)
4. Read [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md)
5. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
6. Read [docs/DEVELOPER_GUIDE.md](docs/DEVELOPER_GUIDE.md)
7. Read [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md)
8. Read [docs/GAME_BIBLE.md](docs/GAME_BIBLE.md)

Product Planning conversations (ChatGPT): also read [docs/PRODUCT_PRINCIPLES.md](docs/PRODUCT_PRINCIPLES.md) and [docs/MILESTONES.md](docs/MILESTONES.md).

Implementation conversations (Cursor): satisfy [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md) before archiving.

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

**Implemented through v0.0.5:** Hero Dashboard, Hero Identity, quests, timed quests, unlocks, streaks, events, Daily Summary, achievements, History, Analytics, Insights, Quest Explorer, workouts, performance assessments, coaching, workout analytics, nutrition (with quest integration), fitness settings.

Do **not** implement unless the milestone asks for it: Combat, Inventory, Equipment, Story, World, Skills (**v0.1.x only**).

---

# AI Behavior

When unsure: ask questions. Do not invent major systems.

Follow [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md): one feature per implementation conversation; generate an implementation report; update documentation per [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md).
