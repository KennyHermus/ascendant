# Workout System

Version: aligned with Ascendant v0.0.4 (Fitness — logging & sessions)

See also: [ACTIVITIES.md](ACTIVITIES.md)

---

# Overview

The workout system provides:

- Reusable **exercise catalog** (`src/data/exercises.ts`)
- **Workout templates** — Upper Body, Lower Body, Core, Rehabilitation
- **Session lifecycle** — draft → in progress → paused → ready for review → review → complete
- **Set logging** with completion check-off UX
- **Workout activities** — immutable completed records for history / analytics
- **Statistics utilities** — reps, volume, frequency (`workoutStatistics.ts`)

Out of scope: PRs, estimated 1RM, recommendations, automatic progression, recovery scoring.

---

# Template Hierarchy

Workout data follows a four-level hierarchy. This is the standard for all current and future templates.

```
Workout Template
    ↓
Workout Section
    ↓
Exercise
    ↓
Set
```

| Level | Purpose |
|-------|---------|
| **Workout Template** | Named program (e.g. Upper Body). Duration, rest, circuit settings. |
| **Workout Section** | Organizational grouping only — Push-ups & Arms, Dumbbell Back, Stretching, etc. |
| **Exercise** | Catalog reference + flexible prescription metadata |
| **Set** | Planned or logged set slot (reps, weight, duration, notes) |

## Why Workout Sections exist

Sections are **not** a separate activity type. They exist to:

- **Group related exercises** (e.g. push-up variants, stretching)
- **Display progress per block** — completed / remaining exercises and sets
- **Support collapsible UI** without changing logging or analytics semantics
- **Preserve exercise ordering** within each program

Template definitions live in structured data (`src/data/workoutTemplates/`). See **[WORKOUT_DATA.md](WORKOUT_DATA.md)** for prescriptions (planned reps/weight) and **[WORKOUT_BLOCKS.md](WORKOUT_BLOCKS.md)** for circuit blocks and progression.

---

# Workout Lifecycle

```
Select template
    ↓
Create session (draft) — sections + pre-planned set slots
    ↓
Start workout — session timer begins (wall clock)
    ↓
Log exercises — check off sets (weight, reps) or timed holds (Start/Pause/Stop)
    ↓
All required exercises complete → Ready for review (View 1 shows Review Workout)
    ↓
Review workout (View 2) — session timer pauses; Back returns to Ready for review
    ↓
Complete workout
    ↓
WorkoutActivity (gameplay record — always created)
    ↓
Quest Resolution (workout / core / rehab from template)
    ↓
WORKOUT_COMPLETED event (+ rewards if quest still available)
```

Session controls: **pause**, **resume**, **review**, **cancel**, **complete**.

Workout duration uses a **wall-clock session timer** (`Date.now()`) independent of Hero Time. Start/completion timestamps use Hero Time for calendar alignment. See **[WORKOUT_TIMING.md](WORKOUT_TIMING.md)** for timed exercises, rest timers, and DevTools Hero Time controls.

---

# Multiple Workouts per Hero Day

There is no one-workout-per-day limit. Each completed session becomes its own `WorkoutActivity` with independent history, timeline, and analytics entries.

Quest rewards fire once per quest per period. Repeating the same template (e.g. Upper Body twice) still logs both activities.

---

# Quest Resolution

Quests do not own activities. Template → quest mapping lives on quest definitions (`acceptedWorkoutTemplates`) and is applied in `workoutQuestResolution.ts`:

| Quest | Templates |
|-------|-----------|
| Workout | Upper Body, Lower Body |
| Core | Core |
| Rehab | Rehabilitation |

See [ACTIVITIES.md](ACTIVITIES.md) for the full pipeline.

---

# Data Model

## ExercisePrescription

Flexible metadata per template slot — not every field applies to every exercise:

- `targetLabel`, `setCount`, `sets[]` (variable rep schemes, **planned weight**)
- `toFailure`, `perLeg`, `perSide`, `bothArms`
- `equipment`, `notes`

## ExerciseSetLog

- `fields` — extensible numeric bag (`weight`, `reps`, `rpe`, `durationSeconds`, …)
- `completed` — check-off status
- optional `notes`

## WorkoutSession

Statuses: `draft` | `in_progress` | `paused` | `review` | `completed` | `cancelled`

Tracks: `startedAt`, `endedAt`, `sessionTimer`, `activeExerciseTimer`, `activeRestTimer`, `restPeriods[]`, `sections[]`, synced `exercises[]`.

Set/exercise logs include optional `target` (planned) and `execution` (actual timing) metadata for future analytics.

## WorkoutActivity

Completed record with:

- `activityStructure` — `exercise` (templates) or `duration` (walk, run, …)
- `activityType` — template id or duration type id
- template name, duration, timestamps, Hero Day
- exercise rollups (zero for duration activities)
- optional `integration` metadata for future health platforms

See **[DURATION_ACTIVITIES.md](DURATION_ACTIVITIES.md)** for walk and duration-based activities.

---

# Programs (v0.0.4)

| Template | Duration | Notes |
|----------|----------|-------|
| Upper Body | ~45 min | Push-ups & Arms (alternating), Dumbbell Back, Stretching |
| Lower Body | ~45 min | 30s rest; variable rep schemes (e.g. 25/10/5/5) |
| Core | ~10 min | Circuit × 2 (block-based), 30s rest between rounds |
| Rehabilitation | ~40 min | Mobility / rehab sequence |

---

# Session Progress

`workoutProgress.ts` exposes:

- completed / remaining exercises and sets (session-wide)
- **section progress** — per-section exercise and set counts
- current exercise index
- completion percentage

Used by **Workout panel** and **Today's Journey**.

---

# Statistics

`workoutStatistics.ts` — reusable builders:

| Utility | Output |
|---------|--------|
| `computeSetVolume` | weight × reps |
| `aggregateSetStats` | sets, reps, volume |
| `computeSessionStatistics` | live session rollups |
| `computeActivityStatistics` | one completed workout |
| `computeActivitiesStatistics` | period rollups + frequency |

Analytics consumes these via `getWorkoutAnalytics()` — no parallel math.

An exercise is complete when **all of its sets** are marked complete (variable set counts per exercise).

---

# UI

**WorkoutPanel** — nested category dropdown picker; two explicit views driven by session status:

| View | Session statuses | Contents |
|------|------------------|----------|
| **Logging (View 1)** | `in_progress`, `paused`, `ready_for_review` | Exercise list, inputs, log, timers; **Review Workout** when `ready_for_review` |
| **Review (View 2)** | `review` | Summary, Finish, Cancel, Back (restores prior logging status) |

Logging the final exercise may auto-open review; Back always returns to View 1 with the Review button still available until Finish or Cancel.

Duration activities (Walk): Start → timer → Stop → Review → Finish Walk (no `ready_for_review` phase).

**WorkoutDetailModal** — section-grouped drill-down from timeline or completed today view.

**Today's Journey** — workout entries grouped in a collapsible **Workouts** accordion (one row per active session and each completed activity today).

---

# History & Timeline

`WORKOUT_COMPLETED` events include template, duration, exercise/set counts, reps, volume.

Timeline labels: `Upper Body Workout · 45 min · 24 exercises · 48 sets`

Clicking a workout event opens **WorkoutDetailModal**.

---

# DevTools

- Generate sample workout (create + start Upper Body)
- Complete sample workout (auto-log sets)
- Generate workout history (past activities + events)
- Clear workout history / clear all workout data
- Dump workout state JSON

---

# Schema Migration

`WORKOUT_SCHEMA_VERSION = 9` — bump when default template definitions change materially (e.g. section reorganization, timing metadata, activity structure, duration estimates, session status model, or block/circuit structure). On load:

- Templates below the current schema version are replaced with defaults from `src/data/workoutTemplates.ts`
- Legacy sessions/activities without sections are wrapped in a single **Main** section

See [WORKOUT_DATA.md](WORKOUT_DATA.md) for the edit → refresh workflow, [WORKOUT_TIMING.md](WORKOUT_TIMING.md) for timer configuration, [WORKOUT_BLOCKS.md](WORKOUT_BLOCKS.md) for circuits, and [WORKOUT_CATEGORIES.md](WORKOUT_CATEGORIES.md) for category organization.

---

# Remaining v0.0.4 Work

- Analytics dashboard workout section
- Nutrition activity migration
- PR tracking, recommendations, progression (later tasks)
