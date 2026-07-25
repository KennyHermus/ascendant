# Ascendant Coding Standards

Version: aligned with application v0.0.4

See also: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for architecture conventions.

---

# General Principles

Write code that another developer or AI can understand.

Optimize for:

- Clarity

- Maintainability

- Extensibility

---

# TypeScript

Use strict typing.

Prefer:

interface Hero {}

over:

const hero = {}

for important objects.

---

Avoid:

any

unless absolutely necessary.

---

# Naming

Components:

PascalCase

Example:

HeroBanner.tsx

(Older docs may say `HeroCard.tsx` — that component was replaced by `HeroBanner.tsx` in v0.0.2.)

---

Functions:

camelCase

Example:

calculateReward()

---

Types:

PascalCase

Example:

QuestReward

---

# File Organization

Prefer:

HeroBanner.tsx

HeroBanner.test.ts

over large mixed files.

---

# Components

Components should:

- Be focused

- Have one purpose

- Avoid business logic

---

# Functions

Prefer:

Small functions.

Example:

Good:

calculateXpReward()

applyReward()

levelUpHero()

Bad:

processEverything()

---

# Constants

Avoid magic numbers.

Bad:

xp += 5

Good:

DAILY_QUEST_XP = 5

---

# Documentation

When adding major features:

Update:

- [ARCHITECTURE.md](ARCHITECTURE.md) (subsystem index entry)
- [GAME_BIBLE.md](GAME_BIBLE.md) if game design changes
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) (roadmap)
- [CHANGELOG.md](CHANGELOG.md)
- [PERSISTENCE.md](PERSISTENCE.md) if save schema changes
- Relevant feature docs (QUESTS, WORKOUT, NUTRITION, …)
- [README.md](../README.md) if user-facing scope changes

---

# Testing

Important systems should eventually have tests:

Priority:

1. Progression

2. Rewards

3. Combat

4. Saving