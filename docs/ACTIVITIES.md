# Activity Architecture

Version: aligned with Ascendant v0.0.4 (Fitness Foundation)

---

# Purpose

Activities are the **rich record of what actually happened** in gameplay.

Quests represent objectives, commitments, or challenges. Activities represent the underlying behavior, event, or experience.

```
WorkoutActivity (gameplay record)
    ↓
Quest Resolution (objectives satisfied)
    ↓
Rewards → History → Analytics → Insights
```

- **Quest** — expectation, availability, completion gate, rewards (objectives)
- **Activity** — detailed execution data, history, analytics input (gameplay records)

Do not merge these models. A quest should not become a storage container for detailed gameplay data. **Quests do not own activities** — activities are resolved *into* quests when criteria match.

---

# v0.0.4 Scope

Only **WorkoutActivity** is implemented.

Existing quest types (nutrition, timed wake-up, etc.) are **not migrated** yet. The pattern is proven with workouts first; nutrition and other systems follow in later milestones.

---

# Activity Kinds

Registered in `src/types/activity.ts`:

| Kind | Status | Quest resolution |
|------|--------|------------------|
| `workout` | Implemented | Resolves `workout`, `core`, `rehab` from template; walk quests from duration activities |

Future kinds (designed, not implemented):

- `nutrition`
- `combat`
- `story`
- `shop`

Registry: `src/features/activities/activityRegistry.ts`

---

# Shared Activity Base

Every persisted activity carries:

- `id`, `kind`, `questId` (quest rewarded by this completion, or `null`)
- `heroDayKey`, `startedAt`, `completedAt`
- `completionGrade` (excludes `missed`)
- optional `metadata` (JSON-serializable)

Workout-specific fields live on `WorkoutActivity` — see [WORKOUT.md](WORKOUT.md).

---

# Multiple Activities per Hero Day

A hero may complete **any number** of WorkoutActivities on the same Hero Day (Upper Body, Core, Rehab, repeat sessions, etc.).

Each activity is persisted independently with its own duration, exercise log, grade, and timeline event.

Quest rewards are granted **once per quest per period** — additional qualifying workouts still log to history and analytics.

---

# Quest Resolution (Workout)

Workout quests declare which templates satisfy them via `acceptedWorkoutTemplates` on `QuestDefinition`:

| Quest | Accepts templates |
|-------|-------------------|
| Workout | `upper-body`, `lower-body` |
| Core | `core` |
| Rehab | `rehabilitation` |

On workout completion (`workoutQuestResolution.ts`):

1. Create `WorkoutActivity` (always)
2. For each matching quest still `available`, call `completeQuest()` once
3. Emit `WORKOUT_COMPLETED` event
4. If quest already completed, activity is still recorded — no duplicate rewards

Activity-driven quest ids: `workout`, `core`, `rehab`, `morning-walk`, `evening-walk` — completed via the Workout panel, not the generic Quest Complete button.

---

# Duration-Based Activities

Walk and future duration types (Run, Bike, Swim, Hike) use `activityStructure: 'duration'` on `WorkoutActivity`. They do not require exercises or sets.

See **[DURATION_ACTIVITIES.md](DURATION_ACTIVITIES.md)** for walk workflow, quest windows, and integration metadata. See **[WORKOUT_CATEGORIES.md](WORKOUT_CATEGORIES.md)** for Strength / Cardio / Sports picker organization.

---

# Persistence

Workout domain state on `GameState.workout`:

```typescript
{
  schemaVersion: number
  templates: WorkoutTemplate[]
  sessions: WorkoutSession[]
  activities: WorkoutActivity[]   // unbounded per hero day
  activeSessionId: string | null  // one live session at a time
}
```

Save version **0.0.5** adds this block. Migration `0.0.4 → 0.0.5` defaults empty workout state for prior saves.

Application version (`package.json`) remains independent from save schema version.

---

# Completion Pipeline

```
Create Session → Start → Log sets → Complete Workout
    ↓
WorkoutActivity persisted
    ↓
resolveWorkoutQuests(templateId)
    ↓
completeQuest (each matching, available quest — once)
    ↓
WORKOUT_COMPLETED event + timeline + analytics + insights + daily summary
```

No parallel reward or analytics systems.

---

# Integration Points

| System | Integration |
|--------|-------------|
| Events | One `WORKOUT_COMPLETED` per activity |
| Timeline | Each workout event independently viewable |
| Analytics | Based on `workout.activities[]`, not quest completion |
| Insights | `workoutVolume` + training load from activities |
| Today's Journey | Workouts grouped in a collapsible accordion; lists all today's sessions + completed activities |
| Daily Summary | Reflection when any `WORKOUT_COMPLETED` event exists |
| Quest UI | Activity-driven quests show "Use Workout panel" |

---

# Future Extensibility

To add a new activity kind:

1. Add kind to `ACTIVITY_KINDS` and activity-specific types
2. Implement quest resolution rules (data-driven where possible)
3. Persist domain slice on `GameState`
4. Implement session lifecycle + completion that creates activity then resolves quests
5. Add event type + timeline/analytics hooks
6. Migrate save version if persistence changes

Nutrition should follow the same Activity → Quest Resolution split when migrated.
