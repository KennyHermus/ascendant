# Workout Categories

Version: aligned with Ascendant v0.0.4

See also: [WORKOUT.md](WORKOUT.md), [DURATION_ACTIVITIES.md](DURATION_ACTIVITIES.md), [ACTIVITIES.md](ACTIVITIES.md)

---

# Overview

All workouts and activities appear in a **single Workout panel**, organized by category. Exercise-based templates and duration-based activities (Walk) share the same `WorkoutActivity` infrastructure — the UI does not treat them as separate systems.

Catalog definition: `src/data/workoutCatalog.ts`

---

# Categories

## Strength

Template-based exercise sessions:

| Activity | Est. duration |
|----------|---------------|
| Upper Body | ~45 min |
| Lower Body | ~45 min |
| Core | ~10 min |
| Rehabilitation | ~40 min |

Workflow: Create session (Not Started) → Start → log sets → Review → Finish.

## Cardio

Duration-based activities measured primarily by elapsed time:

| Activity | Status |
|----------|--------|
| Walk | Implemented |
| Run | Placeholder |
| Cycle | Placeholder |
| Swim | Placeholder |
| Hike | Placeholder |

Workflow: Start Walk → timer runs → Stop → Review → Finish Walk.

## Sports

Future-ready placeholders only (not startable):

- Basketball
- Soccer
- Tennis
- etc.

---

# Shared Architecture

Regardless of category or structure:

```
WorkoutSession → WorkoutActivity → Quest resolution (if applicable) → History / Analytics
```

| Structure | Examples | Logging |
|-----------|----------|---------|
| `exercise` | Strength templates | Sets, reps, weight, sections |
| `duration` | Walk, future Run/Bike | Elapsed time only |

Both use the same event pipeline (`WORKOUT_COMPLETED`), timeline, and analytics inputs.

---

# Session State Machine

Workout UI derives entirely from `WorkoutSession.status` — not local React phase state.

## Two explicit screens

| Screen | Stored statuses | Primary actions |
|--------|-----------------|-----------------|
| **View 1 — Logging** | `in_progress`, `paused`, `ready_for_review` | Log sets, timers, Pause/Resume; **Review Workout** when `ready_for_review` |
| **View 2 — Review** | `review` | Summary, Finish, Cancel, **Back** |

State logic: `src/features/workout/workoutSessionState.ts`

## Status flow (exercise sessions)

| User phase | Stored status |
|------------|---------------|
| Not Started | `draft` |
| Active | `in_progress` |
| Paused | `paused` |
| Ready for Review | `ready_for_review` |
| Reviewing | `review` |
| Completed | `completed` |
| Cancelled | `cancelled` |

```
Active (in_progress)
    ↓ all required exercises complete
Ready for Review (ready_for_review)  ← Review Workout button visible
    ↓ Review Workout (or auto after final log)
Reviewing (review)
    ↓ Back
Ready for Review (ready_for_review)  ← Review button remains until Finish or Cancel
```

Duration activities skip `ready_for_review`; Stop from active/paused enters review directly.

| Action | Transition |
|--------|------------|
| Start | Not Started → Active |
| Pause | Active or Ready for Review → Paused |
| Resume | Paused → Active or Ready for Review (if all exercises still complete) |
| Final exercise logged | Active → Ready for Review (may auto-open Review) |
| Review Workout | Ready for Review → Reviewing |
| Stop (duration) | Active or Paused → Reviewing |
| Back | Reviewing → **Paused** (timer stays paused; Resume restores `statusBeforeReview`) |
| Finish | Reviewing → Completed |
| Cancel | Any editable phase → Cancelled |

**Review button rule:** `shouldShowReviewWorkoutButton()` returns true when `status === 'ready_for_review'`, or when paused with `resumeTargetStatus === 'ready_for_review'`.

**Timer rule:** Session timer runs during Active and Ready for Review; pauses on Review. **Back from Review** keeps the timer paused and shows **Resume** — the timer only runs again when Resume is pressed. Workout logging remains editable while paused.

**Cancel rule:** Stops timers, discards session, no activity/rewards/history/quest changes.

---

# Workout Picker

The Workout panel uses a **compact nested dropdown** (`<select>` with `<optgroup>`) instead of a large category button list.

```
Strength >
    Upper Body
    Lower Body
    Core
    Rehabilitation
Cardio >
    Walk
    Run (coming soon)
    ...
Sports >
    Basketball (coming soon)
    ...
```

Catalog: `src/data/workoutCatalog.ts`. Only `implemented: true` entries are selectable; future placeholders appear disabled.

---

# Today's Journey — Workouts Accordion

When one or more workout sessions/activities exist for the current Hero Day, **Today's Journey** groups them under a collapsible **Workouts** accordion instead of scattering rows at the top level.

Example:

```
Today's Journey
▼ Workouts (4)
    Upper Body — in progress
    Core — complete
    Rehabilitation — complete
    Walk — complete
```

The accordion collapses/expands, persists preference via `localStorage`, and updates live as workouts complete. Quest and progress math are unchanged — only presentation is grouped.

---

# Adding Catalog Entries

1. **Strength:** Add/update template in `src/data/workoutTemplates/programs.ts` — catalog picks it up automatically from `DEFAULT_WORKOUT_TEMPLATES`.
2. **Cardio duration:** Add to `DURATION_ACTIVITY_DEFINITIONS` and `CARDIO_ENTRIES` in `workoutCatalog.ts`; set `implemented: true` when ready.
3. **Sports:** Add placeholder to `SPORTS_ENTRIES` with `implemented: false`.

Bump `WORKOUT_SCHEMA_VERSION` when default template metadata changes materially.
