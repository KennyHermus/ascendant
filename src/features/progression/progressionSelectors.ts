import { useMemo } from 'react'

import {
  getRecommendationsForExercise,
  getRecommendationsForFamily,
} from '@/features/progression/progressionEngineLogic'
import { getFamilyForExercise } from '@/features/performance/exerciseFamilyLogic'
import { useGameStore } from '@/store/gameStore'
import type { CoachingRecommendation } from '@/types/progression'

export function useCoachingRecommendationsForExercise(
  exerciseId: string,
): CoachingRecommendation[] {
  const activeRecommendations = useGameStore((s) => s.coaching.activeRecommendations)
  return useMemo(
    () => getRecommendationsForExercise(activeRecommendations, exerciseId),
    [activeRecommendations, exerciseId],
  )
}

export function useCoachingRecommendationsForFamily(
  exerciseFamilyId: string,
): CoachingRecommendation[] {
  const activeRecommendations = useGameStore((s) => s.coaching.activeRecommendations)
  return useMemo(
    () => getRecommendationsForFamily(activeRecommendations, exerciseFamilyId),
    [activeRecommendations, exerciseFamilyId],
  )
}

export function selectActiveCoachingRecommendations(state: {
  coaching: { activeRecommendations: CoachingRecommendation[] }
}): CoachingRecommendation[] {
  return state.coaching.activeRecommendations
}

export function selectCoachingRecommendationsForExercise(
  state: { coaching: { activeRecommendations: CoachingRecommendation[] } },
  exerciseId: string,
): CoachingRecommendation[] {
  return getRecommendationsForExercise(state.coaching.activeRecommendations, exerciseId)
}

export function selectCoachingRecommendationsForFamilyOfExercise(
  state: { coaching: { activeRecommendations: CoachingRecommendation[] } },
  exerciseId: string,
): CoachingRecommendation[] {
  const family = getFamilyForExercise(exerciseId)
  if (!family) return []
  return getRecommendationsForFamily(state.coaching.activeRecommendations, family.id)
}
