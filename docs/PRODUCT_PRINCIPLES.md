# Ascendant Product Principles

**Enduring product philosophy** — describes *why* Ascendant is designed the way it is, not *how* it is built.

For current implementation, see [PROJECT_STATE.md](PROJECT_STATE.md). For development process, see [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

---

# Purpose

Ascendant exists to help people improve their real lives by experiencing that improvement as a **Hero's journey** — not as spreadsheet compliance.

These principles guide product decisions across all versions. They outlive any single milestone or feature.

---

# Core Principles

## 1. Hero-first design

Every feature should answer: **"How does this make the Hero feel more alive?"**

Statistics, accomplishments, biography, timeline moments, and coaching should tell the Hero's story — not merely display numbers. The player should feel they are guiding a character through a persistent world, not operating a habit tracker with RPG skin.

*Current expression:* Hero Identity (v0.0.5), timeline events, biography, titles, Today's Journey, Daily Summary.

---

## 2. Real-life actions drive RPG progression

The primary gameplay mechanic is **genuine self-improvement**. Quests, workouts, meals, and assessments map to real behavior. Rewards celebrate real effort; they must not substitute for it or encourage meaningless grinding.

The game motivates — it does not replace — real outcomes.

*Current expression:* Quest engine, workout/nutrition activities, streaks, Non-Negotiables structure.

---

## 3. The Hero should feel like a living character whose story is earned

Identity is built over time: accomplishments, titles, history, and narrative text emerge from what the player actually did. Major moments become memorable timeline entries. Legacy is distinct from collectible achievements.

*Current expression:* Lifetime Accomplishments, Hero Biography, Hero Timeline integration.

---

## 4. AI should guide, not dictate

Coaching and (future) AI systems exist to **inform and encourage** — never to auto-modify the player's plan, punish autonomy, or replace the player's judgment.

Recommendations are informational. The player chooses what to do.

*Current expression:* Progression Engine coaching (informational only). *Future:* AI planning as suggestions, not commands.

---

## 5. Preserve user agency

The player controls their Hero, their quests, and their pace. Systems should unlock opportunities rather than remove previous ones. Avoid mechanics that create anxiety, shame loops, or compulsive check-ins.

Ascendant should feel like a challenge and a journey — not a punishment system.

*Current expression:* Optional quests, unlocks as earned permissions (not permanent locks), no combat pressure.

---

## 6. Integrate with existing systems — do not create parallel ones

New features should consume and reinforce established foundations: `completeQuest()`, events, history, quest history, analytics, Hero Identity, coaching, and Today's Journey.

Isolated features that do not connect to the Hero's long-term journey are out of scope unless explicitly prototyping future systems.

*Current expression:* Activity → quest resolution pipelines; analytics derived from history; identity sync hooks.

---

## 7. Favor extensibility over one-off implementations

Prefer data-driven definitions, typed models, migration-safe persistence, and clear extension points over hardcoded UI logic. Build for the next milestone without implementing it prematurely.

*Current expression:* Quest/achievement/accomplishment catalogs; Analytics Domain pattern; `HeroIdentityState` extension points for classes, guilds, story flags.

---

## 8. Analytics should power insights and coaching

Data exists to help the player understand patterns and receive useful guidance — not to create a second product inside the product. Analytics are read-only; insights interpret; coaching recommends.

*Current expression:* Analytics Engine, Insights Engine, Progression Engine, Hero Profile consistency rates.

---

## 9. Build toward an AI-powered Personal Operating System

**Long-term vision** — not current implementation.

Ascendant aims to become a persistent RPG layer over the player's life: intelligent planning, contextual coaching, external integrations, and eventually world and narrative systems — unified around one Hero whose story spans years.

The foundation phase (v0.0.x) establishes history, analytics, fitness, identity, and coaching. Later phases add core RPG and living world systems without rewriting the foundation.

---

# What This Document Is Not

| | Product Principles | Other docs |
|---|-------------------|------------|
| **Purpose** | Why we build this way | How we build |
| **Stability** | Changes rarely | Updates each milestone |
| **Scope** | Philosophy & vision | Implementation detail |

Do not use this document for save schema, API shapes, or file layout — use [ARCHITECTURE.md](ARCHITECTURE.md) and [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).

---

# Relationship to Game Design

[GAME_BIBLE.md](GAME_BIBLE.md) describes game mechanics and fantasy. This document describes **product values** that constrain and guide those mechanics.

When mechanics and principles conflict, **principles win** unless the team explicitly revises them.

---

# Using These Principles

| Conversation type | Use Product Principles when… |
|-------------------|------------------------------|
| **Planning / Architecture** | Scoping features, evaluating tradeoffs, writing prompts |
| **Implementation** | Choosing between integration vs. isolation |
| **Documentation** | Explaining why a decision was made |
| **Brainstorming** | Filtering ideas that fit Ascendant's identity |

Planning conversations should treat this document as a primary source of truth alongside [PROJECT_STATE.md](PROJECT_STATE.md).

---

*Principles established at v0.0.5 foundation maturity. Revise only through deliberate product discussion — not per-feature convenience.*
