import { resolveSectionBlocks } from '@/features/workout/workoutBlockLogic'
import type {
  ExercisePrescription,
  ExerciseSetLog,
  PlannedSetTemplate,
  SessionExerciseLog,
  SessionSectionLog,
  WorkoutBlockTemplate,
  WorkoutTemplate,
  WorkoutTemplateExercise,
  WorkoutTemplateSection,
} from '@/types/workout'
import { DEFAULT_SETS_PER_EXERCISE } from '@/types/workout'

function makeSetLog(
  id: string,
  options?: {
    weight?: number
    reps?: number
    durationSeconds?: number
    completed?: boolean
    notes?: string
    circuitRound?: number
  },
): ExerciseSetLog {
  const fields: ExerciseSetLog['fields'] = {}
  if (options?.weight != null) fields.weight = options.weight
  if (options?.reps != null) fields.reps = options.reps
  if (options?.durationSeconds != null) fields.durationSeconds = options.durationSeconds
  return {
    id,
    fields,
    completed: options?.completed ?? false,
    notes: options?.notes,
    circuitRound: options?.circuitRound,
  }
}

export function formatPrescriptionLabel(
  prescription?: ExercisePrescription,
  section?: WorkoutTemplateSection,
): string | undefined {
  if (prescription?.targetLabel) return prescription.targetLabel
  if (prescription?.toFailure) return 'To failure'
  if (prescription?.sets?.some((s) => s.durationSeconds != null)) {
    const seconds = prescription.sets.find((s) => s.durationSeconds != null)?.durationSeconds
    if (seconds != null) return `${Math.round(seconds / 60)} min hold`
  }
  if (section?.repsLabel) return section.repsLabel
  if (prescription?.setCount != null) return `${prescription.setCount} sets`
  if (section?.setCount != null) return `${section.setCount} sets`
  return undefined
}

function buildExerciseTarget(
  prescription?: ExercisePrescription,
): SessionExerciseLog['target'] | undefined {
  const target: NonNullable<SessionExerciseLog['target']> = {}
  if (prescription?.durationSeconds != null) {
    target.plannedDurationSeconds = prescription.durationSeconds
  }
  if (prescription?.restAfterSetSeconds != null) {
    target.plannedRestAfterSetSeconds = prescription.restAfterSetSeconds
  }
  if (prescription?.restAfterExerciseSeconds != null) {
    target.plannedRestAfterExerciseSeconds = prescription.restAfterExerciseSeconds
  }
  return Object.keys(target).length > 0 ? target : undefined
}

function buildSetTarget(
  planned: PlannedSetTemplate,
  prescription?: ExercisePrescription,
  template?: WorkoutTemplate,
): ExerciseSetLog['target'] | undefined {
  const target: NonNullable<ExerciseSetLog['target']> = {}
  if (planned.durationSeconds != null) {
    target.plannedDurationSeconds = planned.durationSeconds
  } else if (prescription?.durationSeconds != null) {
    target.plannedDurationSeconds = prescription.durationSeconds
  }
  if (prescription?.restAfterSetSeconds != null) {
    target.plannedRestAfterSetSeconds = prescription.restAfterSetSeconds
  } else if (template?.restBetweenSetsSeconds != null) {
    target.plannedRestAfterSetSeconds = template.restBetweenSetsSeconds
  }
  if (planned.reps != null) target.plannedReps = planned.reps
  if (planned.weight != null) target.plannedWeight = planned.weight
  return Object.keys(target).length > 0 ? target : undefined
}

function plannedSetToLog(
  setId: string,
  planned: PlannedSetTemplate,
  prescription?: ExercisePrescription,
  template?: WorkoutTemplate,
  circuitRound?: number,
): ExerciseSetLog {
  const notes = [
    planned.label,
    circuitRound != null && circuitRound > 1 ? `Round ${circuitRound}` : null,
    planned.perLeg ? 'each leg' : null,
    planned.perSide ? 'each side' : null,
    planned.bothArms ? 'both arms' : null,
    planned.toFailure ? 'to failure' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  const log = makeSetLog(setId, {
    weight: planned.weight,
    reps: planned.reps,
    durationSeconds: planned.durationSeconds,
    completed: false,
    notes: notes || undefined,
    circuitRound,
  })

  const target = buildSetTarget(planned, prescription, template)
  return target ? { ...log, target } : log
}

function buildSetsForExercise(
  template: WorkoutTemplate,
  section: WorkoutTemplateSection,
  slot: WorkoutTemplateExercise,
  exerciseIndex: number,
  circuitRound?: number,
): ExerciseSetLog[] {
  const baseId = `${template.id}-${section.id}-${exerciseIndex}${
    circuitRound != null ? `-r${circuitRound}` : ''
  }`
  const prescription = slot.prescription

  if (prescription?.sets?.length) {
    return prescription.sets.map((planned, setIndex) =>
      plannedSetToLog(
        `${baseId}-set-${setIndex}`,
        planned,
        prescription,
        template,
        circuitRound,
      ),
    )
  }

  const setCount =
    prescription?.setCount ??
    section.setCount ??
    DEFAULT_SETS_PER_EXERCISE

  const sets: ExerciseSetLog[] = []
  for (let i = 0; i < setCount; i += 1) {
    const defaultReps = prescription?.toFailure
      ? undefined
      : prescription?.durationSeconds
        ? undefined
        : 10
    const log = makeSetLog(`${baseId}-set-${i}`, {
      reps: defaultReps,
      durationSeconds: prescription?.durationSeconds,
      completed: false,
      circuitRound,
      notes: [
        circuitRound != null && circuitRound > 1 ? `Round ${circuitRound}` : null,
        prescription?.perLeg ? 'each leg' : null,
        prescription?.toFailure ? 'to failure' : null,
      ]
        .filter(Boolean)
        .join(' · ') || undefined,
    })
    const target = buildSetTarget(
      { durationSeconds: prescription?.durationSeconds, reps: log.fields.reps },
      prescription,
      template,
    )
    sets.push(target ? { ...log, target } : log)
  }
  return sets
}

function buildCircuitSetsForExercise(
  template: WorkoutTemplate,
  section: WorkoutTemplateSection,
  slot: WorkoutTemplateExercise,
  exerciseIndex: number,
  repeatCount: number,
): ExerciseSetLog[] {
  const sets: ExerciseSetLog[] = []
  for (let round = 1; round <= repeatCount; round += 1) {
    const roundSets = buildSetsForExercise(template, section, slot, exerciseIndex, round)
    if (roundSets.length === 1) {
      sets.push(roundSets[0])
    } else {
      sets.push(
        ...roundSets.map((set, setIndex) => ({
          ...set,
          id: `${set.id}-circuit-${round}-set-${setIndex}`,
          circuitRound: round,
        })),
      )
    }
  }
  return sets
}

function buildExerciseLogFromSlot(
  template: WorkoutTemplate,
  section: WorkoutTemplateSection,
  slot: WorkoutTemplateExercise,
  exerciseIndex: number,
  sortOrder: number,
  options?: {
    blockId?: string
    blockType?: SessionExerciseLog['blockType']
    circuitRounds?: number
  },
): SessionExerciseLog {
  const sets =
    options?.circuitRounds != null && options.circuitRounds > 1
      ? buildCircuitSetsForExercise(
          template,
          section,
          slot,
          exerciseIndex,
          options.circuitRounds,
        )
      : buildSetsForExercise(template, section, slot, exerciseIndex)

  return {
    id: `exercise-log-${template.id}-${section.id}-${sortOrder}`,
    exerciseId: slot.exerciseId,
    sectionId: section.id,
    sortOrder,
    blockId: options?.blockId,
    blockType: options?.blockType,
    targetLabel: formatPrescriptionLabel(slot.prescription, section),
    target: buildExerciseTarget(slot.prescription),
    sets,
    notes: slot.notes,
  }
}

function buildExercisesFromBlock(
  template: WorkoutTemplate,
  section: WorkoutTemplateSection,
  block: WorkoutBlockTemplate,
  orderStart: number,
): {
  exercises: SessionExerciseLog[]
  nextOrder: number
  circuitMeta?: SessionSectionLog['circuitMeta']
} {
  switch (block.type) {
    case 'exercise': {
      const exercise = buildExerciseLogFromSlot(
        template,
        section,
        {
          exerciseId: block.exerciseId,
          sortOrder: block.sortOrder,
          prescription: block.prescription,
          notes: block.notes,
        },
        block.sortOrder,
        orderStart,
        { blockId: block.id, blockType: 'exercise' },
      )
      return { exercises: [exercise], nextOrder: orderStart + 1 }
    }
    case 'circuit': {
      const sorted = [...block.exercises].sort((a, b) => a.sortOrder - b.sortOrder)
      const exercises = sorted.map((slot, index) =>
        buildExerciseLogFromSlot(template, section, slot, index, orderStart + index, {
          blockId: block.id,
          blockType: 'circuit',
          circuitRounds: block.repeatCount,
        }),
      )
      return {
        exercises,
        nextOrder: orderStart + exercises.length,
        circuitMeta: {
          blockId: block.id,
          repeatCount: block.repeatCount,
          restAfterCircuitSeconds: block.restAfterCircuitSeconds,
          label: block.name,
        },
      }
    }
    case 'rest':
    case 'section':
      return { exercises: [], nextOrder: orderStart }
  }
}

export function sessionLogsFromTemplate(template: WorkoutTemplate): SessionSectionLog[] {
  return [...template.sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((section) => {
      const blocks = resolveSectionBlocks(section, template)
      const exercises: SessionExerciseLog[] = []
      let order = 0
      let circuitMeta: SessionSectionLog['circuitMeta']

      for (const block of blocks) {
        const built = buildExercisesFromBlock(template, section, block, order)
        exercises.push(...built.exercises)
        order = built.nextOrder
        if (built.circuitMeta) circuitMeta = built.circuitMeta
      }

      return {
        id: `section-log-${template.id}-${section.id}`,
        sectionId: section.id,
        name: section.name,
        sortOrder: section.sortOrder,
        exercises,
        circuitMeta,
      }
    })
}

export function flattenSessionSections(sections: SessionSectionLog[]): SessionExerciseLog[] {
  return [...sections]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .flatMap((section) =>
      [...section.exercises].sort((a, b) => a.sortOrder - b.sortOrder),
    )
}

export function syncSessionExercises(session: {
  sections: SessionSectionLog[]
  exercises?: SessionExerciseLog[]
}): SessionExerciseLog[] {
  const flattened = flattenSessionSections(session.sections)
  return flattened.length > 0 ? flattened : session.exercises ?? []
}

/** Default weight/reps for the active set — used to prefill logging inputs. */
export function getDefaultSetInputValues(
  set: ExerciseSetLog | null | undefined,
): { weight?: number; reps?: number } {
  if (!set) return {}
  return {
    weight: set.target?.plannedWeight ?? set.fields.weight,
    reps: set.target?.plannedReps ?? set.fields.reps,
  }
}
