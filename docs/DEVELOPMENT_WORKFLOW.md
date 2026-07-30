# Ascendant Development Workflow

**General software development lifecycle** and project practices for Ascendant.

**How AI agents and conversations are used during development:** [AI_WORKFLOW.md](AI_WORKFLOW.md) — the canonical reference for Product Planning, Technical Planning, Implementation, Code Review, Learning Review, and related phases. Code conventions: [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md). Product values: [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md). Current baseline: [PROJECT_STATE.md](PROJECT_STATE.md). Completion criteria: [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md).

---

# Overview

Ascendant has reached a **mature architectural foundation** — feature modules, a single persisted store, event-driven pipelines, history, analytics, and Hero Identity. New work should **extend and integrate**, not reinvent.

Development follows a deliberate lifecycle. **Phase detail, conversation types, and Cursor tooling** live in [AI_WORKFLOW.md](AI_WORKFLOW.md) — not duplicated here.

```
Idea / need
    ↓
Product Planning (ChatGPT — what and why)
    ↓
Implementation Conversation (Cursor — context, build, review, report)
    ↓
Definition of Done (+ optional Learning Review)
    ↓
Version / milestone close (when applicable)
```

---

# Documentation Ownership

Each process document has a single responsibility. Link between them — do not copy content.

| Document | Owns |
|----------|------|
| [PROJECT_STATE.md](PROJECT_STATE.md) | **Current implementation state** and major systems |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | **Long-term product philosophy** and design principles |
| [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | **Important decisions** and reasoning behind them |
| [AI_WORKFLOW.md](AI_WORKFLOW.md) | **How AI agents/conversations** are used during development |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | **General development lifecycle** and project practices (this file) |
| [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) | **Completion criteria** for features and versions |
| [README.md](../README.md) | **Project overview**, setup, and documentation entry point |

Feature behavior, save schema, and architecture detail live in subsystem docs — not in the process documents above.

---

# AI-Assisted Development

Conversation types, Cursor implementation context, Technical Planning, Code Review, and Learning Review are defined in **[AI_WORKFLOW.md](AI_WORKFLOW.md)**.

| Conversation | Tool | Lifespan |
|--------------|------|----------|
| Product Planning | ChatGPT | Long-lived |
| Implementation (includes Technical Planning, Code Review, reporting) | Cursor | Short-lived — one feature per conversation |
| Debugging | Cursor | Short-lived |
| Documentation | Cursor | Long-lived or short |
| Research | Either | Short-lived |

**Rule:** Product Planning never implements or debugs. Implementation conversations archive after [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) is satisfied.

---

# Product Planning

**When:** Starting a new version, milestone, or major initiative.

**Where:** ChatGPT — see [AI_WORKFLOW.md](AI_WORKFLOW.md#product-planning-conversation-chatgpt).

**Steps:**

1. Confirm alignment with [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) and [MILESTONES.md](MILESTONES.md).
2. Review [PROJECT_STATE.md](PROJECT_STATE.md) — what exists today.
3. Update [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) with scope, boundaries, and explicit **out-of-scope** items.
4. Identify integration points (Hero, Timeline, History, Analytics, Persistence).
5. Break work into **implementable features** — each gets its own Implementation conversation and prompt.

**Output:** Milestone plan + feature implementation prompts — not code.

---

# Feature Planning

**When:** Before each Implementation conversation (within Product Planning).

**Steps:**

1. Write a clear prompt: goal, acceptance criteria, files likely touched, integration requirements, persistence impact.
2. Reference existing patterns ([ARCHITECTURE.md](ARCHITECTURE.md), similar feature docs).
3. State what **not** to build.
4. Confirm Hero-first impact: does this make the Hero feel more alive?

**Output:** Feature implementation prompt for the Cursor Implementation conversation — goal, acceptance criteria, integration, out-of-scope. The agent reads required docs from the repo and explores code; no manual document packet required. See [AI_WORKFLOW.md](AI_WORKFLOW.md#cursor-implementation-context).

---

# Implementation

**When:** Executing a planned feature in Cursor.

Follow [AI_WORKFLOW.md](AI_WORKFLOW.md) for implementation context, Technical Planning (Plan Mode), Composer execution, Code Review, and phase order.

**Steps:**

1. Establish [Cursor Implementation Context](AI_WORKFLOW.md#cursor-implementation-context) — required docs + codebase exploration.
2. Read [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md#before-you-code) conventions.
3. **Technical Planning** — Plan Mode for medium/large features; get plan approved ([AI_WORKFLOW.md](AI_WORKFLOW.md#technical-planning-phase)).
4. Implement following feature-based layout and event-driven pipelines.
5. Add migration if persistence changes ([PERSISTENCE.md](PERSISTENCE.md)).
6. Wire integration hooks (events, `syncHeroIdentity`, analytics selectors, etc.).
7. Update DevTools if needed for verification.
8. **Code Review** — mandatory ([AI_WORKFLOW.md](AI_WORKFLOW.md#code-review-phase)).
9. Run `npm run lint` and `npm run build`; manual smoke test.

**Output:** Code + Code Review + Implementation Report.

---

# Bug Fixing

**When:** Defect found in shipped or in-progress work.

Use a dedicated **Debugging conversation** in Cursor — see [AI_WORKFLOW.md](AI_WORKFLOW.md#debugging-conversation-cursor).

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

End every **implementation** and **significant bugfix** conversation with a report — **after Code Review** ([AI_WORKFLOW.md](AI_WORKFLOW.md#code-review-phase)):

```markdown
## Summary
[1–3 sentences: what and why]

## Code Review
[Architectural decisions, integration points, tradeoffs, future improvements]

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

Dedicated **Documentation conversations** may handle milestone-wide doc passes — see [AI_WORKFLOW.md](AI_WORKFLOW.md#documentation-conversation-cursor).

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
Version closed → next Product Planning begins
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
| [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | Major product decision log | Significant durable product choices |
| [AI_WORKFLOW.md](AI_WORKFLOW.md) | **AI conversation types and feature lifecycle** | AI workflow changes |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Subsystem index | New subsystem or major integration change |
| [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) | Detailed implementation notes | Significant technical depth added |
| [PERSISTENCE.md](PERSISTENCE.md) | Save schema | Any migration or persisted field change |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Code conventions | Convention changes |
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | This file — general lifecycle | Process changes |
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
| Understand why a major choice was made | [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) |
| See major product phases | [MILESTONES.md](MILESTONES.md) |
| Use AI during development | [AI_WORKFLOW.md](AI_WORKFLOW.md) |
| Implement a feature | [AI_WORKFLOW.md](AI_WORKFLOW.md) + [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) + [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) |
| Change save format | [PERSISTENCE.md](PERSISTENCE.md) |
| Close a version | [Version Completion Process](#version-completion-process) |
| Plan v0.1.x / combat / world | Product Planning ([AI_WORKFLOW.md](AI_WORKFLOW.md)) + [MILESTONES.md](MILESTONES.md) — **do not implement without milestone promotion** |

---

# Related Documents

- [AI_WORKFLOW.md](AI_WORKFLOW.md)
- [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md)
- [MILESTONES.md](MILESTONES.md)
- [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md)
- [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md)
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- [AGENTS.md](../AGENTS.md) · [CLAUDE.md](../CLAUDE.md) · [AI_CONTEXT.md](AI_CONTEXT.md)

---

*Established at v0.0.5. General development lifecycle for Ascendant — AI-specific process in [AI_WORKFLOW.md](AI_WORKFLOW.md).*
