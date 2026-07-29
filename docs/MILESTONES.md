# Ascendant Milestones

High-level phases of Ascendant development. This document describes **direction**, not implementation detail.

For current status and shipped features, see [PROJECT_STATE.md](PROJECT_STATE.md). For version-by-version release notes, see [CHANGELOG.md](CHANGELOG.md). For the active roadmap, see [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

---

# Phase Overview

```
Foundation (v0.0.1 – v0.0.4)
        ↓
      Hero (v0.0.5)
        ↓
   Core RPG (v0.1.x)          ← not started
        ↓
  Living World (future)
        ↓
  AI Companion (future)
        ↓
Personal Operating System (long-term vision)
```

---

# Foundation

**Versions:** v0.0.1 – v0.0.4  
**Status:** Complete

## Intent

Establish a reliable **life-management RPG foundation**: quests, progression, persistence, history, analytics, and fitness systems — integrated through a single Dashboard and one persisted game store.

## What this phase delivered

- Playable quest loop with XP, gold, stats, streaks, unlocks, achievements
- Long-term history and analytics infrastructure
- Workout, nutrition, performance, and coaching systems
- Event-driven architecture and versioned save migrations

## Outcome

Ascendant became a capable daily command center for real-life discipline with strong retrospective visibility — before combat, story, or world systems exist.

---

# Hero

**Version:** v0.0.5  
**Status:** Complete

## Intent

Begin the transition from **habit tracker with RPG mechanics** to **persistent RPG character**. The Hero should feel like someone whose story is shaped by real actions.

## What this phase delivered

- Hero Identity: profile, biography, accomplishment titles, lifetime milestones
- Timeline integration for identity moments
- Hero-first design philosophy codified in product and development docs

## Outcome

Identity layers (presentation and legacy) exist alongside mechanics without duplicating achievements or altering core rewards. Architecture is ready for classes, story, and world hooks.

---

# Core RPG

**Versions:** v0.1.x (planned)  
**Status:** Not started

## Intent

Introduce traditional RPG systems that **use** the foundation — not replace it.

## Expected themes (design only)

- Combat and enemies
- Equipment and inventory
- Skills and abilities
- Story chapters and narrative progression

## Constraints

Must integrate with Hero Identity, timeline, history, and existing progression. Design references: [COMBAT.md](COMBAT.md), [STORY.md](STORY.md), [ECONOMY.md](ECONOMY.md).

**Do not implement in v0.0.x** unless explicitly promoted in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).

---

# Living World

**Status:** Future — post Core RPG

## Intent

A persistent world the Hero inhabits: regions, NPCs, factions, guilds, companions, and world state that reacts to long-term player behavior.

## Relationship to prior phases

Builds on Hero Identity (who the Hero is) and Core RPG (what the Hero can do). World systems should consume history and accomplishments as narrative context.

---

# AI Companion

**Status:** Future

## Intent

An intelligent layer that understands the Hero's history, patterns, and goals — offering planning, reflection, and contextual guidance while preserving user agency ([PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md)).

Distinct from today's rule-based Progression Engine coaching, which analyzes training trends and prerequisites.

---

# Personal Operating System

**Status:** Long-term vision

## Intent

Ascendant as a unified interface for self-improvement: real-life actions, RPG progression, intelligent coaching, external integrations (health, calendar, messaging), and narrative meaning — centered on one Hero over years.

This is the north star. Individual milestones are stepping stones, not the final product.

See [FUTURE_IDEAS.md](FUTURE_IDEAS.md) for aspirational ideas not yet scheduled.

---

# How Milestones Relate to Versions

| | Milestones | Versions |
|---|------------|----------|
| **Granularity** | Major product phases | Shippable increments |
| **Document** | This file | CHANGELOG, IMPLEMENTATION_PLAN |
| **Updates** | When phase boundaries shift | Every release |

A single milestone may span multiple versions (Foundation = v0.0.1–v0.0.4). A version may complete part of a milestone (v0.0.5 = Hero phase).

When a **milestone** completes, update [PROJECT_STATE.md](PROJECT_STATE.md) and this file. When a **version** completes, update [CHANGELOG.md](CHANGELOG.md) and follow [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

---

*Last aligned with v0.0.5 (Hero Identity complete).*
