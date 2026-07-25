# Exercise Progression Engine

Version: aligned with Ascendant v0.0.4

See also: [PERFORMANCE.md](PERFORMANCE.md), [WORKOUT.md](WORKOUT.md), [WORKOUT_DATA.md](WORKOUT_DATA.md)

---

# Design Philosophy

The Progression Engine **coaches** — it never auto-edits workout templates or replaces user decisions.

```
Training History
    +
Official Personal Records
    +
Exercise Families
    +
Exercise Roles
    +
Exercise Prerequisites
    ↓
Coaching Recommendation
```

Recommendations use **multiple workouts** and long-term trends — not isolated sessions.

---

# Three Training Layers

| Layer | Role |
|-------|------|
| **Training** (`WorkoutActivity`) | Records execution data |
| **Performance Assessment** | Establishes / updates Official PRs |
| **Coaching Recommendation** | Suggests next steps — informational only |

Normal workouts never overwrite Official PRs. Coaching never modifies templates.

---

# Exercise Families

Families group related catalog exercises under a benchmark exercise id.

Data: `src/data/exerciseFamilies.ts`

Example — **Push-up Family** includes foundation through advanced skill variants (Tiger Bend, One-arm, Planche).

Official PRs anchor to the family benchmark (`push-ups`). Coaching uses family breadth for consistency recommendations.

---

# Exercise Roles

Each exercise defines one or more roles describing **why** it exists in training.

| Role | Example |
|------|---------|
| `foundation` | Push-ups, Bicep Curl |
| `variation` | Diamond Push-ups, Hammer Curl |
| `strength` | Weighted Push-ups |
| `power` | Clap Push-ups |
| `skill` | Tiger Bend, One-arm, Planche Push-ups |
| `accessory` | Concentration Curl |

Data: `src/data/exerciseRoles.ts`

---

# Exercise Prerequisites

Advanced exercises use **prerequisites** instead of linear progression paths.

Meeting prerequisites means the hero is **ready to begin practicing** — foundational exercises are never replaced.

Examples (`src/data/exercisePrerequisites.ts`):

| Exercise | Prerequisites |
|----------|----------------|
| Tiger Bend Push-ups | Push-up benchmark, shoulder strength, triceps strength, recommended PR |
| One-arm Push-ups | Push-up benchmark, arm strength, core stability, balance |
| Planche Push-ups | Pseudo planche practice, core/shoulder/wrist strength |

Resolver: `src/features/progression/prerequisiteLogic.ts`

---

# Coaching Recommendations

| Kind | Example |
|------|---------|
| `increase_weight` | Increase Bicep Curl to 35 lb |
| `increase_reps` | Increase Push-ups target reps |
| `maintain_training` | Performance tracking well against plan |
| `reduce_weight` | Load too heavy for planned reps |
| `recommend_assessment` | Consider a Push-up Performance Assessment |
| `introduce_advanced_exercise` | Ready to practice Tiger Bend Push-ups |
| `improve_consistency` | Long gap since last workout |
| `add_recovery` | Many workouts in the last 7 days |

Each recommendation includes:

- **Title** and **message** (user-facing)
- **Reason** (evidence from trends)
- **Confidence**: `low` | `medium` | `high` | `very_high` (no percentages)

Engine: `src/features/progression/progressionEngineLogic.ts`  
Trend analysis: `src/features/progression/trainingAnalysisLogic.ts`

---

# Training Analysis

Analyzes trends across recent workouts (default lookback: 6 sessions, minimum 3 for load recommendations):

- Planned vs actual reps (`set.target.plannedReps` vs `set.fields.reps`)
- Planned vs actual weight
- Workout frequency and consistency
- Family exercise breadth
- Official PRs and assessment recency

---

# Workout Integration

The Workout panel displays coaching banners per exercise during active logging.

Component: `src/features/progression/components/CoachingRecommendationBanner.tsx`

Recommendations are **informational only** — the user controls all logging decisions.

---

# Persistence

Save version **0.0.7** adds `GameState.coaching`:

```typescript
{
  schemaVersion: number
  activeRecommendations: CoachingRecommendation[]
  recommendationHistory: CoachingRecommendationHistoryEntry[]
  lastGeneratedAt: string | null
}
```

History is append-only (deduped per hero day + signature).  
Regenerated after workout completion, assessment completion, and on first load when history exists but coaching was never run.

---

# Hero Timeline

`COACHING_RECOMMENDATION` events appear under **Progress** filter for high-confidence recommendations:

```
🎯 Coach Recommendation · Ready for Tiger Bend Push-ups
```

---

# Analytics

`PeriodAnalytics.progression` exposes:

- `totalRecommendations`
- `recentRecommendations`
- `mostFrequentKinds`
- `mostActiveFamilies`
- `confidenceDistribution`
- `activeRecommendationCount`

Logic: `src/features/progression/progressionAnalyticsLogic.ts`

---

# Future Extensions

Stubbed — not implemented:

| Feature | File |
|---------|------|
| Estimated PRs | `progressionExtensionPoints.ts` |
| Training readiness | `masteryExtensionPoints.ts` |
| Recovery / fatigue | `masteryExtensionPoints.ts` |
| Adaptive workout generation | `masteryExtensionPoints.ts` |
| Exercise Mastery | `masteryExtensionPoints.ts` |
| Weekly Performance Sessions | `progressionExtensionPoints.ts` |

**Exercise Mastery** (future) measures long-term proficiency — distinct from peak Personal Records. The architecture reserves inputs for consistency, volume, assessments, PRs, frequency, and recommendations followed.

---

# Key Files

| File | Role |
|------|------|
| `src/types/progression.ts` | Types, confidence, recommendation kinds |
| `src/data/exerciseRoles.ts` | Role definitions |
| `src/data/exercisePrerequisites.ts` | Advanced exercise prerequisites |
| `src/features/progression/progressionEngineLogic.ts` | Recommendation generation |
| `src/features/progression/trainingAnalysisLogic.ts` | Multi-workout trend analysis |
| `src/features/progression/prerequisiteLogic.ts` | Prerequisite evaluation |
| `src/features/progression/coachingProgressionLogic.ts` | State + pipeline |
| `src/features/progression/progressionSelectors.ts` | React selectors |
| `src/features/progression/masteryExtensionPoints.ts` | Future mastery hooks |

---

# Adding Advanced Exercises

1. Add exercise to `src/data/exercises.ts`
2. Add to family in `src/data/exerciseFamilies.ts`
3. Assign roles in `src/data/exerciseRoles.ts`
4. Define prerequisites in `src/data/exercisePrerequisites.ts`

Coaching for readiness appears automatically when prerequisites are met.
