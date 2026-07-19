import type {
  CircuitBlockTemplate,
  CircuitProgress,
  ExerciseSetLog,
  SessionExerciseLog,
  SessionSectionLog,
  WorkoutBlockTemplate,
  WorkoutSession,
  WorkoutTemplate,
  WorkoutTemplateSection,
} from '@/types/workout'

/** Resolve structured blocks from a section, converting legacy flat + circuitRounds data. */
export function resolveSectionBlocks(
  section: WorkoutTemplateSection,
  template: WorkoutTemplate,
): WorkoutBlockTemplate[] {
  if (section.blocks?.length) {
    return [...section.blocks].sort((a, b) => a.sortOrder - b.sortOrder)
  }

  const sortedExercises = [...section.exercises].sort((a, b) => a.sortOrder - b.sortOrder)
  const rounds = Math.max(1, template.circuitRounds ?? 1)

  if (rounds > 1 && sortedExercises.length > 0) {
    const circuitBlock: CircuitBlockTemplate = {
      type: 'circuit',
      id: `${section.id}-circuit`,
      sortOrder: 0,
      name: section.name,
      repeatCount: rounds,
      restAfterCircuitSeconds: template.circuitRestSeconds,
      exercises: sortedExercises,
    }
    return [circuitBlock]
  }

  return sortedExercises.map((slot, index) => ({
    type: 'exercise' as const,
    id: `${section.id}-exercise-${index}`,
    sortOrder: index,
    exerciseId: slot.exerciseId,
    prescription: slot.prescription,
    notes: slot.notes,
  }))
}

export function getCircuitBlockFromSection(
  section: WorkoutTemplateSection,
  template: WorkoutTemplate,
): CircuitBlockTemplate | null {
  const blocks = resolveSectionBlocks(section, template)
  const circuit = blocks.find((block): block is CircuitBlockTemplate => block.type === 'circuit')
  return circuit ?? null
}

export function getCurrentRoundSet(
  exercise: SessionExerciseLog,
  round: number,
): ExerciseSetLog | undefined {
  if (exercise.sets.some((set) => set.circuitRound != null)) {
    return exercise.sets.find((set) => (set.circuitRound ?? 1) === round)
  }
  return exercise.sets.find((set) => !set.completed) ?? exercise.sets[0]
}

export function isRoundSetComplete(exercise: SessionExerciseLog, round: number): boolean {
  const set = getCurrentRoundSet(exercise, round)
  return set?.completed ?? false
}

export function isExerciseInActiveCircuit(
  exercise: SessionExerciseLog,
  progress: CircuitProgress | null | undefined,
): boolean {
  return progress != null && exercise.blockId === progress.blockId
}

export function isCircuitRoundComplete(
  session: WorkoutSession,
  progress: CircuitProgress,
): boolean {
  return progress.exerciseLogIds.every((exerciseLogId) => {
    const exercise = session.exercises.find((entry) => entry.id === exerciseLogId)
    return exercise != null && isRoundSetComplete(exercise, progress.currentRound)
  })
}

export function isLastExerciseInCircuitRound(
  progress: CircuitProgress,
  exerciseLogId: string,
): boolean {
  return progress.exerciseLogIds[progress.exerciseLogIds.length - 1] === exerciseLogId
}

export function advanceCircuitRound(session: WorkoutSession): WorkoutSession {
  if (!session.circuitProgress) return session
  const { currentRound, totalRounds } = session.circuitProgress
  if (currentRound >= totalRounds) return session

  return {
    ...session,
    circuitProgress: {
      ...session.circuitProgress,
      currentRound: currentRound + 1,
    },
  }
}

export function findCurrentCircuitExerciseIndex(
  session: WorkoutSession,
  progress: CircuitProgress,
): number {
  for (let index = 0; index < progress.exerciseLogIds.length; index += 1) {
    const exerciseLogId = progress.exerciseLogIds[index]
    const exercise = session.exercises.find((entry) => entry.id === exerciseLogId)
    if (exercise && !isRoundSetComplete(exercise, progress.currentRound)) {
      return index
    }
  }
  return progress.exerciseLogIds.length
}

export function findCurrentExerciseLogId(
  session: WorkoutSession,
): string | null {
  if (session.circuitProgress) {
    const progress = session.circuitProgress
    for (const exerciseLogId of progress.exerciseLogIds) {
      const exercise = session.exercises.find((entry) => entry.id === exerciseLogId)
      if (exercise && !isRoundSetComplete(exercise, progress.currentRound)) {
        return exerciseLogId
      }
    }
    return null
  }

  const incomplete = session.exercises.find((exercise) =>
    exercise.sets.some((set) => !set.completed),
  )
  return incomplete?.id ?? null
}

export function getVisibleSetsForExercise(
  exercise: SessionExerciseLog,
  circuitProgress: CircuitProgress | null | undefined,
): ExerciseSetLog[] {
  if (isExerciseInActiveCircuit(exercise, circuitProgress) && circuitProgress) {
    const roundSet = getCurrentRoundSet(exercise, circuitProgress.currentRound)
    return roundSet ? [roundSet] : exercise.sets
  }
  return exercise.sets
}

export function isExerciseCompleteForDisplay(
  exercise: SessionExerciseLog,
  circuitProgress: CircuitProgress | null | undefined,
): boolean {
  if (isExerciseInActiveCircuit(exercise, circuitProgress) && circuitProgress) {
    return isRoundSetComplete(exercise, circuitProgress.currentRound)
  }
  return exercise.sets.every((set) => set.completed)
}

export function buildInitialCircuitProgress(
  section: SessionSectionLog,
): CircuitProgress | null {
  if (!section.circuitMeta) return null

  const exerciseLogIds = [...section.exercises]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .filter((exercise) => exercise.blockId === section.circuitMeta?.blockId)
    .map((exercise) => exercise.id)

  if (exerciseLogIds.length === 0) return null

  return {
    blockId: section.circuitMeta.blockId,
    sectionId: section.sectionId,
    currentRound: 1,
    totalRounds: section.circuitMeta.repeatCount,
    restAfterCircuitSeconds: section.circuitMeta.restAfterCircuitSeconds,
    exerciseLogIds,
  }
}
