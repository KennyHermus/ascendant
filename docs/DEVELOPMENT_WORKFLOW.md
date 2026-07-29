# Ascendant Development Workflow

**Official development process** for Ascendant from v0.0.5 onward.

This document describes *how work flows* from idea to completion. Code conventions live in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md). Product values live in [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md). Current implementation baseline: [PROJECT_STATE.md](PROJECT_STATE.md).

---

# Overview

Ascendant has reached a **mature architectural foundation** — feature modules, a single persisted store, event-driven pipelines, history, analytics, and Hero Identity. New work should **extend and integrate**, not reinvent.

Development follows a deliberate lifecycle:

```
Idea / need
    ↓
Product & feature planning  (long-lived conversations)
    ↓
Implementation              (short-lived — one feature per conversation)
    ↓
Verification & Definition of Done
    ↓
Documentation sync
    ↓
Version / milestone close   (when applicable)
```

---

# Conversation Types

Not every task uses every stage. Match the conversation type to the work.

| Type | Lifespan | Primary outputs |
|------|----------|-----------------|
| **Planning / Architecture** | Long-lived | Roadmap, design, prompts |
| **Implementation** | Short-lived | Code, implementation report |
| **Debugging** | Short-lived | Fix, minimal report |
| **Documentation** | Long-lived or short | Synced docs |
| **Brainstorming** | Long-lived | Ideas for future milestones |

**Rule:** Implementation conversations are intentionally **short-lived** — one feature (or cohesive slice), then archive. Planning and documentation conversations remain **long-lived** references.

---

# AI Development Workflow

When using AI assistants (Cursor, Claude, etc.), assign **one primary responsibility per conversation**.

## Planning / Architecture

**Purpose:** Product vision, roadmap, system design, prompt creation.

**Read first:** [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md), [PROJECT_STATE.md](PROJECT_STATE.md), [MILESTONES.md](MILESTONES.md), [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md), [ARCHITECTURE.md](ARCHITECTURE.md).

**Produces:**

- Milestone scope and version boundaries
- Feature specs and acceptance criteria
- Implementation prompts for separate implementation conversations
- Architecture decisions (document significant ones; consider ADR — see [Documentation Maintenance](#documentation-maintenance))

**Does not:** Ship production code (except tiny spikes explicitly requested).

---

## Implementation

**Purpose:** Build one feature completely in a focused session.

**Read first:** [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md), [PERSISTENCE.md](PERSISTENCE.md), relevant feature doc, planning prompt from prior conversation.

**Produces:**

- Working code integrated with existing systems
- **Implementation report** (see below)
- Updates to feature-level documentation

**Rules:**

- **One feature per conversation** (or one cohesive vertical slice)
- Do not start v0.1.x systems unless milestone explicitly allows
- Satisfy [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) before archiving

---

## Debugging

**Purpose:** Fix bugs only — no scope creep.

**Read first:** Relevant feature code paths, [PROJECT_STATE.md](PROJECT_STATE.md) for expected behavior.

**Produces:**

- Minimal fix aligned with existing architecture
- Brief note in implementation report if behavior changed materially
- Doc update only if user-visible behavior or persistence changed

**Does not:** Refactor unrelated code, add features, or redesign systems.

---

## Documentation

**Purpose:** Synchronize documentation with the codebase; maintain canonical references.

**Read first:** [PROJECT_STATE.md](PROJECT_STATE.md), [CHANGELOG.md](CHANGELOG.md), docs index in [README.md](../README.md).

**Produces:**

- Updated docs; new docs when warranted (e.g. PROJECT_STATE, workflow docs)
- Cross-reference fixes; removed stale version strings
- No application behavior changes unless a doc error requires a one-line comment fix

**Typical triggers:** Version complete, milestone complete, documentation audit, post-implementation sync.

---

## Brainstorming

**Purpose:** Explore future ideas — story, RPG systems, world, combat, AI concepts.

**Read first:** [GAME_BIBLE.md](GAME_BIBLE.md), [FUTURE_IDEAS.md](FUTURE_IDEAS.md), [COMBAT.md](COMBAT.md), [STORY.md](STORY.md), [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md).

**Produces:**

- Notes, outlines, design sketches
- Candidates for [FUTURE_IDEAS.md](FUTURE_IDEAS.md) or future milestone promotion

**Does not:** Implement or commit code unless explicitly escalated to a planning + implementation cycle.

---

# Product Planning

**When:** Starting a new version, milestone, or major initiative.

**Steps:**

1. Confirm alignment with [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) and [MILESTONES.md](MILESTONES.md).
2. Review [PROJECT_STATE.md](PROJECT_STATE.md) — what exists today.
3. Update [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) with scope, boundaries, and explicit **out-of-scope** items.
4. Identify integration points (Hero, Timeline, History, Analytics, Persistence).
5. Break work into **implementable features** — each gets its own implementation conversation and prompt.

**Output:** Milestone plan + feature prompts — not code.

---

# Feature Planning

**When:** Before each implementation conversation.

**Steps:**

1. Write a clear prompt: goal, acceptance criteria, files likely touched, integration requirements, persistence impact.
2. Reference existing patterns ([ARCHITECTURE.md](ARCHITECTURE.md), similar feature docs).
3. State what **not** to build.
4. Confirm Hero-first impact: does this make the Hero feel more alive?

**Output:** Implementation prompt (can live in chat, issue, or planning doc — not necessarily committed).

---

# Implementation

**When:** Executing a planned feature.

**Steps:**

1. Read required docs (see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#before-you-code)).
2. Implement following feature-based layout and event-driven pipelines.
3. Add migration if persistence changes ([PERSISTENCE.md](PERSISTENCE.md)).
4. Wire integration hooks (events, `syncHeroIdentity`, analytics selectors, etc.).
5. Update DevTools if needed for verification.
6. Run `npm run lint` and `npm run build`.

**Output:** Code + implementation report.

---

# Bug Fixing

**When:** Defect found in shipped or in-progress work.

**Steps:**

1. Reproduce and identify root cause in established pipeline — avoid parallel code paths.
2. Minimal fix; match surrounding conventions.
3. Verify fix + adjacent regressions (save load, quest completion, etc.).
4. Update docs only if user-visible contract changed.

**Output:** Fix + brief verification note.

---

# Testing / Verification

Ascendant does not yet require a formal automated test suite for every change. Verification is **manual and build-based**:

| Check | Command / action |
|-------|------------------|
| Type safety | `npm run build` |
| Lint | `npm run lint` |
| Smoke test | Exercise primary user path in dev Dashboard |
| Save migration | Load old save / fresh save in DevTools |
| Integration | Confirm events, history, analytics, identity where applicable |

Document what was verified in the implementation report. Add automated tests when they provide meaningful coverage — not as ceremony.

---

# Implementation Reports

End every **implementation** and **significant bugfix** conversation with a report:

```markdown
## Summary
[1–3 sentences: what and why]

## Integration
[Systems touched: quests, events, heroIdentity, analytics, …]

## Persistence
[Migration version if any; new fields]

## Verification
[Build, lint, manual tests performed]

## Documentation
[Files updated]

## Known limitations
[Intentional gaps or follow-ups]

## Files changed
[Notable paths]
```

Reports may live in chat history, issues, or milestone notes — they need not be committed as files unless the team chooses to archive them in `docs/`.

---

# Documentation Updates

See [Documentation Maintenance](#documentation-maintenance) for which files to update when.

**Minimum for any user-visible feature:**

- Feature doc in `docs/` (new or updated)
- [CHANGELOG.md](CHANGELOG.md) entry when shipping in a version
- [ARCHITECTURE.md](ARCHITECTURE.md) if new subsystem

**Do not duplicate** — link to canonical docs ([PROJECT_STATE.md](PROJECT_STATE.md), feature docs) instead of copying tables.

---

# Version Completion Process

Standard flow when closing an application version:

```
Features complete
        ↓
Definition of Done satisfied (per feature + version checklist)
        ↓
Documentation updated (feature docs, ARCHITECTURE, PERSISTENCE, README)
        ↓
Implementation report / milestone summary
        ↓
PROJECT_STATE.md updated (major milestone or architectural shift)
        ↓
CHANGELOG.md updated
        ↓
IMPLEMENTATION_PLAN.md — version marked complete; next version scoped
        ↓
package.json version bumped
        ↓
Version closed → next version planning begins
```

See [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md#definition-of-done--version--milestone).

---

# Milestone Completion Process

When a **phase** in [MILESTONES.md](MILESTONES.md) completes (may span multiple versions):

1. Complete version closure steps above for the final version in the phase.
2. Update [MILESTONES.md](MILESTONES.md) status.
3. Refresh [PROJECT_STATE.md](PROJECT_STATE.md) comprehensively — this is the canonical baseline snapshot.
4. Optionally produce a milestone summary report (like the v0.0.5 PROJECT_STATE creation).

---

# Documentation Maintenance

## Document roles

| Document | Purpose | Update when |
|----------|---------|-------------|
| [README.md](../README.md) | Entry point, setup, quick feature list | Every version |
| [PROJECT_STATE.md](PROJECT_STATE.md) | **Current** implementation baseline | Major milestones; significant architectural changes |
| [CHANGELOG.md](CHANGELOG.md) | **Historical** release notes | Every version |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Roadmap: shipped vs next | Milestone planning; version close |
| [MILESTONES.md](MILESTONES.md) | Major product phases | Phase boundaries change |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Enduring *why* | Rare — deliberate product decisions only |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Subsystem index | New subsystem or major integration change |
| [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) | Detailed implementation notes | Significant technical depth added |
| [PERSISTENCE.md](PERSISTENCE.md) | Save schema | Any migration or persisted field change |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Code conventions | Convention changes |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | This file — process | Process changes |
| [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) | Completion checklist | Process changes |
| Feature docs (`docs/*.md`) | Domain behavior | Feature changes in that domain |
| [GAME_BIBLE.md](GAME_BIBLE.md) | Game design | Mechanics design changes |
| **ADR** (optional) | Architecture Decision Records | Significant irreversible decisions — *not yet established*; create `docs/adr/` when needed |

## PROJECT_STATE vs CHANGELOG

| | PROJECT_STATE | CHANGELOG |
|---|---------------|-----------|
| **Tense** | Present — what exists **now** | Past — what **shipped** when |
| **Audience** | Onboarding, AI context, planning | Release history, users, retrospectives |
| **Update** | Rewrite/refresh at milestones | Append per version |

Do not use CHANGELOG as a substitute for PROJECT_STATE or vice versa.

## Every feature

- Update relevant **feature doc**
- Note in **implementation report**
- CHANGELOG if part of a released version

## Every version

- CHANGELOG section
- README version + save schema
- IMPLEMENTATION_PLAN status
- package.json version

## Every milestone

- PROJECT_STATE refresh
- MILESTONES status
- Consider workflow/principles docs if process evolved

---

# Quick Reference

| I want to… | Start here |
|------------|------------|
| Understand what exists today | [PROJECT_STATE.md](PROJECT_STATE.md) |
| Understand why we build this way | [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) |
| See major product phases | [MILESTONES.md](MILESTONES.md) |
| Implement a feature | [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) + [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) |
| Change save format | [PERSISTENCE.md](PERSISTENCE.md) |
| Close a version | [Version Completion Process](#version-completion-process) |
| Plan v0.1.x / combat / world | Planning conversation + [MILESTONES.md](MILESTONES.md) — **do not implement without milestone promotion** |

---

# Related Documents

- [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)
- [MILESTONES.md](MILESTONES.md)
- [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md)
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- [AGENTS.md](../AGENTS.md) · [CLAUDE.md](../CLAUDE.md) · [AI_CONTEXT.md](AI_CONTEXT.md)

---

*Established at v0.0.5. This is the official development process for Ascendant going forward.*
