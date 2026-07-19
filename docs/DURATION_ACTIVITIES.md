# Duration-Based Workout Activities

Version: aligned with Ascendant v0.0.4

See also: [ACTIVITIES.md](ACTIVITIES.md), [WORKOUT.md](WORKOUT.md), [WORKOUT_TIMING.md](WORKOUT_TIMING.md)

---

# Overview

Not every `WorkoutActivity` is built from exercises and sets. **Duration-based activities** record elapsed time as the primary metric — walking, running, cycling, swimming, hiking, etc.

| Structure | Examples | Primary data |
|-----------|----------|--------------|
| `exercise` | Upper Body, Core, Rehab | Sections, exercises, sets, reps, volume |
| `duration` | Walk (implemented), Run, Bike, … | Start/end timestamps, elapsed duration |

Both share the same `WorkoutActivity` persistence, events, timeline, analytics, and insights pipeline.

---

# Architecture

```
Duration Activity (Walk)
    ↓
WorkoutSession (activityStructure: duration)
    ↓
WorkoutActivity (no exercises required)
    ↓
Quest Resolution (time-window rules)
    ↓
History · Analytics · Insights
```

Walk is **not** modeled as a workout template with a single exercise. It is a first-class duration activity type (`activityType: 'walk'`), aligned with how Apple Health, Google Fit, and Strava represent walking as a complete activity.

---

# Walk Workflow

```
Start Walk
    ↓
Timer begins (wall clock)
    ↓
Walking… (Pause / Resume / Stop Walk)
    ↓
Review
    ↓
Finish Walk
    ↓
WorkoutActivity persisted
    ↓
Morning or Evening Walk quest (if window matches)
```

Walking and future duration types appear under **Cardio** in the Workout panel catalog — not a separate UI section. See **[WORKOUT_CATEGORIES.md](WORKOUT_CATEGORIES.md)** for category organization and **[DURATION_ACTIVITIES.md](DURATION_ACTIVITIES.md)** for walk workflow, quest windows, and integration metadata.

**Code:**

| Piece | Location |
|-------|----------|
| Definitions | `src/data/durationActivities.ts` |
| Session + activity builders | `src/features/workout/durationActivityLogic.ts` |
| Walk quest windows | `src/features/workout/workoutQuestResolution.ts` |
| Store action | `startDurationActivity('walk')` |

---

# Walk Quest Resolution

Walk quests resolve by **completion timestamp** within Hero Day windows — not by template mapping.

| Quest | Window |
|-------|--------|
| Morning Walk | Hero Day start (5:00 AM) → 5:00 PM |
| Evening Walk | 5:00 PM → Hero Day end (next 5:00 AM) |

Rules:

- Each quest rewards **once per Hero Day** (existing quest completion gate)
- Additional walks the same day still log as `WorkoutActivity` records
- Walk quests are **activity-driven** — use the Workout panel, not the generic Complete button

---

# WorkoutActivity Model

New fields on `WorkoutActivity` and `WorkoutSession`:

```typescript
activityStructure: 'exercise' | 'duration'
activityType: string          // template id or 'walk', 'run', …
integration?: {
  source?: 'manual' | 'apple_health' | 'google_fit' | 'strava'
  externalActivityId?: string | null
  lastSyncedAt?: string | null
  syncToken?: string | null
}
```

Duration activities use empty `sections[]` and `exercises[]`. Exercise rollups (`exerciseCount`, `setCount`, `totalVolume`) are zero.

Manual entries set `integration.source: 'manual'`. Health platform fields remain optional and unused until integrations ship.

---

# Adding Future Duration Types

1. Add entry to `DURATION_ACTIVITY_TYPES` and `DURATION_ACTIVITY_DEFINITIONS` in `src/data/durationActivities.ts`
2. Expose in `AVAILABLE_DURATION_ACTIVITIES` when UI-ready
3. Implement quest resolution rules in `resolveDurationActivityQuestIds()` if applicable
4. No schema redesign required — reuse `activityStructure: 'duration'`

---

# Review Navigation

| State | Controls |
|-------|----------|
| Active (in progress) | Pause |
| Paused | Resume |
| Review | **Back** (return to editing) · **Finish Workout / Finish Walk** |

**Resume** on the Review screen is intentionally removed. Resume is only for paused workouts, not for leaving review.

---

# Schema

`WORKOUT_SCHEMA_VERSION = 6` — adds `activityStructure`, `activityType`, and integration fields. Legacy saves infer structure from template id.

---

# Future Integrations

The `integration` block prepares for:

- Apple Health / Google Fit / Strava import
- External activity id deduplication
- Sync timestamps and tokens

Do **not** implement platform SDKs in v0.0.4 — only persist the extensible shape.

Future analytics (distance, pace, steps) will extend duration activity metadata without changing the core activity → quest → history pipeline.
