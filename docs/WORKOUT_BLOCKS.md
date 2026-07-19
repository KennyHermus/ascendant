# Workout Blocks & Circuits

Version: aligned with Ascendant v0.0.4

See also: [WORKOUT.md](WORKOUT.md), [WORKOUT_DATA.md](WORKOUT_DATA.md), [WORKOUT_TIMING.md](WORKOUT_TIMING.md)

---

# Workout Block Architecture

Programs are composed of reusable **Workout Blocks** — the foundation for circuits, supersets, interval training, EMOM, AMRAP, and other future formats without redesigning the session model.

| Block type | Purpose |
|------------|---------|
| **Exercise** | Single catalog exercise + prescription |
| **Circuit** | Ordered exercises repeated N times with optional rest between rounds |
| **Rest** | Standalone rest interval (future programs) |
| **Section** | Nested block container (future complex programs) |

Types: `src/types/workout.ts`  
Block resolution + circuit progress: `src/features/workout/workoutBlockLogic.ts`  
Session building: `src/features/workout/workoutTemplateLogic.ts`

---

# Backward Compatibility

Templates may use either:

1. **Structured blocks** — `section.blocks[]` (preferred for circuits)
2. **Legacy flat lists** — `section.exercises[]` + optional template-level `circuitRounds` / `circuitRestSeconds`

Legacy circuit settings are converted to a **Circuit Block** automatically at session creation.

---

# Circuit Representation

Circuits no longer duplicate every exercise in the session list.

**Before (legacy):** 7 exercises × 2 rounds = 14 exercise rows  
**After:** 7 exercise rows, each with 2 round-tagged sets

UI shows:

```
Circuit 1 / 2
↻ Repeat 2× · 30s rest between rounds
  Knee to Elbow Crunch
  Scissors
  ...
```

Each exercise logs one set per round (`circuitRound: 1`, `circuitRound: 2`, …). The active round’s set is shown in the logger.

---

# Circuit Progress

While performing a circuit, the Workout panel displays:

| Indicator | Example |
|-----------|---------|
| Circuit | `Circuit 1 / 2` |
| Exercise position | `Exercise 4 / 7` |
| Section progress | Existing per-section bars |
| Overall progress | Existing workout progress bar |

Session state: `WorkoutSession.circuitProgress` — current round, total rounds, ordered exercise log ids.

After completing the **last exercise** of a round:

1. Circuit rest timer starts (if configured)
2. Workout session timer **keeps running** during rest
3. On rest complete / skip → advance to next round
4. After final round → normal workout completion flow

---

# Circuit Rest Timer

Configured on the circuit block:

```typescript
{
  type: 'circuit',
  repeatCount: 2,
  restAfterCircuitSeconds: 30,
  exercises: [ /* ... */ ],
}
```

Or legacy template fields: `circuitRounds`, `circuitRestSeconds`.

Rest kind: `circuit` in `restPeriods[]`. Controls: Start (automatic) · Pause · Resume · Stop · Skip.

---

# Defining a Circuit (Core example)

**File:** `src/data/workoutTemplates/programs.ts`

```typescript
section('circuit', 'Circuit', 0, [], {
  blocks: [
    {
      type: 'circuit',
      id: 'core-circuit',
      sortOrder: 0,
      name: 'Core Circuit',
      repeatCount: 2,
      restAfterCircuitSeconds: 30,
      exercises: [
        slot('knee-to-elbow-crunch', 0, {
          targetLabel: '12 reps',
          sets: [{ reps: 12 }],
        }),
        // ...
      ],
    },
  ],
}),
```

Bump `WORKOUT_SCHEMA_VERSION` when changing default program structure.
