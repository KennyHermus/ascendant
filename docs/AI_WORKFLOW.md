# Ascendant AI Workflow

**Canonical reference** for how AI assistants are used during Ascendant development.

This document defines AI conversation types, development phases, and the feature lifecycle. General development lifecycle (verification, version closure, documentation maintenance): [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md). Completion checklist: [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md).

---

# Terminology

| Phase | Question | Where |
|-------|----------|-------|
| **Product Planning** | What and why? | ChatGPT — long-lived Product Planning conversation |
| **Technical Planning** | How should it be implemented? | Cursor — Plan Mode at start of Implementation (medium/large features) |
| **Implementation** | Write the code | Cursor — Composer after plan approval |
| **Code Review** | Validate quality and understanding | Cursor — mandatory before Implementation Report |
| **Learning Review** | Help the developer understand the implementation | Cursor — optional, after Implementation Report |
| **Documentation** | Record the state of the project | Cursor — doc sync within Implementation or dedicated Documentation conversation |
| **Implementation Reporting** | Summarize what shipped | Cursor — end of Implementation conversation |

Separate conversation types also cover **Debugging** and **Research** — see sections below.

---

# Overview

Ascendant uses AI as a **structured development partner** — not a single general-purpose chat. Each conversation has one primary responsibility. Mixing planning, implementation, debugging, and documentation in the same thread creates scope creep, stale context, and inconsistent architecture.

## Philosophy

- **One responsibility per conversation** — assign a type before starting; stay in scope.
- **Documentation is source of truth** — AI reads canonical docs before acting; never invent features or document planned work as shipped.
- **Planning produces prompts; implementation produces code** — keep these in separate conversations.
- **Short-lived implementation threads** — one feature per Cursor conversation, then archive.
- **Long-lived planning and documentation threads** — product vision and doc maintenance persist across milestones.
- **Integrate, don't isolate** — every feature should connect to existing pipelines (`completeQuest()`, events, history, analytics, Hero Identity) unless explicitly scoped as infrastructure.

## Conversation types at a glance

| Type | Tool | Lifespan | Primary outputs |
|------|------|----------|-----------------|
| **Product Planning** | ChatGPT | Long-lived | Vision, roadmap, feature specs, implementation prompts |
| **Implementation** | Cursor | Short-lived | Code, tests, docs sync, code review, implementation report |
| **Debugging** | Cursor | Short-lived | Root-cause fix, minimal verification note |
| **Documentation** | Cursor | Long-lived or short | Synced docs, cross-references |
| **Research** | Either | Short-lived | Findings, feasibility notes, recommendations |

**Rule:** Product Planning never performs implementation or debugging. The Implementation conversation never redefines product scope without escalating back to Product Planning.

---

# Product Planning Conversation (ChatGPT)

**Purpose:** Product and system design — everything needed before code is written.

**Lifespan:** Long-lived. One primary Product Planning conversation (or a small set by domain) persists across milestones.

## Responsibilities

- Product vision
- Product architecture
- UX
- Roadmap evolution
- System design
- RPG design
- Feature planning
- Prompt creation
- Challenging assumptions
- Long-term architectural consistency

## Read first

- [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md)
- [PROJECT_STATE.md](PROJECT_STATE.md)
- [MILESTONES.md](MILESTONES.md)
- [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [GAME_BIBLE.md](GAME_BIBLE.md) — when RPG or mechanics design is involved

## Produces

- Milestone scope and version boundaries
- Feature specs with acceptance criteria
- UX direction and integration requirements
- **Feature implementation prompts** for separate Cursor conversations
- Architecture decisions (document significant ones in [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md) or future ADRs)
- Updates to [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [MILESTONES.md](MILESTONES.md) when scope changes

## Does not

- Write or commit application code
- Debug regressions or fix bugs
- Perform documentation synchronization passes (escalate to a Documentation conversation)
- Ship spikes unless explicitly requested as a separate, scoped task

When planning is complete for a feature, hand off a **Feature Kickoff Packet** (see below) to a new Implementation conversation in Cursor.

---

# Technical Planning Phase

**When:** Medium and large features — at the **start** of the Implementation conversation, before any production code.

**Skip when:** Small features, documentation updates, and bug fixes.

## Cursor setup

After product planning is complete:

1. Open a **new Implementation conversation** in Cursor with the [Feature Kickoff Packet](#feature-kickoff-packet).
2. Use **Sonnet in Plan Mode** for this phase.
3. Produce an engineering implementation plan — **no production code** during this phase.
4. Once the plan is **approved**, disable Plan Mode, switch to **Composer**, and execute implementation.

## Purpose

Create an engineering implementation plan before writing code. Product scope comes from Product Planning (ChatGPT); Technical Planning translates that into an executable architecture for Cursor.

## Technical Planning should include

- Implementation strategy
- Existing systems to extend
- Files likely to change
- New models / services / selectors
- Data flow
- Persistence considerations
- Analytics / history integration
- Edge cases
- Risks
- Verification strategy

## Does not

- Write or commit production application code
- Redefine product scope — escalate to Planning if the design reveals scope questions
- Skip approval before switching to Composer

---

# Code Review Phase

**When:** After implementation is complete — **mandatory** for every feature, bug fix with material changes, and cohesive vertical slice.

**Before:** Implementation Report and [Definition of Done](#feature-lifecycle) evaluation.

## Purpose

Quality assurance **and** developer understanding. The review confirms the change set is correct, integrated, and understandable — not merely that it compiles.

## Code Review should include

- Files modified
- Architectural decisions
- Data flow
- Integration points
- New services / models / utilities
- Tradeoffs
- Future improvement opportunities

## Rules

- Code Review is **required** — do not skip for convenience.
- Deliver the review (in chat or as a section of the Implementation Report) **before** generating the final Implementation Report.
- [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) is evaluated **after** Code Review passes.

---

# Learning Review

**Optional.** When requested by the developer, after the Implementation Report and before archiving.

## Purpose

Explain the completed implementation as if **onboarding a new engineer** — pedagogical depth, not quality assurance (see [Code Review](#code-review-phase)).

## The agent should cover

- Overall architecture
- Data flow
- Design patterns
- React concepts
- TypeScript concepts
- State management
- Why important implementation decisions were made
- How the feature integrates with the rest of Ascendant

## When to request

After Implementation Report delivery, before archiving. Useful when the feature touches unfamiliar systems or patterns.

Checklist: [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md#learning-review).

---

# Implementation Conversation (Cursor)

**Purpose:** Build one feature completely — Technical Planning (when required) → implementation → verification → Code Review → documentation sync → Implementation Report.

**Lifespan:** Short-lived. **Every feature receives its own implementation conversation.** Archive when [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) is satisfied.

## Responsibilities

- Reading project documentation
- [Technical Planning](#technical-planning-phase) (medium and large features)
- Implementation (Composer, after plan approval)
- Testing / verification
- [Code Review](#code-review-phase)
- Documentation synchronization
- Implementation report

## Read first (Feature Kickoff Packet)

See [Feature Kickoff Packet](#feature-kickoff-packet) below.

## Workflow within the conversation

### Medium and large features

1. Confirm scope against the feature implementation prompt — ask if ambiguous.
2. **[Technical Planning](#technical-planning-phase)** — Sonnet in Plan Mode; produce engineering plan; get approval; **no production code**.
3. **Implement** — disable Plan Mode; switch to Composer; follow [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) and the approved plan.
4. **Test / verify** — `npm run build`, `npm run lint`, manual smoke test (see [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#testing--verification)).
5. **[Code Review](#code-review-phase)** — mandatory review of the diff before closing.
6. **Documentation sync** — update feature docs, [ARCHITECTURE.md](ARCHITECTURE.md), [PERSISTENCE.md](PERSISTENCE.md) as applicable.
7. **Implementation report** — deliver using the template in [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#implementation-reports); include Code Review summary.
8. **Learning Review** (optional, if requested) — onboarding-style explanation per [Learning Review](#learning-review).
9. **Definition of Done** — satisfy [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md).
10. **Archive** the conversation.

### Small features, documentation updates, bug fixes

Skip Technical Planning. Begin with implementation (or doc edit / fix), then follow steps 4–10 above as applicable.

## Rules

- **One feature per conversation** (or one cohesive vertical slice).
- Do not start v0.1.x systems (combat, inventory, story, skills) unless the milestone explicitly allows.
- Do not expand scope — escalate product questions to the Product Planning conversation.
- Do not skip Code Review or the Implementation Report.
- Do not evaluate Definition of Done before Code Review is complete.

## Does not

- Redefine product vision or roadmap
- Perform unrelated refactors or drive-by fixes (use a Debugging conversation)
- Replace a Documentation-only audit of the full doc tree (though feature-level doc sync is in scope)

---

# Debugging Conversation (Cursor)

**Purpose:** Find and fix defects — nothing else.

**Lifespan:** Short-lived. One bug or regression cluster per conversation.

## Responsibilities

- Root-cause analysis
- Regression fixes
- Targeted bug fixes

## Read first

- Relevant feature code paths
- [PROJECT_STATE.md](PROJECT_STATE.md) — expected behavior
- Feature doc for the affected domain

## Produces

- Minimal fix aligned with existing architecture
- Brief verification note (build, lint, reproduction steps)
- Doc update only if user-visible behavior or persistence changed

## Does not

- Add features or expand scope
- Refactor unrelated code
- Redesign systems
- Batch multiple unrelated bugs unless explicitly requested

---

# Documentation Conversation (Cursor)

**Purpose:** Synchronize documentation with the codebase; maintain canonical references.

**Lifespan:** Long-lived for ongoing maintenance; short-lived for focused audits or milestone doc passes.

## Responsibilities

- [README.md](../README.md)
- [PROJECT_STATE.md](PROJECT_STATE.md)
- [CHANGELOG.md](CHANGELOG.md)
- Architecture documentation ([ARCHITECTURE.md](ARCHITECTURE.md), [ARCHITECTURE_NOTES.md](ARCHITECTURE_NOTES.md))
- Documentation synchronization and cross-reference repair

## Read first

- [PROJECT_STATE.md](PROJECT_STATE.md)
- [CHANGELOG.md](CHANGELOG.md)
- [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) — documentation maintenance table
- Latest implementation report (from chat, issue, or milestone notes)
- [README.md](../README.md) — docs index

## Produces

- Updated docs with accurate, non-duplicative content
- Cross-reference fixes; removed stale version strings
- Recommendations for structural improvements (before major reorganization)

## Does not

- Change application behavior (except a one-line comment fix when a doc error requires it)
- Invent features or document planned work as implemented
- Duplicate content that belongs in a canonical feature doc — link instead

**Typical triggers:** Version complete, milestone complete, documentation audit, post-implementation sync, workflow updates.

---

# Research Conversation

**Purpose:** Gather external knowledge and assess feasibility — no product commitments or code.

**Lifespan:** Short-lived. One research question or topic per conversation.

## Responsibilities

- APIs
- Competitor research
- AI research
- Fitness research
- Technical feasibility
- Industry best practices

## Read first

- [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) — filter findings through product values
- [PROJECT_STATE.md](PROJECT_STATE.md) — what already exists
- Relevant feature or design docs

## Produces

- Findings summary with sources
- Feasibility assessment and tradeoffs
- Recommendations for Planning (not implementation prompts unless explicitly requested)

## Does not

- Implement or commit code
- Finalize product scope (escalate to Planning)
- Replace [FUTURE_IDEAS.md](FUTURE_IDEAS.md) — promote curated ideas there when appropriate

---

# Feature Kickoff Packet

Standard inputs for **every Implementation conversation**. Assemble these before starting a new Cursor thread.

| Input | Purpose |
|-------|---------|
| [PROJECT_STATE.md](PROJECT_STATE.md) | What exists today — baseline for integration |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Product constraints and Hero-first lens |
| Relevant architecture documentation | [ARCHITECTURE.md](ARCHITECTURE.md), feature doc, [PERSISTENCE.md](PERSISTENCE.md) if save shape may change |
| Latest implementation report | Context from the most recent shipped feature — patterns, migrations, known gaps |
| **Feature implementation prompt** | From Planning — goal, acceptance criteria, files likely touched, integration requirements, explicit out-of-scope |

### Feature implementation prompt (minimum contents)

Planning should produce a prompt containing:

1. **Goal** — one sentence
2. **Acceptance criteria** — testable outcomes
3. **Integration** — Hero, Timeline, History, Analytics, quests, persistence as applicable
4. **Files / areas likely touched**
5. **Persistence impact** — migration needed? new fields?
6. **Out of scope** — what not to build
7. **Hero-first check** — how does this make the Hero feel more alive?

The prompt may live in chat history, an issue, or a planning doc — it need not be committed.

---

# Feature Lifecycle

Complete development workflow from idea to archived implementation conversation.

```
Planning (ChatGPT) — Product Planning
        ↓
Technical Planning — Sonnet, Plan Mode (medium/large features only; no production code)
        ↓
Plan approved → Composer
        ↓
Implementation (Cursor — one feature per conversation)
        ↓
Testing / Verification
        ↓
Code Review (mandatory — before Implementation Report and DoD)
        ↓
Documentation
        ↓
Implementation Report
        ↓
Learning Review (optional, if requested)
        ↓
Definition of Done
        ↓
Archive implementation conversation
```

## Stage summary

| Stage | Where | Owner |
|-------|-------|-------|
| **Product Planning** | ChatGPT | Product scope, UX, RPG design, implementation prompt |
| **Technical Planning** | Cursor — Sonnet, Plan Mode | Engineering plan per [Technical Planning Phase](#technical-planning-phase); skip for small features, docs, bugs |
| **Implementation** | Cursor — Composer | Code aligned with approved plan and [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) |
| **Testing** | Cursor | `npm run build`, `npm run lint`, manual smoke test, migration check |
| **Code Review** | Cursor | Mandatory review per [Code Review Phase](#code-review-phase) — before report and DoD |
| **Documentation** | Cursor | Feature doc, ARCHITECTURE, PERSISTENCE, CHANGELOG when version-bound |
| **Implementation Report** | Cursor | Template: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#implementation-reports) |
| **Learning Review** | Cursor (optional) | Onboarding-style explanation — [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md#learning-review) |
| **Definition of Done** | Cursor | [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) — evaluated **after** Code Review |
| **Archive** | — | Close Implementation conversation; Product Planning thread continues |

Version and milestone closure (PROJECT_STATE refresh, package.json bump, IMPLEMENTATION_PLAN update) follow [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#version-completion-process) after all features in the version are archived.

---

# Agent Prompts

## Ascendant Implementation Agent

You are the dedicated implementation engineer for Ascendant.

Your responsibility is to implement exactly one planned feature at a time.

Before making changes, read the project's documentation in the following order:

1. PROJECT_STATE.md
2. PRODUCT_PRINCIPLES.md
3. README.md
4. IMPLEMENTATION_PLAN.md
5. Architecture documentation
6. DEVELOPMENT_WORKFLOW.md
7. DEFINITION_OF_DONE.md

Treat the documentation as the source of truth.

If implementation differs from documentation, update the documentation as part of the feature if appropriate rather than allowing them to drift apart.

### Responsibilities

Your responsibilities are:

* Implement features
* Refactor where necessary for maintainability
* Extend existing systems
* Maintain architectural consistency
* Keep documentation synchronized
* Verify persistence and save compatibility
* Update analytics/history/timeline integration where applicable
* Test edge cases
* Maintain UI consistency

### Design Principles

Always prefer:

* Extending existing systems
* Event-driven architecture
* Reusable services
* Shared selectors
* Existing models
* Existing persistence
* Existing analytics

Avoid:

* Duplicate state
* Parallel implementations
* Unnecessary abstractions
* Premature optimization
* Temporary hacks

### Workflow

For every feature:

1. Read documentation.
2. Read the feature prompt.
3. Inspect the existing implementation.
4. Produce an implementation plan.
5. Implement the feature.
6. Verify behavior.
7. Update documentation.
8. Ensure the Definition of Done is satisfied.
9. Produce an Implementation Report.

The Implementation Report should include:

* Features completed
* Files modified
* Files added
* Architecture changes
* Persistence changes
* Documentation updated
* Known limitations
* Recommendations
* Deviations from the prompt

This conversation is dedicated to one feature only.

After the feature is complete, this conversation should be archived.

## Ascendant Debugging Agent

You are responsible only for debugging Ascendant.

Do not redesign systems.

Do not introduce unrelated features.

Before making changes:

* Read PROJECT_STATE.md.
* Read the relevant architecture documentation.
* Read the implementation report if provided.

For every issue:

1. Reproduce the bug logically.
2. Determine the root cause.
3. Explain why it occurs.
4. Fix the smallest responsible component.
5. Verify no regressions.
6. Update documentation only if behavior changed.

Always preserve existing architecture unless a bug requires a structural correction.

Prefer targeted fixes over rewrites.

If you discover architectural problems beyond the reported bug, document them separately instead of fixing unrelated systems.

Every debugging session should conclude with:

* Root cause
* Files modified
* Verification performed
* Remaining known issues (if any)

## Ascendant Documentation Agent

You are responsible for maintaining Ascendant's documentation.

Documentation should always reflect the current implementation.

Before making changes:

Read all relevant documentation.

Read the latest implementation report.

Responsibilities include:

* README
* PROJECT_STATE
* CHANGELOG
* Architecture documentation
* DEVELOPMENT_WORKFLOW
* PRODUCT_PRINCIPLES
* DEFINITION_OF_DONE
* MILESTONES

Never invent features.

Never document planned functionality as implemented.

When documentation becomes inconsistent, synchronize it with the current codebase.

Favor concise, professional documentation with clear cross-references.

If documentation structure can be improved, recommend changes before making major reorganizations.

Documentation should always be treated as part of the product rather than an afterthought.

When creating new documentation:

- First inspect the existing documentation structure.
- Determine the appropriate document location before creating new files.
- Avoid duplicate sources of truth.
- Prefer extending existing documents when the information belongs there.
- Update cross references between documents when introducing new documentation.

## Ascendant Research Agent

You are responsible for research that informs Ascendant.

Examples include:

* Competitor analysis
* Fitness science
* Nutrition science
* RPG design
* AI agent architectures
* Productivity systems
* UX research
* Technical feasibility
* APIs and integrations

Your role is to gather information, compare approaches, identify tradeoffs, and summarize findings.

Do not redesign Ascendant or implement features unless explicitly asked.

When making recommendations:

* Cite the reasoning behind them.
* Compare multiple approaches.
* Highlight tradeoffs.
* Separate facts from opinions.
* Consider how findings align with Ascendant's product principles.


---

# Quick Reference

| I want to… | Conversation type | Start here |
|------------|-------------------|------------|
| Define what to build next | Product Planning (ChatGPT) | [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md), [PROJECT_STATE.md](PROJECT_STATE.md) |
| Build a planned feature | Implementation (Cursor) | [Feature Kickoff Packet](#feature-kickoff-packet) |
| Fix a bug | Debugging (Cursor) | Feature code + [PROJECT_STATE.md](PROJECT_STATE.md) |
| Sync docs with codebase | Documentation (Cursor) | [PROJECT_STATE.md](PROJECT_STATE.md), [CHANGELOG.md](CHANGELOG.md) |
| Investigate APIs or feasibility | Research | [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) |
| Close a version | Documentation + Product Planning | [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#version-completion-process) |

---

# Related Documents

| Document | Role |
|----------|------|
| [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) | General process — verification, version closure, doc maintenance |
| [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) | Completion checklist |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Code conventions |
| [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) | Product philosophy (Planning) |
| [PRODUCT_DECISIONS.md](PRODUCT_DECISIONS.md) | Product decision log — reasoning behind major choices |
| [AGENTS.md](../AGENTS.md) · [CLAUDE.md](../CLAUDE.md) · [AI_CONTEXT.md](AI_CONTEXT.md) | Agent entry points |

---

*Established at v0.0.5 workflow formalization. This is the canonical AI workflow for Ascendant.*
