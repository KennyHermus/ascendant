# Workout Timing

Version: aligned with Ascendant v0.0.4 (Fitness — timing)

See also: [WORKOUT.md](WORKOUT.md), [WORKOUT_DATA.md](WORKOUT_DATA.md)

---

# Three Separate Time Systems

Ascendant treats these as **independent** concepts. Do not merge them.

| System | Source | Purpose |
|--------|--------|---------|
| **Hero Time** | `src/lib/gameTime.ts` | In-game calendar clock — quests, Hero Days, history timestamps, analytics dates |
| **Workout Session Timer** | `src/lib/workoutWallClock.ts` (`Date.now()`) | Total workout duration |
| **Activity Timers** | Same wall clock | Per-exercise hold timers and rest timers |

**Rules:**

- Freezing or advancing Hero Time does **not** affect workout timers.
- Workout start/completion timestamps use Hero Time ISO strings.
- Elapsed workout duration reflects real time spent training (wall clock).

---

# Workout Session Timer

**Logic:** `src/features/workout/workoutTimingLogic.ts`  
**UI hook:** `src/features/workout/useWorkoutTimer.ts`  
**State:** `WorkoutSession.sessionTimer` (`WallClockTimer`)

| Event | Behavior |
|-------|----------|
| Start workout | Timer starts (`status: in_progress`) |
| Pause workout | Session timer pauses |
| Resume workout | Session timer resumes |
| Enter review | Session timer pauses automatically |
| Back from review | Session timer **stays paused**; status becomes `paused` with Resume visible |
| Resume workout | Session timer resumes (restores `in_progress` or `ready_for_review`) |
| Final exercise completed | Auto-enters review (timer pauses) |
| Complete workout | Timer stops permanently; `completedElapsedMs` stored |

Legacy saves without `sessionTimer` are migrated on load via `migrateSessionTiming()`.

---

# Timed Exercises

An exercise set is **timed** when its prescription includes `durationSeconds` (or equivalent target metadata).

**Examples in current data:** High Plank (60s hold) in Upper Body.

**Controls:** Start · Pause · Resume · Stop

| Behavior | Detail |
|----------|--------|
| Target reached | Visual indicator only — timer keeps running |
| Stop | Records actual duration on the set (`fields.durationSeconds`, `execution`) |
| Continue past target | Allowed until Stop |

**State:** `WorkoutSession.activeExerciseTimer`  
**UI:** `ExerciseTimerPanel` in `WorkoutPanel` (beneath exercise controls)

---

# Rest Timers

Optional rest periods from template metadata:

| Source | Field |
|--------|-------|
| Template | `restBetweenSetsSeconds`, `restBetweenExercisesSeconds`, `circuitRestSeconds` |
| Exercise prescription | `restAfterSetSeconds`, `restAfterExerciseSeconds` |
| Set prescription | `restAfterSetSeconds` on individual sets |

Rest starts automatically after logging an untimed set or stopping a timed exercise (when still `in_progress`).

**Circuit rest** starts when the last exercise of a circuit round is completed and more rounds remain. See [WORKOUT_BLOCKS.md](WORKOUT_BLOCKS.md).

**Controls:** Start (automatic) · Pause · Resume · Stop · Skip

The **workout session timer keeps running** during rest.

**State:** `WorkoutSession.activeRestTimer` (live), `WorkoutSession.restPeriods[]` (completed logs)  
**UI:** `RestTimerPanel` in `WorkoutPanel`

---

# Timing Metadata (Planned vs Actual)

## Exercise Target (planned)

Built from template prescription in `workoutTemplateLogic.ts`:

- `plannedReps`, `plannedWeight`, `plannedSets`, `plannedDurationSeconds`
- `plannedRestAfterSetSeconds`, `plannedRestAfterExerciseSeconds`

Stored on `SessionExerciseLog.target` and `ExerciseSetLog.target`.

## Exercise Execution (actual)

Recorded at log/stop time:

- `startedAt`, `endedAt` — Hero Time ISO timestamps
- `elapsedMs` — wall-clock duration
- `actualDurationSeconds` — timed exercises
- `actualReps`, `actualWeight` — rep-based sets (via `fields`)

Stored on `ExerciseSetLog.execution` and optionally `SessionExerciseLog.execution`.

## Rest Period Log

Each completed rest in `restPeriods[]`:

- `kind`: `set` | `exercise` | `circuit` | `section`
- `plannedSeconds`, `actualSeconds`
- `startedAt`, `endedAt`, `elapsedMs`

This data supports future analytics (average rest, pacing, time per section) — not computed yet.

---

# Configuring Timing in Templates

**File:** `src/data/workoutTemplates/programs.ts`

### Timed exercise (hold)

```typescript
slot('high-plank', 12, {
  targetLabel: '1 minute hold',
  setCount: 1,
  sets: [{ durationSeconds: 60 }],
})
```

### Rest between sets / exercises (template level)

```typescript
export const LOWER_BODY_TEMPLATE: WorkoutTemplate = {
  // ...
  restBetweenSetsSeconds: 30,
  restBetweenExercisesSeconds: 30,
}
```

### Per-exercise rest override

```typescript
slot('squat', 1, {
  targetLabel: '5 reps',
  restAfterSetSeconds: 45,
  restAfterExerciseSeconds: 60,
})
```

### Circuit rest (Circuit Block)

```typescript
{
  type: 'circuit',
  repeatCount: 2,
  restAfterCircuitSeconds: 30,
  exercises: [ /* ... */ ],
}
```

Legacy equivalent: `circuitRestSeconds` on the template root.

---

Bump `WORKOUT_SCHEMA_VERSION` in `src/types/workout.ts` when changing default template timing materially.

---

# Hero Time DevTools

**UI:** DevTools → Hero Time section  
**Persistence:** `GameState.devHeroTime` (`HeroTimePersistedConfig`)

| Mode | Badge | Behavior |
|------|-------|----------|
| Live | Live | Real calendar clock |
| Simulated (running) | Simulated (running) | Hero Time advances with real time from anchor |
| Simulated (frozen) | Simulated (frozen) | Hero Time fixed at frozen instant |

Controls: Enable Simulation · Jump (datetime-local) · Quick advance · Freeze · Resume Progression · Reset to Live

---

# Key Files

| File | Role |
|------|------|
| `src/lib/gameTime.ts` | Hero Time provider |
| `src/lib/workoutWallClock.ts` | Wall-clock timer primitives |
| `src/features/workout/workoutTimingLogic.ts` | Session / exercise / rest timer state machines |
| `src/features/workout/components/WorkoutTimerPanels.tsx` | Exercise + rest timer UI |
| `src/features/workout/useWorkoutTimer.ts` | Live elapsed labels |
| `src/store/gameStore.ts` | Actions + persistence |
| `src/types/workout.ts` | Timing types, schema version |

---

# Remaining Future Work

- Analytics: average exercise duration, rest duration, pacing, time per section
- Section-end rest triggers (`kind: section`)
- Rest Block and Section Block UI in active workouts
- Additional timed holds (Plank, Wall Sit, Dead Hang) in template data
