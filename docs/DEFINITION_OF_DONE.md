# Definition of Done

Standard completion checklist for **features**, **bug fixes**, and **version milestones** in Ascendant.

Use this before archiving an implementation conversation or closing a version.

**Process:** [AI_WORKFLOW.md](AI_WORKFLOW.md) (phases and conversations) · [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md) (general lifecycle)

**Product context:** [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) · [PROJECT_STATE.md](PROJECT_STATE.md)

---

# When to Apply

| Work type | Apply checklist |
|-----------|-----------------|
| **New feature (medium/large)** | Full checklist including Technical Planning and Code Review |
| **New feature (small)** | Full checklist except Technical Planning — mark N/A |
| **Bug fix** | Integration, persistence (if touched), Code Review (if material), verification, docs (if behavior changed) |
| **Documentation-only pass** | Documentation + cross-reference items only — most items N/A |
| **Version / milestone close** | Full checklist + PROJECT_STATE + CHANGELOG + implementation report |

**Phase order (Implementation conversations):**

```
Technical Planning (if required) → Implementation → Testing → Code Review
    → Documentation → Implementation Report → Definition of Done
    → Learning Review (optional, if requested) → Archive
```

Code Review must complete before the checklist is evaluated. Learning Review, when requested, occurs after the Implementation Report and before archiving.

If an item is **not applicable**, mark it N/A with one-line rationale in the implementation report — do not skip silently.

---

# Learning Review

**Optional.** Request when you want the implementation agent to explain the completed work as if onboarding a new engineer.

## When to request

- After Implementation Report is delivered
- Before archiving the conversation
- When the feature touches unfamiliar architecture or you want deeper understanding of patterns used

## Purpose

Help the developer build a **deep understanding of the codebase** while working alongside AI — not a substitute for Code Review (quality assurance) or the Implementation Report (what shipped).

## The agent should explain

- Overall architecture
- Data flow
- Design patterns
- React concepts
- TypeScript concepts
- State management
- Why important implementation decisions were made
- How the feature integrates with the rest of Ascendant

## Does not

- Replace mandatory Code Review
- Expand scope or suggest unrequested follow-up work unless asked
- Duplicate the Implementation Report verbatim — Learning Review is pedagogical, not a status summary

Deliver in chat. It need not be committed unless the team chooses to archive onboarding notes.

---

# Definition of Done

Master checklist for implementation conversations. Detailed guidance follows in [Checklist detail](#checklist-detail).

- [ ] **Technical Planning completed** (when applicable — medium/large features; Plan Mode, approved before Composer)
- [ ] **Feature implemented** — scope matches approved plan; acceptance criteria satisfied; `npm run build` and `npm run lint` pass
- [ ] **Existing systems integrated appropriately** — uses `completeQuest()`, store actions, established pipelines; no parallel reward/event logic
- [ ] **Persistence and save compatibility verified** — migrations tested (fresh save, upgraded save); [PERSISTENCE.md](PERSISTENCE.md) updated if shape changed
- [ ] **Analytics / history / timeline integration reviewed** — events, snapshots, selectors as applicable; no duplicate timeline entries
- [ ] **Hero integration reviewed** — answers "How does this make the Hero feel more alive?" or correctly scoped as infrastructure; `syncHeroIdentity()` where needed
- [ ] **DevTools updated if needed** — testing helpers guarded with `import.meta.env.DEV`; N/A if no dev surface
- [ ] **Testing and verification completed** — manual smoke test; edge cases (empty data, first-time user, upgraded save)
- [ ] **Mandatory Code Review completed** — before Implementation Report and before evaluating remaining items ([Code Review detail](#code-review-detail))
- [ ] **Documentation synchronized** — feature doc, [ARCHITECTURE.md](ARCHITECTURE.md), cross-references; no stale version strings
- [ ] **PROJECT_STATE updated** (major milestones) — N/A for routine features within a version
- [ ] **CHANGELOG updated** (when applicable) — version-bound work only
- [ ] **Implementation Report generated** — after Code Review ([Implementation Report](#implementation-report))
- [ ] **Optional Learning Review completed** (if requested) — pedagogical walkthrough per [Learning Review](#learning-review)
- [ ] **Known limitations documented** — in implementation report or feature doc
- [ ] **Implementation conversation archived** after completion

---

# Checklist detail

Expanded criteria for checklist items above.

## Technical Planning

*Required for medium and large features. Skip for small features, documentation updates, and bug fixes.*

- [ ] Implementation conversation started with [Feature Kickoff Packet](AI_WORKFLOW.md#feature-kickoff-packet)
- [ ] Technical Planning produced in **Plan Mode** (Sonnet) — **no production code** during this phase
- [ ] Plan includes: implementation strategy, systems to extend, files likely to change, new models/services/selectors, data flow, persistence, analytics/history integration, edge cases, risks, verification strategy
- [ ] Plan **approved** before switching to Composer for implementation

See [AI_WORKFLOW.md](AI_WORKFLOW.md#technical-planning-phase).

## Feature implemented

- [ ] Scope matches the approved plan or prompt — no unrequested systems added
- [ ] Acceptance criteria from planning are satisfied
- [ ] UI renders without errors; empty states handled where relevant
- [ ] TypeScript compiles (`npm run build`)
- [ ] Lint passes (`npm run lint`) or new issues documented

## Integration

- [ ] Uses existing pipelines (`completeQuest()`, activity resolution, store actions)
- [ ] Connects to relevant systems (Quests, History, Analytics, Hero Identity, Coaching, Today's Journey) as appropriate
- [ ] No duplicated state derivable from `history`, `questHistory`, `lifetimeStats`, or analytics

## Persistence

- [ ] New or changed fields documented in [PERSISTENCE.md](PERSISTENCE.md) when save shape changes
- [ ] **Save migration** added and `CURRENT_SAVE_VERSION` bumped when persisted shape or meaning changes
- [ ] Migration tested: fresh save, upgraded save from prior version, `merge()` defaults for missing fields
- [ ] Backfill strategy defined if existing saves need seeded state without spurious side effects

## Analytics, history & timeline

- [ ] **Timeline:** meaningful moments emit appropriate `GameEvent` types; no duplicate events for the same moment
- [ ] **History:** day-advance behavior considered if feature affects daily rollups
- [ ] **Analytics:** stats exposed via existing engine/selectors — not recomputed in UI
- [ ] **Insights / Quest Explorer:** updated only if feature affects their input data

## Hero integration

- [ ] Accomplishments, titles, or biography inputs updated if feature affects lifetime metrics
- [ ] `syncHeroIdentity()` invoked from appropriate store paths (or documented why not needed)
- [ ] Identity remains presentation/legacy-only unless explicitly designed to alter mechanics

## Code Review detail

*Mandatory after implementation, before Implementation Report.*

- [ ] **Files modified** — complete list of touched paths reviewed
- [ ] **Architectural decisions** — align with [ARCHITECTURE.md](ARCHITECTURE.md) and approved Technical Planning (if any)
- [ ] **Data flow** — traced through established pipelines
- [ ] **Integration points** — quests, events, history, analytics, Hero Identity, coaching as applicable
- [ ] **New services / models / utilities** — justified; no unnecessary abstraction
- [ ] **Tradeoffs** — explicit choices and why
- [ ] **Future improvement opportunities** — noted (not implemented unless in scope)
- [ ] No unrequested features, scope creep, or unrelated refactors

See [AI_WORKFLOW.md](AI_WORKFLOW.md#code-review-phase).

---

# Implementation Report

Deliver **after Code Review**, before archiving (and before optional Learning Review). Every implementation conversation should end with a short report containing:

1. **Summary** — what was built and why
2. **Code Review** — key findings from the mandatory review
3. **Files changed** — notable paths only
4. **Persistence / migration** — version bump if any
5. **Integration points** — systems touched
6. **Verification** — what was tested
7. **Known limitations** — intentional gaps
8. **Docs updated** — list
9. **Learning Review** — N/A, or brief note that it was requested and delivered

Template guidance: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#implementation-reports).

---

# Definition of Done — Version / Milestone

When closing an application version (e.g. v0.0.5):

- [ ] All planned features for the version satisfy the master checklist above
- [ ] [CHANGELOG.md](CHANGELOG.md) has version section
- [ ] [PROJECT_STATE.md](PROJECT_STATE.md) reflects new baseline
- [ ] [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) marks version complete; next version scoped or marked TBD
- [ ] README version, save schema, and Dashboard layout current
- [ ] `package.json` version aligned with release
- [ ] Implementation report or milestone summary archived

---

# Archiving the Conversation

An implementation conversation may be archived when:

1. Technical Planning completed and approved (if required) — or marked N/A
2. **Code Review** completed
3. Master [Definition of Done](#definition-of-done) checklist satisfied (or N/A items explained)
4. **Implementation Report** delivered
5. **Learning Review** completed (if requested) — or marked N/A
6. No blocking bugs remain for the scoped work

Planning and documentation conversations remain **long-lived**; implementation conversations are **short-lived** by design.

See [AI_WORKFLOW.md](AI_WORKFLOW.md#implementation-conversation-cursor).

---

*Aligned with Ascendant v0.0.5 foundation and formalized AI workflow. Revise when process lessons warrant — not per-feature ad hoc skips.*
