import {
  CORE_TEMPLATE,
  LOWER_BODY_TEMPLATE,
  REHABILITATION_TEMPLATE,
  UPPER_BODY_TEMPLATE,
} from '@/data/workoutTemplates/programs'
import type { WorkoutTemplate } from '@/types/workout'

/** Default workout programs — copied into persisted state on first load / schema upgrade. */
export const DEFAULT_WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  UPPER_BODY_TEMPLATE,
  LOWER_BODY_TEMPLATE,
  CORE_TEMPLATE,
  REHABILITATION_TEMPLATE,
]
