# Performance & Personal Records

Version: aligned with Ascendant v0.0.4

See also: [WORKOUT.md](WORKOUT.md), [ACTIVITIES.md](ACTIVITIES.md), [PROGRESSION.md](PROGRESSION.md)

---

# Design Philosophy

Three distinct layers:

```
Training (WorkoutActivity)
    ↓ records execution data only
Performance Assessment (PerformanceAssessmentActivity)
    ↓ intentional benchmark testing
Official Personal Records
    ↓ progression benchmarks for future systems
```

**Normal workouts never overwrite Official PRs.** Training data feeds the future Progression Engine; assessments establish benchmarks.

---

# Hero Assessment Architecture

```
Hero Assessment (future domains)
    ↓
Fitness Assessment (implemented)
    ↓
Performance Assessment / Baseline Assessment
```

Future domains (not implemented): Nutrition, Learning, Financial, Wellness assessments.

Types: `src/types/performance.ts`  
State: `GameState.performance`

---

# Baseline Assessment

Recommended when no official benchmarks exist (`baselineCompletedAt == null` and no official records).

Establishes initial Official PRs for:

| Benchmark | Family | PR type |
|-----------|--------|---------|
| Push-ups | Push-up Family | Highest reps |
| Plank | Plank Family | Longest duration |
| Bodyweight squat | Squat Family | Highest reps |
| Bicep curl | Curl Family | Highest volume |
| Walking | Walking Endurance | Longest duration |

Implemented as a dedicated **Baseline Assessment** activity — not a workout template.

Definitions: `src/data/benchmarkAssessments.ts` (`includeInBaseline: true`)

---

# Performance Assessments

Intentional single-benchmark tests (Push-up Test, Plank Test, etc.).

Separate session lifecycle from `WorkoutSession`:

```
Start assessment → Log benchmark result → Complete assessment
    ↓
PerformanceAssessmentActivity persisted
    ↓
Official PR updated (if improved)
    ↓
PERSONAL_RECORD_ACHIEVED timeline event
```

UI: **Performance** panel on the Dashboard.

---

# Official Personal Records

Updated **only** from completed Baseline or Performance Assessments.

Each record stores:

- Exercise id (benchmark exercise)
- Exercise family id
- PR type
- Current / previous value
- Display values
- Date achieved
- Assessment reference

### Supported PR types

| Type | Use |
|------|-----|
| `highest_weight` | Max weight (lb) |
| `highest_reps` | Max repetitions |
| `longest_duration` | Longest hold/time (seconds) |
| `longest_distance` | Longest distance (meters) |
| `highest_volume` | Weight × reps |

Additional types can be added to `PR_TYPES` in `src/types/performance.ts`.

---

# Training Performance

`WorkoutActivity` continues to store:

- Actual weight, reps, duration, volume
- Full exercise/set logs

This data is **not** compared to Official PRs in v0.0.4. It will feed the Progression Engine later.

---

# Exercise Families

Families group related catalog exercises under one benchmark.

Example — **Push-up Family**:

- Benchmark: `push-ups`
- Members: `diamond-push-ups`, `wide-push-ups`, `archer-push-ups`, `weighted-push-ups`, `clap-push-ups`

Data: `src/data/exerciseFamilies.ts`

**Use stable exercise ids** from `src/data/exercises.ts` — never display names as keys.

Official PRs anchor to the family's `benchmarkExerciseId`.

---

# PR History

Append-only log in `performance.prHistory[]`. Previous records are never deleted.

Each entry: old value, new value, dates, assessment reference, exercise, PR type.

Powers future graphs, timeline views, and analytics rollups.

---

# Hero Timeline

`PERSONAL_RECORD_ACHIEVED` events appear under **Progress** filter:

```
🏆 New Personal Record · Push-ups · 42 reps → 48 reps
```

Logic: `recordPersonalRecordAchieved()` in `eventLogic.ts`

---

# Analytics

`AnalyticsInput.performance` feeds `getPerformanceAnalytics()`:

- `currentOfficialPrs`
- `recentPrs`
- `mostImprovedExercises`
- `totalPrsEarned`
- `baselineCompleted`
- `assessmentsCompleted`

Exposed on `PeriodAnalytics.performance`. No charts yet — data layer only.

---

# Progression Engine (future)

Extension points: `src/features/performance/progressionExtensionPoints.ts`

```typescript
getProgressionRecommendations(input)  // returns [] today
getEstimatedPrProjections(input)      // future estimated PRs
getPerformanceSessionScheduleHints()  // future retest recommendations
```

Future inputs combine **training history + Official PRs** for recommendations:

- Increase weight / reps
- Advance to harder exercise variations
- Recommend a Performance Assessment

Also reserved (not implemented): performance confidence, weekly performance sessions, training readiness, recovery metrics.

---

# Persistence

Save version **0.0.6** adds `GameState.performance`:

```typescript
{
  schemaVersion: number
  exerciseFamilies: ExerciseFamily[]
  officialRecords: OfficialPersonalRecord[]
  prHistory: PersonalRecordHistoryEntry[]
  assessments: PerformanceAssessmentActivity[]
  sessions: AssessmentSession[]
  activeSessionId: string | null
  baselineCompletedAt: string | null
}
```

Backward compatible — existing `WorkoutActivity` records unchanged.

---

# Adding Benchmark Assessments

1. Add exercise to `src/data/exercises.ts` if needed
2. Add/update family in `src/data/exerciseFamilies.ts`
3. Add definition to `src/data/benchmarkAssessments.ts`
4. Set `includeInBaseline: true` for baseline inclusion

No UI changes required for new single-benchmark tests.

---

# Key Files

| File | Role |
|------|------|
| `src/types/performance.ts` | Types, PR types, state shape |
| `src/data/exerciseFamilies.ts` | Family definitions |
| `src/data/benchmarkAssessments.ts` | Assessment catalog |
| `src/features/performance/assessmentLogic.ts` | Session lifecycle + completion pipeline |
| `src/features/performance/prLogic.ts` | PR comparison + updates |
| `src/features/performance/performanceAnalyticsLogic.ts` | Analytics selectors |
| `src/features/performance/progressionExtensionPoints.ts` | Future engine hooks |
| `src/features/performance/PerformancePanel.tsx` | Dashboard UI |
