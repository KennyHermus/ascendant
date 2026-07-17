import {
  COMPLETION_GRADE_MULTIPLIERS,
  type CompletionGrade,
} from '@/types/completion'
import type { QuestDefinition } from '@/types/quest'
import { evaluateQuestTimingForDay } from '@/features/quests/questTiming'
import { getHeroDayKeyForTimestamp } from '@/lib/timeService'
import { parseCalendarDateKey } from '@/lib/timeService'

export interface CompletionGradeResult {
  grade: Exclude<CompletionGrade, 'missed'>
  minutesOffset: number
  multiplier: number
}

function buildTargetOnHeroDay(
  targetTime: string,
  heroDayKey: string,
): Date {
  const [hours, minutes] = targetTime.split(':').map(Number)
  const day = parseCalendarDateKey(heroDayKey)
  const target = new Date(day)
  target.setHours(hours, minutes, 0, 0)
  if (hours === 0 && minutes === 0) {
    target.setDate(target.getDate() + 1)
  }
  return target
}

/**
 * Evaluates completion grade and reward multiplier at completion time.
 * Untimed quests always return `completed` × 1.0.
 */
export function evaluateCompletionGrade(
  definition: QuestDefinition,
  completedAt: Date,
  heroDayKey: string = getHeroDayKeyForTimestamp(completedAt.toISOString()),
): CompletionGradeResult {
  if (!definition.timing) {
    return { grade: 'completed', minutesOffset: 0, multiplier: 1.0 }
  }

  const target = buildTargetOnHeroDay(definition.timing.targetTime, heroDayKey)
  const graceEnd = new Date(
    target.getTime() + definition.timing.graceMinutes * 60_000,
  )
  const offsetMs = completedAt.getTime() - target.getTime()
  const minutesOffset = Math.round(offsetMs / 60_000)

  if (completedAt.getTime() < target.getTime()) {
    return {
      grade: 'perfect',
      minutesOffset,
      multiplier: COMPLETION_GRADE_MULTIPLIERS.perfect,
    }
  }

  if (completedAt.getTime() <= graceEnd.getTime()) {
    return {
      grade: 'onTime',
      minutesOffset,
      multiplier: COMPLETION_GRADE_MULTIPLIERS.onTime,
    }
  }

  return {
    grade: 'completed',
    minutesOffset,
    multiplier: COMPLETION_GRADE_MULTIPLIERS.completed,
  }
}

/** Apply grade multiplier deterministically (rounded to integer for XP/gold). */
export function applyGradeMultiplier(base: number, multiplier: number): number {
  return Math.round(base * multiplier)
}

/** For UI: current timing phase label independent of completion grade. */
export function getTimingPhaseForDisplay(
  definition: QuestDefinition,
  heroDayKey: string,
  now: Date,
): ReturnType<typeof evaluateQuestTimingForDay> | null {
  if (!definition.timing) return null
  return evaluateQuestTimingForDay(definition.timing, heroDayKey, now)
}
