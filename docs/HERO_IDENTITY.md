# Hero Identity (v0.0.5)

Hero Identity marks the beginning of Ascendant's transition from a life-management application to an RPG. The Hero should feel like a **growing character** — not a spreadsheet of statistics.

Identity systems are **presentation and legacy only**. They do not change gameplay mechanics, combat, or quest rewards.

---

## Overview

| System | Purpose |
|--------|---------|
| **Hero Profile** | Expanded identity card — name, portrait placeholder, title, rank, lifetime stats |
| **Hero Biography** | Auto-generated living narrative from lifetime metrics |
| **Hero Titles** | Unlockable accomplishment titles (one active) |
| **Lifetime Accomplishments** | Legacy milestones distinct from Achievements |
| **Timeline Integration** | Major identity moments appear in Hero Timeline |
| **Analytics** | Identity stats exposed via existing Analytics Engine |

---

## Hero Profile

The **Hero Profile** panel (`HeroProfileSection`) displays:

- Hero Name
- Portrait placeholder (initials circle — future real portrait slot)
- **Hero Title** — accomplishment-based (e.g. *The Athlete*)
- **Current Rank** — level-based ladder (e.g. *Adventurer* at Level 10)
- Current Level + XP bar
- Lifetime Gold
- Days Active
- Current / Longest Streak
- Overall Completion % (last 365 days, from quest analytics)
- Overall Training % (workout quest completion, last 365 days)
- Overall Nutrition % (nutrition subcategory rate, last 365 days)

The compact **Hero Banner** shows title, name, rank, level, and today's status.

---

## Hero Biography

Biography lines are **derived at read time** in `heroBiographyLogic.ts` — never persisted as text.

Examples:

- "The Hero has completed 842 quests."
- "Reached Level 12."
- "Completed 146 workouts."
- "Achieved 18 Personal Records."
- "The Hero has remained consistent for 63 consecutive days."

Biography updates automatically as lifetime metrics change.

---

## Hero Titles vs Current Rank

Two distinct identity layers coexist:

| Layer | Source | Examples |
|-------|--------|----------|
| **Hero Title** | Lifetime accomplishments | The Consistent, The Athlete, The Scholar |
| **Current Rank** | Hero level | Novice, Apprentice, Adventurer, Legend |

**Hero Title** unlocks from accomplishments. Only one title is active in v0.0.5 — auto-selected by highest priority among unlocked titles. Manual selection is a future extension.

**Current Rank** comes from `heroTitle.ts` (level ladder). It is always shown alongside level.

---

## Lifetime Accomplishments

Defined in `src/data/lifetimeAccomplishments.ts`. Examples:

| ID | Milestone |
|----|-----------|
| `quests-100` | 100 quests completed |
| `quests-500` | 500 quests completed |
| `workouts-100` | 100 workouts logged |
| `pushups-1000` | 1,000 push-up reps in training |
| `days-100` | 100 active Hero Days |
| `streak-63` | 63-day longest streak |
| `level-10` | Reach Level 10 |
| `level-25` | Reach Level 25 |
| `prs-100` | 100 official PRs |
| `learning-100` | 100 Bible + reading quest completions |

### Distinction from Achievements

| | Achievements | Lifetime Accomplishments |
|---|-------------|-------------------------|
| **Purpose** | Collectible rewards | Legacy / identity |
| **Rewards** | XP, gold, points | Titles, biography, timeline |
| **UI** | Achievement Panel | Hero Profile |
| **Events** | `ACHIEVEMENT_UNLOCKED` | `LIFETIME_ACCOMPLISHMENT_EARNED` |

---

## Hero Titles

Defined in `src/data/heroIdentityTitles.ts`. Each title requires a specific accomplishment:

| Title | Required Accomplishment |
|-------|------------------------|
| The Persistent | 100 Quests |
| The Scholar | 100 Learning Quests |
| The Disciplined | 500 Quests |
| The Athlete | 100 Workouts |
| The Consistent | 100 Days Active |
| The Unbreakable | 63-Day Streak |

---

## Timeline Integration

New event types:

- `LIFETIME_ACCOMPLISHMENT_EARNED` — e.g. "Hero completed 100 workouts."
- `HERO_TITLE_EARNED` — e.g. "Hero earned title: The Athlete"

Both appear under the Timeline **Progress** filter.

Level milestones also unlock as accomplishments but do **not** emit duplicate timeline events — `LEVEL_UP` already covers those moments (`emitTimelineEvent: false` on level accomplishments).

---

## Analytics

Hero Identity statistics are exposed in the Analytics Dashboard **Hero** section via `heroIdentity` rollups on `PeriodAnalytics`:

- Hero Title
- Current Rank
- Days Active
- Accomplishments unlocked count

These reuse existing analytics inputs — identity percentages in the profile delegate to quest analytics rather than recomputing.

---

## Persistence

| Field | Location |
|-------|----------|
| `GameState.heroIdentity` | Persisted save |
| Biography | Derived (not stored) |
| Profile percentages | Derived from analytics |

Save migration **0.0.9 → 0.0.10** backfills earned accomplishments and titles from existing progress **without** emitting timeline events. Only unlocks that occur during live gameplay create timeline entries.

```typescript
interface HeroIdentityState {
  schemaVersion: 1
  unlockedAccomplishmentIds: string[]
  unlockedTitleIds: string[]
  activeTitleId: string | null  // null = auto-select highest-priority unlocked title
}
```

When `activeTitleId` is `null`, the display title is resolved at read time from the highest-priority unlocked title. Set `activeTitleId` explicitly when manual title selection ships.

---

## Architecture

```
src/
├── data/
│   ├── lifetimeAccomplishments.ts   # Milestone definitions
│   └── heroIdentityTitles.ts        # Title definitions
├── features/heroIdentity/
│   ├── heroIdentityLogic.ts         # Evaluation, metrics, title resolution
│   ├── heroBiographyLogic.ts        # Biography generator
│   ├── heroProfileSelectors.ts      # Profile view model
│   ├── heroIdentitySync.ts          # Store sync helper
│   ├── heroIdentityAnalyticsLogic.ts
│   ├── HeroProfilePanel.tsx
│   └── HeroProfileSection.tsx
└── types/heroIdentity.ts
```

Evaluation runs via `syncHeroIdentity()` after quest completion, workouts, assessments, XP grants, and on save rehydrate.

---

## Future Extension Points

Prepared in `HeroIdentityState` documentation — **not implemented**:

| Extension | Purpose |
|-----------|---------|
| **Hero Classes** | `classId` — build archetype identity |
| **Reputation** | Faction standing per region/group |
| **Guilds** | `guildId` — social identity |
| **Companions** | `companionIds` — party narrative |
| **Alignment** | Moral / story axis |
| **Story choices** | `storyFlags` — persistent narrative decisions |
| **Manual title selection** | Player-chosen active title |
| **Hero portrait** | Replace initials placeholder with custom art |

When adding future systems, ask: **"How does this make the Hero feel more alive?"**

Identity features should integrate with Timeline, Today's Journey, History, Analytics, Achievements, and Coaching — not exist in isolation.

---

## Related Docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — subsystem index
- [PERSISTENCE.md](PERSISTENCE.md) — save schema
- [HISTORY.md](HISTORY.md) — Hero Timeline
- [PROGRESSION.md](PROGRESSION.md) — level-based ranks
