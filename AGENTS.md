# Ascendant AI Development Instructions

You are contributing to Ascendant.

Before making changes:

1. Read [README.md](http://README.md)

2. Read docs/AI_[CONTEXT.md](http://CONTEXT.md)

3. Read docs/GAME_[BIBLE.md](http://BIBLE.md)

4. Follow docs/[ARCHITECTURE.md](http://ARCHITECTURE.md)

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

features/  
quests/  
questEngine.ts  
QuestCard.tsx

Bad:

QuestCard.tsx

contains:

- UI
- XP calculations
- Save logic
- Progression logic



---

# TypeScript Rules

Use TypeScript everywhere.

Prefer:

- Interfaces

- Explicit data models

- Strong typing

Avoid:

- any

- unclear objects

- magic numbers

---

# Game Design Rules

Before implementing a feature ask:

"Does this improve the player's real-world development experience?"

The game should motivate growth, not create meaningless grinding.

---

# AI Behavior

When unsure:

Ask questions.

Do not invent major systems.

Update documentation when adding major features.