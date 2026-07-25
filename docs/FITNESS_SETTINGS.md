# Fitness Settings

Version: aligned with Ascendant v0.0.4

Player-configurable fitness preferences. Persisted on `GameState.fitnessSettings` (save version **0.0.9**).

---

# Settings

| Setting | Notes |
|---------|-------|
| Daily protein target (g) | Synced to `nutrition.targets.proteinGrams` |
| Daily calorie target | Synced to `nutrition.targets.calories` |
| Daily water target (ml) | Placeholder — water logging not yet implemented |
| Weight unit | `lb` or `kg` |
| Distance unit | `mi` or `km` |
| Duration display | `minutes` or `hours` |
| Workout preferences | Extension point (default template, etc.) |

---

# Architecture

```
FitnessSettingsPanel
    ↓
updateFitnessSettings()  (gameStore)
    ↓
fitnessSettingsLogic.applyFitnessSettingsPatch()
    ↓
nutrition.targets (mirrored for analytics / quest protein check)
```

- Types: `src/types/fitnessSettings.ts`
- Defaults: `src/data/defaultFitnessSettings.ts`
- Logic: `src/features/settings/fitnessSettingsLogic.ts`
- UI: `src/features/settings/FitnessSettingsPanel.tsx`

Migration `0.0.8 → 0.0.9` seeds `fitnessSettings` from existing `nutrition.targets` when present.

---

# Related

- [NUTRITION.md](NUTRITION.md) — meal logging and protein-target quest
- [WORKOUT.md](WORKOUT.md) — workout execution
- [COACHING.md](COACHING.md) — progression recommendations
