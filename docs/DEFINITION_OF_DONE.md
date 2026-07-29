# Definition of Done

Standard completion checklist for **features**, **bug fixes**, and **version milestones** in Ascendant.

Use this before archiving an implementation conversation or closing a version. Full process: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md).

Product context: [PRODUCT_PRINCIPLES.md](PRODUCT_PRINCIPLES.md) · Current baseline: [PROJECT_STATE.md](PROJECT_STATE.md)

---

# When to Apply

| Work type | Apply checklist |
|-----------|-----------------|
| **New feature** | Full checklist (all applicable items) |
| **Bug fix** | Integration, persistence (if touched), verification, docs (if behavior changed) |
| **Documentation-only pass** | Documentation + cross-reference items only |
| **Version / milestone close** | Full checklist + PROJECT_STATE + CHANGELOG + implementation report |

If an item is **not applicable**, mark it N/A with one-line rationale in the implementation report — do not skip silently.

---

# Feature Complete

- [ ] Scope matches the approved plan or prompt — no unrequested systems added
- [ ] Acceptance criteria from planning are satisfied
- [ ] UI renders without errors; empty states handled where relevant
- [ ] TypeScript compiles (`npm run build`)
- [ ] Lint passes (`npm run lint`) or new issues documented

---

# Integration

- [ ] Uses existing pipelines (`completeQuest()`, activity resolution, store actions) — no parallel reward/event logic
- [ ] Connects to relevant systems (Quests, History, Analytics, Hero Identity, Coaching, Today's Journey) as appropriate
- [ ] **Hero integration reviewed** — feature answers "How does this make the Hero feel more alive?" or is correctly scoped as infrastructure
- [ ] No duplicated state that could be derived from `history`, `questHistory`, `lifetimeStats`, or analytics

---

# Persistence

- [ ] New or changed fields documented in [PERSISTENCE.md](PERSISTENCE.md) when save shape changes
- [ ] **Save migration** added and `CURRENT_SAVE_VERSION` bumped when persisted shape or meaning changes
- [ ] Migration tested: fresh save, upgraded save from prior version, `merge()` defaults for missing fields
- [ ] Backfill strategy defined if existing saves need seeded state without spurious side effects (see Hero Identity migration pattern)

---

# History, Timeline & Analytics

- [ ] **Timeline:** meaningful moments emit appropriate `GameEvent` types; no duplicate events for the same moment
- [ ] **History:** day-advance behavior considered if feature affects daily rollups
- [ ] **Analytics:** stats exposed via existing engine/selectors where applicable — not recomputed in UI
- [ ] **Insights / Quest Explorer:** updated only if feature affects their input data or new patterns warrant cards

---

# Hero Identity (when applicable)

- [ ] Accomplishments, titles, or biography inputs updated if feature affects lifetime metrics
- [ ] `syncHeroIdentity()` invoked from appropriate store paths (or documented why not needed)
- [ ] Identity remains presentation/legacy-only unless explicitly designed to alter mechanics

---

# DevTools

- [ ] DevTools updated if feature needs testing helpers or inspectors
- [ ] Dev-only code guarded with `import.meta.env.DEV`
- [ ] N/A if feature has no dev testing surface

---

# Documentation

- [ ] Feature doc created or updated in `docs/` when behavior is user- or contributor-facing
- [ ] [ARCHITECTURE.md](ARCHITECTURE.md) index updated if new subsystem or major integration point
- [ ] [CHANGELOG.md](CHANGELOG.md) updated for version-bound work
- [ ] [PROJECT_STATE.md](PROJECT_STATE.md) updated for **major milestones** or architectural shifts
- [ ] Cross-references added; no stale version numbers left in touched docs

---

# Verification

- [ ] Manual smoke test of primary user path
- [ ] Edge cases considered (empty data, first-time user, upgraded save)
- [ ] **Known limitations** documented in implementation report or feature doc

---

# Implementation Report

Every implementation conversation should end with a short report containing:

1. **Summary** — what was built and why
2. **Files changed** — notable paths only
3. **Persistence / migration** — version bump if any
4. **Integration points** — systems touched
5. **Verification** — what was tested
6. **Known limitations** — intentional gaps
7. **Docs updated** — list

Template guidance: [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#implementation-reports).

---

# Definition of Done — Version / Milestone

When closing an application version (e.g. v0.0.5):

- [ ] All planned features for the version satisfy this checklist
- [ ] [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) satisfied collectively
- [ ] [CHANGELOG.md](CHANGELOG.md) has version section
- [ ] [PROJECT_STATE.md](PROJECT_STATE.md) reflects new baseline
- [ ] [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) marks version complete; next version scoped or marked TBD
- [ ] README version, save schema, and Dashboard layout current
- [ ] `package.json` version aligned with release
- [ ] Implementation report or milestone summary archived

---

# Archiving the Conversation

An implementation conversation may be archived when:

1. This checklist is satisfied (or N/A items explained)
2. Implementation report is delivered
3. No blocking bugs remain for the scoped work

Planning and documentation conversations remain **long-lived**; implementation conversations are **short-lived** by design.

See [DEVELOPMENT_WORKFLOW.md](DEVELOPMENT_WORKFLOW.md#ai-development-workflow).

---

*Aligned with Ascendant v0.0.5 foundation. Revise this checklist when process lessons warrant — not per-feature ad hoc skips.*
