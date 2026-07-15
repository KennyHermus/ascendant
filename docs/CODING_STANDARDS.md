# Ascendant Coding Standards

Version: 0.1

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

HeroCard.tsx

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

HeroCard.tsx

HeroCard.test.ts

HeroCard.types.ts

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

- GAME_BIBLE

- ARCHITECTURE

- ROADMAP

---

# Testing

Important systems should eventually have tests:

Priority:

1. Progression

2. Rewards

3. Combat

4. Saving