# Workout Data Guide

How to add exercises, edit programs, and ensure changes appear everywhere in the app.

See also: [WORKOUT.md](WORKOUT.md) (system overview), [ACTIVITIES.md](ACTIVITIES.md) (activity layer).

---

# Quick Reference

| Goal | File(s) to edit |
|------|-----------------|
| Add a new exercise name / metadata | `src/data/exercises.ts` |
| Change program structure (sections, order, reps) | `src/data/workoutTemplates/programs.ts` |
| Register a new program in the app | `programs.ts` export + `src/data/workoutTemplates.ts` |
| Force template refresh for existing saves | Bump `WORKOUT_SCHEMA_VERSION` in `src/types/workout.ts` |

**Do not** hardcode exercises or programs in UI components. The Workout panel, draft preview, active logging, detail modal, analytics, and DevTools all read from persisted template/session data built from these files.

---

# Data Flow

```
exercises.ts          programs.ts              workoutTemplates.ts
(exercise catalog) → (program definitions) → (DEFAULT_WORKOUT_TEMPLATES)
                                                        ↓
                                              mergeWorkoutState() on load
                                                        ↓
                                              GameState.workout.templates
                                                        ↓
                              createWorkoutSession() → workoutTemplateLogic.sessionLogsFromTemplate()
                                                        ↓
                                              WorkoutSession.sections + exercises
                                                        ↓
                              WorkoutPanel / WorkoutDetailModal / analytics
```

When you click **Create Workout Session**, the store copies the selected template into a session via `sessionLogsFromTemplate()`. The UI renders `session.sections` — exercise order and grouping come directly from your program data.

When you click **Start Workout**, the same session is used; no template re-read occurs until a new session is created.

---

# 1. Adding a New Exercise

**File:** `src/data/exercises.ts`

1. Add an entry to `EXERCISE_DEFINITIONS` with a unique `id` (kebab-case).
2. Set `name`, `muscleGroup`, `movementCategory`, `equipment`, and `defaultUnits`.

Example:

```typescript
{
  id: 'my-new-exercise',
  name: 'My New Exercise',
  muscleGroup: 'arms',
  movementCategory: 'isolation',
  equipment: 'dumbbell',
  defaultUnits: ['weight', 'reps'],
},
```

The catalog is indexed automatically via `EXERCISE_BY_ID`. No other file needs the exercise definition unless you **use** it in a program.

**Where it appears after adding to a program:**

- Template select dropdown (indirectly — via session exercise count)
- Draft preview (section accordion exercise list)
- Active workout (section exercise buttons + set logger)
- Completed workout detail modal
- Timeline / analytics (exercise counts, set stats)

If an `exerciseId` in a program is missing from the catalog, the UI falls back to showing the raw id string.

---

# 2. Modifying a Workout Program

**File:** `src/data/workoutTemplates/programs.ts`

Programs are built from helpers:

- `slot(exerciseId, sortOrder, prescription?, notes?)` — one exercise slot
- `section(id, name, sortOrder, exercises[], options?)` — one section
- Export a `WorkoutTemplate` constant (e.g. `UPPER_BODY_TEMPLATE`)

### Section structure

Sections are organizational only. They control:

- Collapsible groups in the Workout panel
- Per-section progress (completed / remaining exercises and sets)
- Exercise ordering within the program

**Upper Body example (current):**

| Section | Contents |
|---------|----------|
| Push-ups & Arms | Push-up variants and dumbbell arm exercises **alternating** in `sortOrder` |
| Dumbbell Back | Rows, pullover, raises |
| Stretching | Shoulder, spine, splits |

To reorder exercises, change `sortOrder` on each `slot()`. To combine or split sections, add/remove `section()` blocks.

### Prescription options

Per-exercise metadata via `ExercisePrescription` (not every field required):

| Field | Use for |
|-------|---------|
| `targetLabel` | Display hint in UI ("10 reps", "1 minute hold") |
| `setCount` | Number of set slots (overrides section default) |
| `sets[]` | Variable schemes e.g. `[{ reps: 25 }, { reps: 10 }]` |
| `sets[].weight` | Planned weight (lb) — prefills the weight picker when logging |
| `sets[].reps` | Planned reps — prefills the reps picker when logging |
| `sets[].durationSeconds` | Timed holds — enables exercise timer in active workout |
| `restAfterSetSeconds` | Rest after each set of this exercise |
| `restAfterExerciseSeconds` | Rest after all sets of this exercise complete |
| `toFailure`, `perLeg`, `perSide`, `bothArms` | Set notes / semantics |
| `notes` | Extra cue text |

Section-level defaults:

- `setCount` — applied when a slot omits its own count
- `repsLabel` — fallback display label

Template-level options:

- `estimatedDurationMinutes`
- `restBetweenSetsSeconds`, `restBetweenExercisesSeconds`
- `circuitRounds`, `circuitRestSeconds` (legacy — prefer **Circuit Block**; see [WORKOUT_BLOCKS.md](WORKOUT_BLOCKS.md))

### Planned reps and weight

Set planned values on individual sets in `sets[]`:

```typescript
slot('squat', 1, {
  targetLabel: '5 / 5 / 10 / 25 reps',
  sets: [
    { reps: 5, weight: 225 },
    { reps: 5, weight: 225 },
    { reps: 10, weight: 185 },
    { reps: 25, weight: 135 },
  ],
}),
```

When logging starts, the Workout panel **prefills** weight and reps from `set.target.plannedWeight` / `plannedReps` (or legacy `fields`). The user can change either value before tapping **Log**. If no planned value exists, the panel keeps its default inputs (135 lb / 8 reps).

For circuits, use structured **blocks** — see [WORKOUT_BLOCKS.md](WORKOUT_BLOCKS.md).

---

# 3. Registering Programs

**File:** `src/data/workoutTemplates.ts`

Add your exported template to `DEFAULT_WORKOUT_TEMPLATES`:

```typescript
export const DEFAULT_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  UPPER_BODY_TEMPLATE,
  LOWER_BODY_TEMPLATE,
  CORE_TEMPLATE,
  REHABILITATION_TEMPLATE,
  // MY_NEW_TEMPLATE,
]
```

The template `id` becomes the value in the Workout panel dropdown.

---

# 4. Refreshing Saved Templates

Templates are copied into `localStorage` on first load. If you edit `programs.ts` but still see old structure:

1. **Bump** `WORKOUT_SCHEMA_VERSION` in `src/types/workout.ts` (currently `9`).
2. On next app load, `mergeWorkoutState()` replaces stored templates with `DEFAULT_WORKOUT_TEMPLATES`.

Alternatively, use DevTools → **Clear Workout Data** to reset workout state entirely.

**Note:** Bumping schema version does **not** alter in-progress or completed sessions — only the template library used for *new* sessions.

---

# 5. Files That Should NOT Need Changes

For typical exercise/program edits, these read from data automatically:

| File | Role |
|------|------|
| `src/features/workout/WorkoutPanel.tsx` | Renders `session.sections` |
| `src/features/workout/WorkoutDetailModal.tsx` | Renders `activity.sections` |
| `src/features/workout/workoutTemplateLogic.ts` | Builds session logs from any template |
| `src/features/workout/workoutProgress.ts` | Section + session progress |
| `src/store/gameStore.ts` | `createWorkoutSession()` uses template data |

Only touch UI/logic files when adding **new behavior** (e.g. a new prescription type the UI must display differently).

---

# 6. Checklist After Editing Programs

1. `npm run build` — catches missing exercise ids and syntax errors
2. DevTools → Clear Workout Data (or bump schema version)
3. Create Workout Session → verify draft section list and order
4. Start Workout → verify collapsible sections and set counts
5. Complete a workout → verify detail modal grouping

---

# 8. Quest Resolution (not in programs.ts)

Workout quests are **objectives**; activities are **records**. Template → quest mapping is on quest definitions in `src/data/quests.ts`:

```typescript
acceptedWorkoutTemplates: ['upper-body', 'lower-body']  // Workout quest
acceptedWorkoutTemplates: ['core']                        // Core quest
acceptedWorkoutTemplates: ['rehabilitation']              // Rehab quest
```

Resolution logic: `src/features/workout/workoutQuestResolution.ts` — called from `completeWorkout()` in the store.

Adding a template that should satisfy a quest: add its `id` to the quest's `acceptedWorkoutTemplates` array. No UI changes required.

---

Defined in `src/data/workoutTemplates/programs.ts`:

| ID | Name | Sections |
|----|------|----------|
| `upper-body` | Upper Body | Push-ups & Arms, Dumbbell Back, Stretching |
| `lower-body` | Lower Body | Main, Stretching |
| `core` | Core | Circuit |
| `rehabilitation` | Rehabilitation | Exercises |

For timed exercises, rest periods, and timer behavior see **[WORKOUT_TIMING.md](WORKOUT_TIMING.md)**.
